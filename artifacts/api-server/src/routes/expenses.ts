import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, isNull, count, sum } from "drizzle-orm";
import { db } from "@workspace/db";
import { expensesTable } from "@workspace/db";
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
      .select()
      .from(expensesTable)
      .where(and(...conditions))
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
      })
      .returning();

    await logAudit(user, "CREATE_EXPENSE", "EXPENSE", expense.id, `Expense: ${expense.description} ${expense.amount}`);

    res.status(201).json(expense);
  }
);

export default router;
