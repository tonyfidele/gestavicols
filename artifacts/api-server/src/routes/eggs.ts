import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, isNull, count, sum, gte, lte, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { eggProductionsTable, batchesTable, farmsTable } from "@workspace/db";
import { requireAuth, requirePermission } from "../middlewares/auth";
import { logAudit } from "../lib/audit";
import { z } from "zod";

const CreateEggProductionBody = z.object({
  batchId: z.string(),
  farmId: z.string().optional(),
  date: z.string(),
  eggsCollected: z.number().int().min(0),
  brokenEggs: z.number().int().min(0).default(0),
  soldEggs: z.number().int().min(0).default(0),
  stockEggs: z.number().int().min(0).default(0),
  cratesCount: z.number().min(0).default(0),
  unitPrice: z.number().min(0).default(0),
  caisseAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

const router: IRouter = Router();

router.get(
  "/eggs",
  requireAuth,
  requirePermission("BATCH", "READ"),
  async (req, res): Promise<void> => {
    const user = req.user!;
    const { page: pageStr, limit: limitStr, batchId, startDate, endDate } = req.query as Record<string, string>;
    const page = parseInt(pageStr || "1", 10);
    const limit = parseInt(limitStr || "50", 10);
    const offset = (page - 1) * limit;

    const conditions = user.role !== "SUPER_ADMIN" ? [eq(eggProductionsTable.tenantId, user.tenantId)] : [];
    if (batchId) conditions.push(eq(eggProductionsTable.batchId, batchId));
    if (startDate) conditions.push(gte(eggProductionsTable.date, startDate));
    if (endDate) conditions.push(lte(eggProductionsTable.date, endDate));

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [totalResult] = await db.select({ count: count() }).from(eggProductionsTable).where(whereClause);
    const [sumResult] = await db.select({ total: sum(eggProductionsTable.eggsCollected) }).from(eggProductionsTable).where(whereClause);

    const items = await db
      .select({
        id: eggProductionsTable.id,
        batchId: eggProductionsTable.batchId,
        batchName: batchesTable.name,
        farmId: eggProductionsTable.farmId,
        farmName: farmsTable.name,
        tenantId: eggProductionsTable.tenantId,
        date: eggProductionsTable.date,
        eggsCollected: eggProductionsTable.eggsCollected,
        brokenEggs: eggProductionsTable.brokenEggs,
        soldEggs: eggProductionsTable.soldEggs,
        stockEggs: eggProductionsTable.stockEggs,
        cratesCount: eggProductionsTable.cratesCount,
        unitPrice: eggProductionsTable.unitPrice,
        caisseAmount: eggProductionsTable.caisseAmount,
        notes: eggProductionsTable.notes,
        createdAt: eggProductionsTable.createdAt,
      })
      .from(eggProductionsTable)
      .leftJoin(batchesTable, eq(eggProductionsTable.batchId, batchesTable.id))
      .leftJoin(farmsTable, eq(eggProductionsTable.farmId, farmsTable.id))
      .where(whereClause)
      .orderBy(desc(eggProductionsTable.date))
      .limit(limit)
      .offset(offset);

    res.json({
      data: items.map(i => ({ ...i, batchName: i.batchName || "—", farmName: i.farmName || "—" })),
      total: totalResult?.count ?? 0,
      page,
      limit,
      totalEggs: Number(sumResult?.total) || 0,
    });
  }
);

router.post(
  "/eggs",
  requireAuth,
  requirePermission("BATCH", "CREATE"),
  async (req, res): Promise<void> => {
    const parsed = CreateEggProductionBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }
    const user = req.user!;

    const batchConds = [eq(batchesTable.id, parsed.data.batchId), isNull(batchesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") batchConds.push(eq(batchesTable.tenantId, user.tenantId));
    const [batch] = await db.select().from(batchesTable).where(and(...batchConds));
    if (!batch) { res.status(404).json({ message: "Lot introuvable" }); return; }

    const [record] = await db
      .insert(eggProductionsTable)
      .values({
        id: randomUUID(),
        tenantId: user.tenantId,
        farmId: batch.farmId,
        ...parsed.data,
      })
      .returning();

    await logAudit(user, "CREATE_EGG_RECORD", "EGG", record.id);
    res.status(201).json({ ...record, batchName: batch.name, farmName: null });
  }
);

router.put(
  "/eggs/:eggId",
  requireAuth,
  requirePermission("BATCH", "UPDATE"),
  async (req, res): Promise<void> => {
    const { eggId } = req.params;
    const user = req.user!;
    const parsed = CreateEggProductionBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }
    const conditions = [eq(eggProductionsTable.id, eggId)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(eggProductionsTable.tenantId, user.tenantId));
    const [updated] = await db.update(eggProductionsTable).set(parsed.data).where(and(...conditions)).returning();
    if (!updated) { res.status(404).json({ message: "Enregistrement introuvable" }); return; }
    await logAudit(user, "UPDATE_EGG_RECORD", "EGG", updated.id);
    res.json({ ...updated, batchName: null, farmName: null });
  }
);

router.delete(
  "/eggs/:eggId",
  requireAuth,
  requirePermission("BATCH", "DELETE"),
  async (req, res): Promise<void> => {
    const { eggId } = req.params;
    const user = req.user!;
    const conditions = [eq(eggProductionsTable.id, eggId)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(eggProductionsTable.tenantId, user.tenantId));
    const [deleted] = await db.delete(eggProductionsTable).where(and(...conditions)).returning();
    if (!deleted) { res.status(404).json({ message: "Enregistrement introuvable" }); return; }
    await logAudit(user, "DELETE_EGG_RECORD", "EGG", deleted.id);
    res.json({ message: "Enregistrement supprimé" });
  }
);

export default router;
