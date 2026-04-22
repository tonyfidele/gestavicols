import { and, eq, sum, isNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { batchesTable, dailyRecordsTable, salesTable } from "@workspace/db";

/**
 * Recalculates and persists the currentCount for a batch.
 * Formula: initialCount - totalMortality - totalAnimalsSold
 */
export async function recalcBatchCurrentCount(batchId: string): Promise<void> {
  const [batch] = await db
    .select({ initialCount: batchesTable.initialCount })
    .from(batchesTable)
    .where(eq(batchesTable.id, batchId));
  if (!batch) return;

  const [mortalityAgg] = await db
    .select({ total: sum(dailyRecordsTable.mortality) })
    .from(dailyRecordsTable)
    .where(eq(dailyRecordsTable.batchId, batchId));

  const [salesAgg] = await db
    .select({ total: sum(salesTable.quantity) })
    .from(salesTable)
    .where(and(eq(salesTable.batchId, batchId), isNull(salesTable.deletedAt)));

  const totalMortality = Number(mortalityAgg?.total ?? 0);
  const totalSold = Number(salesAgg?.total ?? 0);
  const newCount = Math.max(0, batch.initialCount - totalMortality - totalSold);
  const mortalityRate =
    batch.initialCount > 0 ? (totalMortality / batch.initialCount) * 100 : 0;

  await db
    .update(batchesTable)
    .set({ currentCount: newCount, mortalityRate })
    .where(eq(batchesTable.id, batchId));
}
