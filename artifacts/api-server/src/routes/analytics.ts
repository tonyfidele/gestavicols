import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql, sum, count, isNull, ne } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  batchesTable,
  farmsTable,
  dailyRecordsTable,
  salesTable,
  expensesTable,
} from "@workspace/db";
import { GetAnalyticsQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get(
  "/analytics",
  requireAuth,
  async (req, res): Promise<void> => {
    const query = GetAnalyticsQueryParams.safeParse(req.query);
    const user = req.user!;

    const now = new Date();
    const startDate = query.success && query.data.startDate ? query.data.startDate : `${now.getFullYear()}-01-01`;
    // Use end-of-year as fallback so all dates in the current year are included
    const endDate = query.success && query.data.endDate ? query.data.endDate : `${now.getFullYear()}-12-31`;

    const salesConditions = user.role !== "SUPER_ADMIN" ? [eq(salesTable.tenantId, user.tenantId)] : [];
    const expenseConditions = user.role !== "SUPER_ADMIN" ? [eq(expensesTable.tenantId, user.tenantId)] : [];
    const dailyConditions = user.role !== "SUPER_ADMIN" ? [eq(dailyRecordsTable.tenantId, user.tenantId)] : [];

    salesConditions.push(isNull(salesTable.deletedAt));
    expenseConditions.push(isNull(expensesTable.deletedAt));

    salesConditions.push(gte(salesTable.saleDate, startDate));
    salesConditions.push(lte(salesTable.saleDate, endDate));
    expenseConditions.push(gte(expensesTable.date, startDate));
    expenseConditions.push(lte(expensesTable.date, endDate));
    dailyConditions.push(gte(dailyRecordsTable.date, startDate));
    dailyConditions.push(lte(dailyRecordsTable.date, endDate));

    const [salesTotal] = await db
      .select({
        totalRevenue: sum(salesTable.totalAmount),
        totalTransactions: count(salesTable.id),
      })
      .from(salesTable)
      .where(and(...salesConditions));

    const [expensesTotal] = await db
      .select({
        totalExpenses: sum(expensesTable.amount),
      })
      .from(expensesTable)
      .where(and(...expenseConditions));

    const [mortalityStats] = await db
      .select({
        totalMortality: sum(dailyRecordsTable.mortality),
        totalFeedConsumed: sum(dailyRecordsTable.feedConsumption),
        totalEggs: sum(dailyRecordsTable.eggsCollected),
      })
      .from(dailyRecordsTable)
      .where(and(...dailyConditions));

    const farmPerformance = await db
      .select({
        farmId: farmsTable.id,
        farmName: farmsTable.name,
        isActive: farmsTable.isActive,
        activeBatches: count(batchesTable.id),
        totalAnimals: sql<number>`coalesce(sum(${batchesTable.currentCount}), 0)`,
        avgMortality: sql<number>`coalesce(avg(${batchesTable.mortalityRate}), 0)`,
      })
      .from(farmsTable)
      .leftJoin(
        batchesTable,
        and(
          eq(batchesTable.farmId, farmsTable.id),
          ne(batchesTable.status, "TERMINE")
        )
      )
      .where(
        and(
          user.role !== "SUPER_ADMIN" ? eq(farmsTable.tenantId, user.tenantId) : sql`1=1`,
          isNull(farmsTable.deletedAt)
        )
      )
      .groupBy(farmsTable.id, farmsTable.name, farmsTable.isActive)
      .limit(20);

    const farmRevenueConditions = [
      isNull(salesTable.deletedAt),
      gte(salesTable.saleDate, startDate),
      lte(salesTable.saleDate, endDate),
      ...(user.role !== "SUPER_ADMIN" ? [eq(salesTable.tenantId, user.tenantId)] : []),
    ];
    const revenueByFarm = await db
      .select({
        farmId: salesTable.farmId,
        revenue: sum(salesTable.totalAmount),
      })
      .from(salesTable)
      .where(and(...farmRevenueConditions))
      .groupBy(salesTable.farmId);

    const farmExpenseConditions = [
      isNull(expensesTable.deletedAt),
      gte(expensesTable.date, startDate),
      lte(expensesTable.date, endDate),
      ...(user.role !== "SUPER_ADMIN" ? [eq(expensesTable.tenantId, user.tenantId)] : []),
    ];
    const expensesByFarm = await db
      .select({
        farmId: expensesTable.farmId,
        expenses: sum(expensesTable.amount),
      })
      .from(expensesTable)
      .where(and(...farmExpenseConditions))
      .groupBy(expensesTable.farmId);

    const monthlySales = await db
      .select({
        month: sql<string>`to_char(${salesTable.saleDate}::date, 'YYYY-MM')`,
        revenue: sum(salesTable.totalAmount),
        transactions: count(salesTable.id),
      })
      .from(salesTable)
      .where(and(...salesConditions))
      .groupBy(sql`to_char(${salesTable.saleDate}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${salesTable.saleDate}::date, 'YYYY-MM')`)
      .limit(12);

    const monthlyExpenses = await db
      .select({
        month: sql<string>`to_char(${expensesTable.date}::date, 'YYYY-MM')`,
        amount: sum(expensesTable.amount),
        category: expensesTable.category,
      })
      .from(expensesTable)
      .where(and(...expenseConditions))
      .groupBy(sql`to_char(${expensesTable.date}::date, 'YYYY-MM')`, expensesTable.category)
      .orderBy(sql`to_char(${expensesTable.date}::date, 'YYYY-MM')`)
      .limit(60);

    const expensesByCategory = await db
      .select({
        category: expensesTable.category,
        total: sum(expensesTable.amount),
      })
      .from(expensesTable)
      .where(and(...expenseConditions))
      .groupBy(expensesTable.category);

    const totalRevenue = Number(salesTotal?.totalRevenue) || 0;
    const totalExpenses = Number(expensesTotal?.totalExpenses) || 0;
    const netProfit = totalRevenue - totalExpenses;
    const roi = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100) : 0;

    res.json({
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        roi: Math.round(roi * 10) / 10,
        totalTransactions: Number(salesTotal?.totalTransactions) || 0,
        totalMortality: Number(mortalityStats?.totalMortality) || 0,
        totalFeedConsumed: Number(mortalityStats?.totalFeedConsumed) || 0,
        totalEggsCollected: Number(mortalityStats?.totalEggs) || 0,
      },
      farmPerformance: farmPerformance.map(f => {
        const rev = revenueByFarm.find(r => r.farmId === f.farmId);
        const exp = expensesByFarm.find(e => e.farmId === f.farmId);
        const revenue = Number(rev?.revenue) || 0;
        const expenses = Number(exp?.expenses) || 0;
        return {
          farmId: f.farmId,
          farmName: f.farmName,
          isActive: f.isActive,
          activeBatches: Number(f.activeBatches),
          totalAnimals: Number(f.totalAnimals),
          avgMortality: Math.round(Number(f.avgMortality) * 100) / 100,
          revenue,
          expenses,
          netProfit: revenue - expenses,
        };
      }),
      monthlySales: monthlySales.map(m => ({
        month: m.month,
        revenue: Number(m.revenue) || 0,
        transactions: Number(m.transactions) || 0,
      })),
      monthlyExpenses: monthlyExpenses.map(m => ({
        month: m.month,
        amount: Number(m.amount) || 0,
        category: m.category,
      })),
      expensesByCategory: expensesByCategory.map(e => ({
        category: e.category,
        total: Number(e.total) || 0,
      })),
    });
  }
);

export default router;
