import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, isNull, count, lt } from "drizzle-orm";
import { db } from "@workspace/db";
import { stockTable } from "@workspace/db";
import {
  ListStockQueryParams,
  ListStockResponse,
  CreateStockItemBody,
} from "@workspace/api-zod";
import { requireAuth, requirePermission } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

router.get(
  "/stock",
  requireAuth,
  requirePermission("STOCK", "READ"),
  async (req, res): Promise<void> => {
    const query = ListStockQueryParams.safeParse(req.query);
    const page = query.success ? query.data.page ?? 1 : 1;
    const limit = query.success ? query.data.limit ?? 20 : 20;
    const offset = (page - 1) * limit;
    const user = req.user!;

    const conditions = [isNull(stockTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(stockTable.tenantId, user.tenantId));
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(stockTable)
      .where(and(...conditions));

    const [lowStockResult] = await db
      .select({ count: count() })
      .from(stockTable)
      .where(and(...conditions, lt(stockTable.quantity, stockTable.minimumLevel)));

    const items = await db
      .select()
      .from(stockTable)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    res.json(
      ListStockResponse.parse({
        data: items.map((item) => ({
          ...item,
          currentValue: item.quantity * item.unitPrice,
        })),
        total: totalResult?.count ?? 0,
        page,
        limit,
        lowStockCount: lowStockResult?.count ?? 0,
      })
    );
  }
);

router.post(
  "/stock",
  requireAuth,
  requirePermission("STOCK", "CREATE"),
  async (req, res): Promise<void> => {
    const parsed = CreateStockItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;

    const [item] = await db
      .insert(stockTable)
      .values({
        id: randomUUID(),
        tenantId: user.tenantId,
        ...parsed.data,
      })
      .returning();

    await logAudit(user, "CREATE_STOCK", "STOCK", item.id, `Created stock item ${item.name}`);

    res.status(201).json({ ...item, currentValue: item.quantity * item.unitPrice });
  }
);

export default router;
