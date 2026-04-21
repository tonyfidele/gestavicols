import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { batchesTable, salesTable } from "@workspace/db";
import { eq, isNull, sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function fixBatchCurrentCounts() {
  try {
    const result = await db.execute(sql`
      UPDATE batches b
      SET current_count = b.initial_count - COALESCE(
        (SELECT SUM(s.quantity) FROM sales s WHERE s.batch_id = b.id AND s.deleted_at IS NULL),
        0
      )
      WHERE EXISTS (
        SELECT 1 FROM sales s WHERE s.batch_id = b.id AND s.deleted_at IS NULL
      )
    `);
    logger.info({ rowCount: result.rowCount }, "Batch current counts corrected from sales history");
  } catch (err) {
    logger.warn({ err }, "Could not auto-correct batch current counts on startup");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await fixBatchCurrentCounts();
});
