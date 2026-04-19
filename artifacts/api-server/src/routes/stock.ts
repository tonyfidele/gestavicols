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

router.put(
  "/stock/:stockId",
  requireAuth,
  requirePermission("STOCK", "UPDATE"),
  async (req, res): Promise<void> => {
    const { stockId } = req.params;
    const user = req.user!;
    const parsed = CreateStockItemBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }
    const conditions = [eq(stockTable.id, stockId), isNull(stockTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(stockTable.tenantId, user.tenantId));
    const [updated] = await db.update(stockTable).set(parsed.data).where(and(...conditions)).returning();
    if (!updated) { res.status(404).json({ message: "Article introuvable" }); return; }
    await logAudit(user, "UPDATE_STOCK", "STOCK", updated.id);
    res.json({ ...updated, currentValue: updated.quantity * updated.unitPrice });
  }
);

router.delete(
  "/stock/:stockId",
  requireAuth,
  requirePermission("STOCK", "DELETE"),
  async (req, res): Promise<void> => {
    const { stockId } = req.params;
    const user = req.user!;
    const conditions = [eq(stockTable.id, stockId), isNull(stockTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(stockTable.tenantId, user.tenantId));
    const [deleted] = await db.update(stockTable).set({ deletedAt: new Date() }).where(and(...conditions)).returning();
    if (!deleted) { res.status(404).json({ message: "Article introuvable" }); return; }
    await logAudit(user, "DELETE_STOCK", "STOCK", deleted.id);
    res.json({ message: "Article supprimé" });
  }
);

export default router;
