import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, isNull, count, lt, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { stockTable, stockMovementsTable, batchesTable } from "@workspace/db";
import {
  ListStockQueryParams,
  ListStockResponse,
  CreateStockItemBody,
  CreateStockMovementBody,
  ListStockMovementsQueryParams,
  ListStockMovementsResponse,
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

// ─── Stock Movements ────────────────────────────────────────────────────────

router.get(
  "/stock-movements",
  requireAuth,
  requirePermission("STOCK", "READ"),
  async (req, res): Promise<void> => {
    const query = ListStockMovementsQueryParams.safeParse(req.query);
    if (!query.success) { res.status(400).json({ message: query.error.message }); return; }
    const user = req.user!;
    const { stockItemId, batchId, page, limit } = query.data;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(stockMovementsTable.tenantId, user.tenantId));
    if (stockItemId) conditions.push(eq(stockMovementsTable.stockItemId, stockItemId));
    if (batchId) conditions.push(eq(stockMovementsTable.batchId, batchId));

    const [totalResult] = await db
      .select({ count: count() })
      .from(stockMovementsTable)
      .where(and(...conditions));

    const rows = await db
      .select({
        id: stockMovementsTable.id,
        stockItemId: stockMovementsTable.stockItemId,
        stockItemName: stockTable.name,
        batchId: stockMovementsTable.batchId,
        batchName: batchesTable.name,
        farmId: stockMovementsTable.farmId,
        tenantId: stockMovementsTable.tenantId,
        type: stockMovementsTable.type,
        quantity: stockMovementsTable.quantity,
        unitPrice: stockMovementsTable.unitPrice,
        movementDate: stockMovementsTable.movementDate,
        reference: stockMovementsTable.reference,
        notes: stockMovementsTable.notes,
        createdAt: stockMovementsTable.createdAt,
      })
      .from(stockMovementsTable)
      .leftJoin(stockTable, eq(stockMovementsTable.stockItemId, stockTable.id))
      .leftJoin(batchesTable, eq(stockMovementsTable.batchId, batchesTable.id))
      .where(and(...conditions))
      .orderBy(desc(stockMovementsTable.movementDate))
      .limit(limit)
      .offset(offset);

    res.json(ListStockMovementsResponse.parse({
      data: rows,
      total: totalResult?.count ?? 0,
      page,
      limit,
    }));
  }
);

router.post(
  "/stock-movements",
  requireAuth,
  requirePermission("STOCK", "CREATE"),
  async (req, res): Promise<void> => {
    const parsed = CreateStockMovementBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }

    const user = req.user!;
    const { stockItemId, batchId, farmId, type, quantity, movementDate, reference, notes } = parsed.data;

    const stockConds = [eq(stockTable.id, stockItemId), isNull(stockTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") stockConds.push(eq(stockTable.tenantId, user.tenantId));
    const [stockItem] = await db.select().from(stockTable).where(and(...stockConds));
    if (!stockItem) { res.status(404).json({ message: "Article de stock introuvable" }); return; }

    if (type === "SORTIE" && stockItem.quantity < quantity) {
      res.status(400).json({ message: `Stock insuffisant. Disponible : ${stockItem.quantity} ${stockItem.unit}` });
      return;
    }

    const newQty = type === "SORTIE"
      ? Math.max(0, stockItem.quantity - quantity)
      : stockItem.quantity + quantity;

    const [movement] = await db
      .insert(stockMovementsTable)
      .values({
        id: randomUUID(),
        stockItemId,
        batchId: batchId ?? null,
        farmId: farmId ?? null,
        tenantId: user.tenantId,
        type,
        quantity,
        unitPrice: stockItem.unitPrice,
        movementDate,
        reference: reference ?? null,
        notes: notes ?? null,
      })
      .returning();

    await db.update(stockTable).set({ quantity: newQty }).where(eq(stockTable.id, stockItemId));

    const isLowStock = newQty < stockItem.minimumLevel;
    await logAudit(user, "CREATE_STOCK_MOVEMENT", "STOCK", movement.id, `${type} ${quantity} ${stockItem.unit} de ${stockItem.name}`);

    res.status(201).json({
      ...movement,
      stockItemName: stockItem.name,
      newQuantity: newQty,
      isLowStock,
      batchName: null,
    });
  }
);

export default router;
