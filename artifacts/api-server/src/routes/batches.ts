import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, isNull, count, sql, sum } from "drizzle-orm";
import { db } from "@workspace/db";
import { recalcBatchCurrentCount } from "../lib/batch-utils";
import {
  batchesTable,
  farmsTable,
  dailyRecordsTable,
  usersTable,
  veterinaryRecordsTable,
  stockMovementsTable,
} from "@workspace/db";
import {
  ListBatchesQueryParams,
  ListBatchesResponse,
  CreateBatchBody,
  GetBatchParams,
  GetBatchResponse,
  UpdateBatchParams,
  UpdateBatchBody,
  UpdateBatchResponse,
  ListDailyRecordsParams,
  ListDailyRecordsQueryParams,
  ListDailyRecordsResponse,
  CreateDailyRecordParams,
  CreateDailyRecordBody,
  UpdateDailyRecordParams,
  UpdateDailyRecordBody,
  DeleteDailyRecordParams,
  ListVeterinaryRecordsParams,
  ListVeterinaryRecordsResponse,
  CreateVeterinaryRecordParams,
  CreateVeterinaryRecordBody,
} from "@workspace/api-zod";
import { requireAuth, requirePermission, withTenant } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

router.get(
  "/batches",
  requireAuth,
  requirePermission("BATCH", "READ"),
  async (req, res): Promise<void> => {
    const query = ListBatchesQueryParams.safeParse(req.query);
    const page = query.success ? query.data.page ?? 1 : 1;
    const limit = query.success ? query.data.limit ?? 20 : 20;
    const offset = (page - 1) * limit;
    const farmFilter = query.success ? query.data.farmId : undefined;
    const statusFilter = query.success ? query.data.status : undefined;
    const user = req.user!;

    const conditions = [isNull(batchesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(batchesTable.tenantId, user.tenantId));
    }
    if (farmFilter) conditions.push(eq(batchesTable.farmId, farmFilter));
    if (statusFilter) conditions.push(eq(batchesTable.status, statusFilter as any));

    const [totalResult] = await db
      .select({ count: count() })
      .from(batchesTable)
      .where(and(...conditions));

    const batches = await db
      .select({
        id: batchesTable.id,
        name: batchesTable.name,
        farmId: batchesTable.farmId,
        farmName: farmsTable.name,
        buildingId: batchesTable.buildingId,
        tenantId: batchesTable.tenantId,
        species: batchesTable.species,
        initialCount: batchesTable.initialCount,
        currentCount: batchesTable.currentCount,
        status: batchesTable.status,
        startDate: batchesTable.startDate,
        endDate: batchesTable.endDate,
        mortalityRate: batchesTable.mortalityRate,
        createdAt: batchesTable.createdAt,
      })
      .from(batchesTable)
      .leftJoin(farmsTable, eq(batchesTable.farmId, farmsTable.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    res.json(
      ListBatchesResponse.parse({
        data: batches.map((b) => ({ ...b, farmName: b.farmName || "N/A" })),
        total: totalResult?.count ?? 0,
        page,
        limit,
      })
    );
  }
);

router.post(
  "/batches",
  requireAuth,
  requirePermission("BATCH", "CREATE"),
  async (req, res): Promise<void> => {
    const parsed = CreateBatchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;
    const farmConds = [eq(farmsTable.id, parsed.data.farmId), isNull(farmsTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") farmConds.push(eq(farmsTable.tenantId, user.tenantId));
    const [farm] = await db.select().from(farmsTable).where(and(...farmConds));
    if (!farm) {
      res.status(404).json({ message: "Farm not found" });
      return;
    }

    const [batch] = await db
      .insert(batchesTable)
      .values({
        id: randomUUID(),
        tenantId: user.tenantId,
        currentCount: parsed.data.initialCount,
        status: "EN_ATTENTE",
        mortalityRate: 0,
        ...parsed.data,
      })
      .returning();

    await logAudit(user, "CREATE_BATCH", "BATCH", batch.id, `Created batch ${batch.name}`);

    res.status(201).json(
      GetBatchResponse.parse({
        ...batch,
        farmName: farm.name,
      })
    );
  }
);

router.get(
  "/batches/:batchId",
  requireAuth,
  requirePermission("BATCH", "READ"),
  async (req, res): Promise<void> => {
    const params = GetBatchParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }

    const user = req.user!;
    const conditions = [eq(batchesTable.id, params.data.batchId), isNull(batchesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(batchesTable.tenantId, user.tenantId));

    const [batch] = await db
      .select({
        id: batchesTable.id,
        name: batchesTable.name,
        farmId: batchesTable.farmId,
        farmName: farmsTable.name,
        buildingId: batchesTable.buildingId,
        tenantId: batchesTable.tenantId,
        species: batchesTable.species,
        initialCount: batchesTable.initialCount,
        currentCount: batchesTable.currentCount,
        status: batchesTable.status,
        startDate: batchesTable.startDate,
        endDate: batchesTable.endDate,
        mortalityRate: batchesTable.mortalityRate,
        createdAt: batchesTable.createdAt,
      })
      .from(batchesTable)
      .leftJoin(farmsTable, eq(batchesTable.farmId, farmsTable.id))
      .where(and(...conditions));

    if (!batch) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    res.json(GetBatchResponse.parse({ ...batch, farmName: batch.farmName || "N/A" }));
  }
);

router.put(
  "/batches/:batchId",
  requireAuth,
  requirePermission("BATCH", "UPDATE"),
  async (req, res): Promise<void> => {
    const params = UpdateBatchParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }
    const parsed = UpdateBatchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;
    const conditions = [eq(batchesTable.id, params.data.batchId), isNull(batchesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(batchesTable.tenantId, user.tenantId));

    const [updated] = await db
      .update(batchesTable)
      .set(parsed.data)
      .where(and(...conditions))
      .returning();

    if (!updated) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    await logAudit(user, "UPDATE_BATCH", "BATCH", updated.id);

    const [farm] = await db.select({ name: farmsTable.name }).from(farmsTable).where(eq(farmsTable.id, updated.farmId));

    res.json(UpdateBatchResponse.parse({ ...updated, farmName: farm?.name || "N/A" }));
  }
);

router.delete(
  "/batches/:batchId",
  requireAuth,
  requirePermission("BATCH", "DELETE"),
  async (req, res): Promise<void> => {
    const { batchId } = req.params;
    const user = req.user!;
    const conditions = [eq(batchesTable.id, batchId), isNull(batchesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(batchesTable.tenantId, user.tenantId));
    const [deleted] = await db.update(batchesTable).set({ deletedAt: new Date() }).where(and(...conditions)).returning();
    if (!deleted) { res.status(404).json({ message: "Lot introuvable" }); return; }
    await logAudit(user, "DELETE_BATCH", "BATCH", deleted.id);
    res.json({ message: "Lot supprimé" });
  }
);

router.get(
  "/batches/:batchId/daily-records",
  requireAuth,
  requirePermission("DAILY_RECORD", "READ"),
  async (req, res): Promise<void> => {
    const params = ListDailyRecordsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }

    const user = req.user!;
    const batchConds = [eq(batchesTable.id, params.data.batchId), isNull(batchesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") batchConds.push(eq(batchesTable.tenantId, user.tenantId));
    const [batch] = await db.select().from(batchesTable).where(and(...batchConds));
    if (!batch) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    const records = await db
      .select({
        id: dailyRecordsTable.id,
        batchId: dailyRecordsTable.batchId,
        date: dailyRecordsTable.date,
        mortality: dailyRecordsTable.mortality,
        feedConsumption: dailyRecordsTable.feedConsumption,
        waterConsumption: dailyRecordsTable.waterConsumption,
        eggsCollected: dailyRecordsTable.eggsCollected,
        averageWeight: dailyRecordsTable.averageWeight,
        temperature: dailyRecordsTable.temperature,
        notes: dailyRecordsTable.notes,
        recordedBy: usersTable.name,
        createdAt: dailyRecordsTable.createdAt,
      })
      .from(dailyRecordsTable)
      .leftJoin(usersTable, eq(dailyRecordsTable.recordedBy, usersTable.id))
      .where(eq(dailyRecordsTable.batchId, params.data.batchId))
      .orderBy(dailyRecordsTable.date);

    res.json(
      ListDailyRecordsResponse.parse({
        data: records.map((r) => ({ ...r, recordedBy: r.recordedBy || "Inconnu" })),
        total: records.length,
      })
    );
  }
);

router.post(
  "/batches/:batchId/daily-records",
  requireAuth,
  requirePermission("DAILY_RECORD", "CREATE"),
  async (req, res): Promise<void> => {
    const params = CreateDailyRecordParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }
    const parsed = CreateDailyRecordBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;
    const batchConds = [eq(batchesTable.id, params.data.batchId), isNull(batchesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") batchConds.push(eq(batchesTable.tenantId, user.tenantId));
    const [batch] = await db.select().from(batchesTable).where(and(...batchConds));
    if (!batch) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    const [record] = await db
      .insert(dailyRecordsTable)
      .values({
        id: randomUUID(),
        batchId: params.data.batchId,
        tenantId: user.tenantId,
        recordedBy: user.userId,
        ...parsed.data,
      })
      .returning();

    await recalcBatchCurrentCount(params.data.batchId);
    await logAudit(user, "CREATE_DAILY_RECORD", "DAILY_RECORD", record.id);

    res.status(201).json({ ...record, recordedBy: user.name });
  }
);


router.put(
  "/batches/:batchId/daily-records/:recordId",
  requireAuth,
  requirePermission("DAILY_RECORD", "UPDATE"),
  async (req, res): Promise<void> => {
    const params = UpdateDailyRecordParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ message: params.error.message }); return; }
    const parsed = UpdateDailyRecordBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }

    const user = req.user!;
    const conds = [eq(dailyRecordsTable.id, params.data.recordId)];
    if (user.role !== "SUPER_ADMIN") conds.push(eq(dailyRecordsTable.tenantId, user.tenantId));
    const [existing] = await db.select().from(dailyRecordsTable).where(and(...conds));
    if (!existing) { res.status(404).json({ message: "Daily record not found" }); return; }

    const [updated] = await db
      .update(dailyRecordsTable)
      .set({ ...parsed.data })
      .where(and(...conds))
      .returning();

    await recalcBatchCurrentCount(existing.batchId);
    await logAudit(user, "UPDATE_DAILY_RECORD", "DAILY_RECORD", updated.id);
    res.json({ ...updated, recordedBy: user.name });
  }
);

router.delete(
  "/batches/:batchId/daily-records/:recordId",
  requireAuth,
  requirePermission("DAILY_RECORD", "DELETE"),
  async (req, res): Promise<void> => {
    const params = DeleteDailyRecordParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ message: params.error.message }); return; }

    const user = req.user!;
    const conds = [eq(dailyRecordsTable.id, params.data.recordId)];
    if (user.role !== "SUPER_ADMIN") conds.push(eq(dailyRecordsTable.tenantId, user.tenantId));
    const [existing] = await db.select().from(dailyRecordsTable).where(and(...conds));
    if (!existing) { res.status(404).json({ message: "Daily record not found" }); return; }

    await db.delete(dailyRecordsTable).where(and(...conds));
    await recalcBatchCurrentCount(existing.batchId);
    await logAudit(user, "DELETE_DAILY_RECORD", "DAILY_RECORD", params.data.recordId);
    res.json({ message: "Daily record deleted" });
  }
);

router.get(
  "/batches/:batchId/veterinary-records",
  requireAuth,
  requirePermission("VET_RECORD", "READ"),
  async (req, res): Promise<void> => {
    const params = ListVeterinaryRecordsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }

    const user = req.user!;
    const batchConds = [eq(batchesTable.id, params.data.batchId), isNull(batchesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") batchConds.push(eq(batchesTable.tenantId, user.tenantId));
    const [batch] = await db.select().from(batchesTable).where(and(...batchConds));
    if (!batch) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    const records = await db
      .select()
      .from(veterinaryRecordsTable)
      .where(eq(veterinaryRecordsTable.batchId, params.data.batchId))
      .orderBy(veterinaryRecordsTable.date);

    res.json(
      ListVeterinaryRecordsResponse.parse({ data: records, total: records.length })
    );
  }
);

router.post(
  "/batches/:batchId/veterinary-records",
  requireAuth,
  requirePermission("VET_RECORD", "CREATE"),
  async (req, res): Promise<void> => {
    const params = CreateVeterinaryRecordParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }
    const parsed = CreateVeterinaryRecordBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;
    const batchConds = [eq(batchesTable.id, params.data.batchId), isNull(batchesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") batchConds.push(eq(batchesTable.tenantId, user.tenantId));
    const [batch] = await db.select().from(batchesTable).where(and(...batchConds));
    if (!batch) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    const [record] = await db
      .insert(veterinaryRecordsTable)
      .values({
        id: randomUUID(),
        batchId: params.data.batchId,
        tenantId: user.tenantId,
        veterinarianName: user.name,
        ...parsed.data,
      })
      .returning();

    await logAudit(user, "CREATE_VET_RECORD", "VET_RECORD", record.id);

    res.status(201).json(record);
  }
);

router.delete(
  "/batches/:batchId/veterinary-records/:recordId",
  requireAuth,
  requirePermission("VET_RECORD", "DELETE"),
  async (req, res): Promise<void> => {
    const user = req.user!;
    const { batchId, recordId } = req.params;

    const batchConds = [eq(batchesTable.id, batchId), isNull(batchesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") batchConds.push(eq(batchesTable.tenantId, user.tenantId));
    const [batch] = await db.select().from(batchesTable).where(and(...batchConds));
    if (!batch) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    const [deleted] = await db
      .delete(veterinaryRecordsTable)
      .where(
        and(
          eq(veterinaryRecordsTable.id, recordId),
          eq(veterinaryRecordsTable.batchId, batchId)
        )
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ message: "Record not found" });
      return;
    }

    await logAudit(user, "DELETE_VET_RECORD", "VET_RECORD", recordId);
    res.json({ id: recordId });
  }
);

router.delete(
  "/batches/:batchId/feed-movements",
  requireAuth,
  requirePermission("STOCK", "DELETE"),
  async (req, res): Promise<void> => {
    const { batchId } = req.params;
    const user = req.user!;

    const batchConds = [eq(batchesTable.id, batchId), isNull(batchesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") batchConds.push(eq(batchesTable.tenantId, user.tenantId));
    const [batch] = await db.select({ id: batchesTable.id, name: batchesTable.name }).from(batchesTable).where(and(...batchConds));
    if (!batch) {
      res.status(404).json({ message: "Lot introuvable" });
      return;
    }

    const result = await db
      .delete(stockMovementsTable)
      .where(and(eq(stockMovementsTable.batchId, batchId), eq(stockMovementsTable.type, "SORTIE")));

    await logAudit(user, "CLEAR_FEED_MOVEMENTS", "STOCK", batchId, `Cleared feed consumption history for batch ${batch.name}`);
    res.json({ deleted: result.rowCount ?? 0 });
  }
);

export default router;
