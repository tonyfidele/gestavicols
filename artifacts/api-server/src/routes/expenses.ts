import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, isNull, count, sum } from "drizzle-orm";
import { db } from "@workspace/db";
import { expensesTable, farmsTable } from "@workspace/db";
import {
  ListExpensesQueryParams,
  ListExpensesResponse,
  CreateExpenseBody,
} from "@workspace/api-zod";
import { requireAuth, requirePermission } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

router.get(
  "/expenses",
  requireAuth,
  requirePermission("EXPENSE", "READ"),
  async (req, res): Promise<void> => {
    const query = ListExpensesQueryParams.safeParse(req.query);
    const page = query.success ? query.data.page ?? 1 : 1;
    const limit = query.success ? query.data.limit ?? 20 : 20;
    const offset = (page - 1) * limit;
    const user = req.user!;

    const conditions = [isNull(expensesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(expensesTable.tenantId, user.tenantId));
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(expensesTable)
      .where(and(...conditions));

    const [sumResult] = await db
      .select({ total: sum(expensesTable.amount) })
      .from(expensesTable)
      .where(and(...conditions));

    const items = await db
      .select({
        id: expensesTable.id,
        category: expensesTable.category,
        description: expensesTable.description,
        amount: expensesTable.amount,
        date: expensesTable.date,
        batchId: expensesTable.batchId,
        farmId: expensesTable.farmId,
        tenantId: expensesTable.tenantId,
        createdAt: expensesTable.createdAt,
        farmName: farmsTable.name,
      })
      .from(expensesTable)
      .leftJoin(farmsTable, eq(expensesTable.farmId, farmsTable.id))
      .where(and(...conditions))
      .orderBy(expensesTable.date)
      .limit(limit)
      .offset(offset);

    res.json(
      ListExpensesResponse.parse({
        data: items,
        total: totalResult?.count ?? 0,
        page,
        limit,
        totalAmount: Number(sumResult?.total) || 0,
      })
    );
  }
);

router.post(
  "/expenses",
  requireAuth,
  requirePermission("EXPENSE", "CREATE"),
  async (req, res): Promise<void> => {
    const parsed = CreateExpenseBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;

    const [expense] = await db
      .insert(expensesTable)
      .values({
        id: randomUUID(),
        tenantId: user.tenantId,
        ...parsed.data,
      } as any)
      .returning();

    await logAudit(user, "CREATE_EXPENSE", "EXPENSE", expense.id, `Expense: ${expense.description} ${expense.amount}`);

    res.status(201).json(expense);
  }
);

router.put(
  "/expenses/:expenseId",
  requireAuth,
  requirePermission("EXPENSE", "UPDATE"),
  async (req, res): Promise<void> => {
    const expenseId = req.params.expenseId as string;
    const user = req.user!;
    const parsed = CreateExpenseBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }
    const conditions = [eq(expensesTable.id, expenseId), isNull(expensesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(expensesTable.tenantId, user.tenantId));
    const [updated] = await db.update(expensesTable).set(parsed.data as any).where(and(...conditions)).returning();
    if (!updated) { res.status(404).json({ message: "Dépense introuvable" }); return; }
    await logAudit(user, "UPDATE_EXPENSE", "EXPENSE", updated.id);
    res.json(updated);
  }
);

router.delete(
  "/expenses/:expenseId",
  requireAuth,
  requirePermission("EXPENSE", "DELETE"),
  async (req, res): Promise<void> => {
    const expenseId = req.params.expenseId as string;
    const user = req.user!;
    const conditions = [eq(expensesTable.id, expenseId), isNull(expensesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(expensesTable.tenantId, user.tenantId));
    const [deleted] = await db.update(expensesTable).set({ deletedAt: new Date() }).where(and(...conditions)).returning();
    if (!deleted) { res.status(404).json({ message: "Dépense introuvable" }); return; }
    await logAudit(user, "DELETE_EXPENSE", "EXPENSE", deleted.id);
    res.json({ message: "Dépense supprimée" });
  }
);

export default router;
