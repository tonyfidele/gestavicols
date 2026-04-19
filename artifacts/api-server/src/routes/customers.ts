import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, isNull, count, ilike } from "drizzle-orm";
import { db } from "@workspace/db";
import { customersTable } from "@workspace/db";
import {
  ListCustomersQueryParams,
  ListCustomersResponse,
  CreateCustomerBody,
  UpdateCustomerParams,
  UpdateCustomerBody,
  UpdateCustomerResponse,
  DeleteCustomerParams,
} from "@workspace/api-zod";
import { requireAuth, requirePermission } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

router.get(
  "/customers",
  requireAuth,
  requirePermission("CUSTOMER", "READ"),
  async (req, res): Promise<void> => {
    const query = ListCustomersQueryParams.safeParse(req.query);
    const page = query.success ? query.data.page ?? 1 : 1;
    const limit = query.success ? query.data.limit ?? 50 : 50;
    const offset = (page - 1) * limit;
    const search = query.success ? query.data.search : undefined;
    const user = req.user!;

    const conditions = [isNull(customersTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(customersTable.tenantId, user.tenantId));
    }
    if (search) {
      conditions.push(ilike(customersTable.name, `%${search}%`));
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(customersTable)
      .where(and(...conditions));

    const items = await db
      .select()
      .from(customersTable)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(customersTable.name);

    res.json(
      ListCustomersResponse.parse({
        data: items,
        total: totalResult?.count ?? 0,
        page,
        limit,
      })
    );
  }
);

router.post(
  "/customers",
  requireAuth,
  requirePermission("CUSTOMER", "CREATE"),
  async (req, res): Promise<void> => {
    const parsed = CreateCustomerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;

    const [customer] = await db
      .insert(customersTable)
      .values({
        id: randomUUID(),
        tenantId: user.tenantId,
        ...parsed.data,
      })
      .returning();

    await logAudit(user, "CREATE_CUSTOMER", "CUSTOMER", customer.id, `Customer: ${customer.name}`);

    res.status(201).json(customer);
  }
);

router.put(
  "/customers/:customerId",
  requireAuth,
  requirePermission("CUSTOMER", "UPDATE"),
  async (req, res): Promise<void> => {
    const params = UpdateCustomerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: "Invalid customer ID" });
      return;
    }

    const parsed = UpdateCustomerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;

    const [updated] = await db
      .update(customersTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(
        and(
          eq(customersTable.id, params.data.customerId),
          eq(customersTable.tenantId, user.tenantId),
          isNull(customersTable.deletedAt)
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    await logAudit(user, "UPDATE_CUSTOMER", "CUSTOMER", updated.id, `Customer: ${updated.name}`);

    res.json(UpdateCustomerResponse.parse(updated));
  }
);

router.delete(
  "/customers/:customerId",
  requireAuth,
  requirePermission("CUSTOMER", "DELETE"),
  async (req, res): Promise<void> => {
    const params = DeleteCustomerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: "Invalid customer ID" });
      return;
    }

    const user = req.user!;

    const [deleted] = await db
      .update(customersTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(customersTable.id, params.data.customerId),
          eq(customersTable.tenantId, user.tenantId),
          isNull(customersTable.deletedAt)
        )
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    await logAudit(user, "DELETE_CUSTOMER", "CUSTOMER", deleted.id, `Customer: ${deleted.name}`);

    res.json({ message: "Customer deleted" });
  }
);

export default router;
