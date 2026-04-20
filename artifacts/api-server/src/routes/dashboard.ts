import { Router, type IRouter } from "express";
import { eq, and, isNull, count, sum, sql, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  farmsTable,
  batchesTable,
  salesTable,
  expensesTable,
  stockTable,
  dailyRecordsTable,
} from "@workspace/db";
import { GetDashboardStatsResponse } from "@workspace/api-zod";
import { requireAuth, requirePermission } from "../middlewares/auth";

const router: IRouter = Router();

router.get(
  "/dashboard/stats",
  requireAuth,
  requirePermission("ANALYTICS", "READ"),
  async (req, res): Promise<void> => {
    const user = req.user!;
    const tenantFilter = user.role !== "SUPER_ADMIN" ? user.tenantId : null;

    const farmConds = [isNull(farmsTable.deletedAt)];
    const batchConds = [isNull(batchesTable.deletedAt)];
    const saleConds = [isNull(salesTable.deletedAt)];
    const expenseConds = [isNull(expensesTable.deletedAt)];
    const stockConds = [isNull(stockTable.deletedAt)];

    if (tenantFilter) {
      farmConds.push(eq(farmsTable.tenantId, tenantFilter));
      batchConds.push(eq(batchesTable.tenantId, tenantFilter));
      saleConds.push(eq(salesTable.tenantId, tenantFilter));
      expenseConds.push(eq(expensesTable.tenantId, tenantFilter));
      stockConds.push(eq(stockTable.tenantId, tenantFilter));
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    const [farmCount] = await db.select({ count: count() }).from(farmsTable).where(and(...farmConds));
    const [batchCount] = await db.select({ count: count() }).from(batchesTable).where(and(...batchConds));
    const [activeBatchCount] = await db
      .select({ count: count() })
      .from(batchesTable)
      .where(and(...batchConds, eq(batchesTable.status, "ACTIF")));

    const [totalAnimals] = await db
      .select({ total: sum(batchesTable.currentCount) })
      .from(batchesTable)
      .where(and(...batchConds, eq(batchesTable.status, "ACTIF")));

    const [totalAnimalsSold] = await db
      .select({ total: sum(salesTable.quantity) })
      .from(salesTable)
      .where(and(...saleConds, eq(salesTable.type, "ANIMAUX")));

    // Animaux restants = stock actuel de tous les lots non supprimés
    const [totalAnimalsRemaining] = await db
      .select({ total: sum(batchesTable.currentCount) })
      .from(batchesTable)
      .where(and(...batchConds));

    const [monthlyRevenue] = await db
      .select({ total: sum(salesTable.totalAmount) })
      .from(salesTable)
      .where(and(...saleConds, sql`${salesTable.saleDate} >= ${firstDayOfMonth}`));

    const [monthlyExpenses] = await db
      .select({ total: sum(expensesTable.amount) })
      .from(expensesTable)
      .where(and(...expenseConds, sql`${expensesTable.date} >= ${firstDayOfMonth}`));

    const [lowStockCount] = await db
      .select({ count: count() })
      .from(stockTable)
      .where(and(...stockConds, sql`${stockTable.quantity} < ${stockTable.minimumLevel}`));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const batchIds = await db.select({ id: batchesTable.id }).from(batchesTable).where(and(...batchConds));
    const batchIdList = batchIds.map((b) => b.id);

    let mortalityThisWeek = 0;
    if (batchIdList.length > 0) {
      const [mortalityResult] = await db
        .select({ total: sum(dailyRecordsTable.mortality) })
        .from(dailyRecordsTable)
        .where(and(
          inArray(dailyRecordsTable.batchId, batchIdList),
          sql`${dailyRecordsTable.date} >= ${sevenDaysAgo}`
        ));
      mortalityThisWeek = Number(mortalityResult?.total) || 0;
    }

    const recentSales = await db
      .select({
        id: salesTable.id,
        batchId: salesTable.batchId,
        batchName: batchesTable.name,
        tenantId: salesTable.tenantId,
        quantity: salesTable.quantity,
        unitPrice: salesTable.unitPrice,
        totalAmount: salesTable.totalAmount,
        buyerName: salesTable.buyerName,
        saleDate: salesTable.saleDate,
        type: salesTable.type,
        notes: salesTable.notes,
        createdAt: salesTable.createdAt,
      })
      .from(salesTable)
      .leftJoin(batchesTable, eq(salesTable.batchId, batchesTable.id))
      .where(and(...saleConds))
      .limit(5);

    const activeBatches = await db
      .select({
        id: batchesTable.id,
        name: batchesTable.name,
        farmId: batchesTable.farmId,
        currentCount: batchesTable.currentCount,
        mortalityRate: batchesTable.mortalityRate,
        farmName: farmsTable.name,
      })
      .from(batchesTable)
      .leftJoin(farmsTable, eq(batchesTable.farmId, farmsTable.id))
      .where(and(...batchConds, eq(batchesTable.status, "ACTIF")))
      .limit(5);

    const revenue = Number(monthlyRevenue?.total) || 0;
    const expenses = Number(monthlyExpenses?.total) || 0;

    res.json(
      GetDashboardStatsResponse.parse({
        totalFarms: farmCount?.count ?? 0,
        totalBatches: batchCount?.count ?? 0,
        activeBatches: activeBatchCount?.count ?? 0,
        totalAnimals: Number(totalAnimals?.total) || 0,
        totalAnimalsSold: Number(totalAnimalsSold?.total) || 0,
        totalAnimalsRemaining: Number(totalAnimalsRemaining?.total) || 0,
        monthlyRevenue: revenue,
        monthlyExpenses: expenses,
        netProfit: revenue - expenses,
        lowStockAlerts: lowStockCount?.count ?? 0,
        mortalityThisWeek,
        recentSales: recentSales.map((s) => ({ ...s, batchName: s.batchName || null })),
        batchPerformance: activeBatches.map((b) => ({
          batchId: b.id,
          batchName: b.name,
          farmName: b.farmName || "N/A",
          mortalityRate: b.mortalityRate,
          feedConversion: 1.8,
          currentCount: b.currentCount,
        })),
      })
    );
  }
);

export default router;
