import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";


const port = Number(process.env.PORT) || 3000;

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

    logger.info({ rowCount: result.rowCount }, "Batch corrected");
  } catch (err) {
    logger.warn({ err }, "Batch fix failed");
  }
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ton-front.vercel.app"
    ],
    credentials: true,
  })
);
app.listen(port, async () => {
  logger.info({ port }, "Server running");
  await fixBatchCurrentCounts();
});