import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const port = Number(process.env.PORT || 3000);

async function fixBatchCurrentCounts() {
  try {
    const result = await db.execute(sql`
      UPDATE batches b
      SET
        current_count = GREATEST(0,
          b.initial_count
          - COALESCE((SELECT SUM(dr.mortality) FROM daily_records dr WHERE dr.batch_id = b.id), 0)
          - COALESCE((SELECT SUM(s.quantity) FROM sales s WHERE s.batch_id = b.id AND s.deleted_at IS NULL), 0)
        ),
        mortality_rate = CASE
          WHEN b.initial_count > 0 THEN
            COALESCE((SELECT SUM(dr.mortality) FROM daily_records dr WHERE dr.batch_id = b.id), 0)::float / b.initial_count * 100
          ELSE 0
        END
      WHERE b.deleted_at IS NULL
    `);

    logger.info(
      { rowCount: result.rowCount },
      "Batch current counts corrected from mortality + sales history"
    );
  } catch (err) {
    logger.warn({ err }, "Could not auto-correct batch current counts on startup");
  }
}

app.listen(port, () => {
  logger.info({ port }, "Server listening");

  void fixBatchCurrentCounts();
});