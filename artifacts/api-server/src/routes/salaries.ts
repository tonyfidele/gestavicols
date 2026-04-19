import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, count } from "drizzle-orm";
import { db } from "@workspace/db";
import { salariesTable, usersTable } from "@workspace/db";
import {
  ListSalariesQueryParams,
  ListSalariesResponse,
  CreateSalaryBody,
  UpdateSalaryParams,
  UpdateSalaryBody,
  UpdateSalaryResponse,
} from "@workspace/api-zod";
import { requireAuth, requirePermission } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

router.get(
  "/salaries",
  requireAuth,
  requirePermission("SALARY", "READ"),
  async (req, res): Promise<void> => {
    const query = ListSalariesQueryParams.safeParse(req.query);
    const page = query.success ? query.data.page ?? 1 : 1;
    const limit = query.success ? query.data.limit ?? 50 : 50;
    const offset = (page - 1) * limit;
    const monthFilter = query.success ? query.data.month : undefined;
    const yearFilter = query.success ? query.data.year : undefined;
    const user = req.user!;

    const conditions = [eq(salariesTable.tenantId, user.tenantId)];
    if (monthFilter) conditions.push(eq(salariesTable.month, monthFilter));
    if (yearFilter) conditions.push(eq(salariesTable.year, yearFilter));

    const [totalResult] = await db
      .select({ count: count() })
      .from(salariesTable)
      .where(and(...conditions));

    const items = await db
      .select({
        id: salariesTable.id,
        tenantId: salariesTable.tenantId,
        userId: salariesTable.userId,
        userName: usersTable.name,
        userRole: usersTable.role,
        month: salariesTable.month,
        year: salariesTable.year,
        baseSalary: salariesTable.baseSalary,
        bonuses: salariesTable.bonuses,
        deductions: salariesTable.deductions,
        netSalary: salariesTable.netSalary,
        paymentDate: salariesTable.paymentDate,
        paymentStatus: salariesTable.paymentStatus,
        notes: salariesTable.notes,
        createdAt: salariesTable.createdAt,
      })
      .from(salariesTable)
      .leftJoin(usersTable, eq(salariesTable.userId, usersTable.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(salariesTable.year, salariesTable.month);

    res.json(
      ListSalariesResponse.parse({
        data: items,
        total: totalResult?.count ?? 0,
        page,
        limit,
      })
    );
  }
);

router.post(
  "/salaries",
  requireAuth,
  requirePermission("SALARY", "CREATE"),
  async (req, res): Promise<void> => {
    const parsed = CreateSalaryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;

    const netSalary = (parsed.data.baseSalary ?? 0) + (parsed.data.bonuses ?? 0) - (parsed.data.deductions ?? 0);

    const [salary] = await db
      .insert(salariesTable)
      .values({
        id: randomUUID(),
        tenantId: user.tenantId,
        ...parsed.data,
        netSalary,
      })
      .returning();

    await logAudit(user, "CREATE_SALARY", "SALARY", salary.id, `Salary for user ${salary.userId}`);

    res.status(201).json(salary);
  }
);

router.put(
  "/salaries/:salaryId",
  requireAuth,
  requirePermission("SALARY", "UPDATE"),
  async (req, res): Promise<void> => {
    const params = UpdateSalaryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: "Invalid salary ID" });
      return;
    }

    const parsed = UpdateSalaryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;

    const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.baseSalary !== undefined || parsed.data.bonuses !== undefined || parsed.data.deductions !== undefined) {
      const existing = await db.select().from(salariesTable).where(eq(salariesTable.id, params.data.salaryId)).limit(1);
      if (existing[0]) {
        const base = parsed.data.baseSalary ?? existing[0].baseSalary;
        const bonuses = parsed.data.bonuses ?? existing[0].bonuses;
        const deductions = parsed.data.deductions ?? existing[0].deductions;
        updateData.netSalary = base + bonuses - deductions;
      }
    }

    const [updated] = await db
      .update(salariesTable)
      .set(updateData)
      .where(
        and(
          eq(salariesTable.id, params.data.salaryId),
          eq(salariesTable.tenantId, user.tenantId)
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ message: "Salary record not found" });
      return;
    }

    await logAudit(user, "UPDATE_SALARY", "SALARY", updated.id, `Salary updated`);

    res.json(UpdateSalaryResponse.parse(updated));
  }
);

export default router;
