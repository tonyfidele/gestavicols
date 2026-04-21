import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, isNull, count, sql, inArray, ne } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  farmsTable,
  buildingsTable,
  batchesTable,
  usersTable,
  dailyRecordsTable,
  veterinaryRecordsTable,
  salesTable,
  expensesTable,
  eggProductionsTable,
} from "@workspace/db";
import {
  ListFarmsQueryParams,
  ListFarmsResponse,
  CreateFarmBody,
  GetFarmParams,
  GetFarmResponse,
  UpdateFarmParams,
  UpdateFarmBody,
  UpdateFarmResponse,
  DeleteFarmParams,
  DeleteFarmResponse,
  ListBuildingsParams,
  ListBuildingsResponse,
  CreateBuildingParams,
  CreateBuildingBody,
} from "@workspace/api-zod";
import { requireAuth, requirePermission, withTenant } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

router.get(
  "/farms",
  requireAuth,
  requirePermission("FARM", "READ"),
  async (req, res): Promise<void> => {
    const query = ListFarmsQueryParams.safeParse(req.query);
    const page = query.success ? query.data.page ?? 1 : 1;
    const limit = query.success ? query.data.limit ?? 20 : 20;
    const offset = (page - 1) * limit;
    const user = req.user!;

    const conditions = [isNull(farmsTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(farmsTable.tenantId, user.tenantId));
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(farmsTable)
      .where(and(...conditions));

    const farms = await db
      .select({
        id: farmsTable.id,
        name: farmsTable.name,
        location: farmsTable.location,
        capacity: farmsTable.capacity,
        tenantId: farmsTable.tenantId,
        managerId: farmsTable.managerId,
        isActive: farmsTable.isActive,
        createdAt: farmsTable.createdAt,
        managerName: usersTable.name,
      })
      .from(farmsTable)
      .leftJoin(usersTable, eq(farmsTable.managerId, usersTable.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    const farmsWithCounts = await Promise.all(
      farms.map(async (farm) => {
        const [bldCount] = await db
          .select({ count: count() })
          .from(buildingsTable)
          .where(and(eq(buildingsTable.farmId, farm.id), isNull(buildingsTable.deletedAt)));

        const [batchCount] = await db
          .select({ count: count() })
          .from(batchesTable)
          .where(and(
            eq(batchesTable.farmId, farm.id),
            ne(batchesTable.status, "TERMINE"),
            isNull(batchesTable.deletedAt)
          ));

        return {
          ...farm,
          buildingsCount: bldCount?.count ?? 0,
          activeBatchesCount: batchCount?.count ?? 0,
        };
      })
    );

    res.json(
      ListFarmsResponse.parse({
        data: farmsWithCounts,
        total: totalResult?.count ?? 0,
        page,
        limit,
      })
    );
  }
);

router.post(
  "/farms",
  requireAuth,
  requirePermission("FARM", "CREATE"),
  async (req, res): Promise<void> => {
    const parsed = CreateFarmBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;
    const [farm] = await db
      .insert(farmsTable)
      .values({
        id: randomUUID(),
        tenantId: user.tenantId,
        ...parsed.data,
      })
      .returning();

    await logAudit(user, "CREATE_FARM", "FARM", farm.id, `Created farm ${farm.name}`);

    const [manager] = farm.managerId
      ? await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, farm.managerId))
      : [null];

    res.status(201).json(
      GetFarmResponse.parse({
        ...farm,
        managerName: manager?.name || null,
        buildingsCount: 0,
        activeBatchesCount: 0,
      })
    );
  }
);

router.get(
  "/farms/:farmId",
  requireAuth,
  requirePermission("FARM", "READ"),
  async (req, res): Promise<void> => {
    const params = GetFarmParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }

    const user = req.user!;
    const conditions = [eq(farmsTable.id, params.data.farmId), isNull(farmsTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(farmsTable.tenantId, user.tenantId));
    }

    const [farm] = await db
      .select({
        id: farmsTable.id,
        name: farmsTable.name,
        location: farmsTable.location,
        capacity: farmsTable.capacity,
        tenantId: farmsTable.tenantId,
        managerId: farmsTable.managerId,
        isActive: farmsTable.isActive,
        createdAt: farmsTable.createdAt,
        managerName: usersTable.name,
      })
      .from(farmsTable)
      .leftJoin(usersTable, eq(farmsTable.managerId, usersTable.id))
      .where(and(...conditions));

    if (!farm) {
      res.status(404).json({ message: "Farm not found" });
      return;
    }

    const [bldCount] = await db
      .select({ count: count() })
      .from(buildingsTable)
      .where(and(eq(buildingsTable.farmId, farm.id), isNull(buildingsTable.deletedAt)));

    const [batchCount] = await db
      .select({ count: count() })
      .from(batchesTable)
      .where(and(eq(batchesTable.farmId, farm.id), ne(batchesTable.status, "TERMINE"), isNull(batchesTable.deletedAt)));

    res.json(
      GetFarmResponse.parse({
        ...farm,
        buildingsCount: bldCount?.count ?? 0,
        activeBatchesCount: batchCount?.count ?? 0,
      })
    );
  }
);

router.put(
  "/farms/:farmId",
  requireAuth,
  requirePermission("FARM", "UPDATE"),
  async (req, res): Promise<void> => {
    const params = UpdateFarmParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }
    const parsed = UpdateFarmBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;
    const conditions = [eq(farmsTable.id, params.data.farmId), isNull(farmsTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(farmsTable.tenantId, user.tenantId));
    }

    const [updated] = await db
      .update(farmsTable)
      .set(parsed.data)
      .where(and(...conditions))
      .returning();

    if (!updated) {
      res.status(404).json({ message: "Farm not found" });
      return;
    }

    await logAudit(user, "UPDATE_FARM", "FARM", updated.id);

    res.json(
      UpdateFarmResponse.parse({
        ...updated,
        managerName: null,
        buildingsCount: 0,
        activeBatchesCount: 0,
      })
    );
  }
);

router.delete(
  "/farms/:farmId",
  requireAuth,
  requirePermission("FARM", "DELETE"),
  async (req, res): Promise<void> => {
    const params = DeleteFarmParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }

    const user = req.user!;
    const conditions = [eq(farmsTable.id, params.data.farmId), isNull(farmsTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(farmsTable.tenantId, user.tenantId));
    }

    const [deleted] = await db
      .update(farmsTable)
      .set({ deletedAt: new Date() })
      .where(and(...conditions))
      .returning();

    if (!deleted) {
      res.status(404).json({ message: "Farm not found" });
      return;
    }

    const now = new Date();

    const farmBatches = await db
      .select({ id: batchesTable.id })
      .from(batchesTable)
      .where(eq(batchesTable.farmId, deleted.id));
    const batchIds = farmBatches.map((b) => b.id);

    if (batchIds.length > 0) {
      await db.delete(dailyRecordsTable).where(inArray(dailyRecordsTable.batchId, batchIds));
      await db.delete(veterinaryRecordsTable).where(inArray(veterinaryRecordsTable.batchId, batchIds));
      await db.update(salesTable).set({ deletedAt: now }).where(and(inArray(salesTable.batchId, batchIds), isNull(salesTable.deletedAt)));
    }

    await db.update(salesTable).set({ deletedAt: now }).where(and(eq(salesTable.farmId, deleted.id), isNull(salesTable.deletedAt)));
    await db.update(expensesTable).set({ deletedAt: now }).where(and(eq(expensesTable.farmId, deleted.id), isNull(expensesTable.deletedAt)));
    await db.delete(eggProductionsTable).where(eq(eggProductionsTable.farmId, deleted.id));
    await db.update(batchesTable).set({ deletedAt: now }).where(eq(batchesTable.farmId, deleted.id));
    await db.update(buildingsTable).set({ deletedAt: now }).where(eq(buildingsTable.farmId, deleted.id));

    await logAudit(user, "DELETE_FARM", "FARM", deleted.id, `Cascade deleted farm ${deleted.name}`);
    res.json(DeleteFarmResponse.parse({ message: "Ferme et toutes ses données supprimées" }));
  }
);

router.patch(
  "/farms/:farmId/toggle-active",
  requireAuth,
  requirePermission("FARM", "UPDATE"),
  async (req, res): Promise<void> => {
    const { farmId } = req.params;
    const user = req.user!;
    const conditions = [eq(farmsTable.id, farmId), isNull(farmsTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(farmsTable.tenantId, user.tenantId));

    const [farm] = await db.select({ isActive: farmsTable.isActive }).from(farmsTable).where(and(...conditions));
    if (!farm) { res.status(404).json({ message: "Ferme introuvable" }); return; }

    const [updated] = await db
      .update(farmsTable)
      .set({ isActive: !farm.isActive })
      .where(and(...conditions))
      .returning();

    await logAudit(user, "TOGGLE_FARM", "FARM", updated.id, `Farm ${updated.isActive ? "activated" : "deactivated"}`);
    res.json({ id: updated.id, isActive: updated.isActive, message: updated.isActive ? "Ferme activée" : "Ferme désactivée" });
  }
);

router.get(
  "/farms/:farmId/buildings",
  requireAuth,
  requirePermission("BUILDING", "READ"),
  async (req, res): Promise<void> => {
    const params = ListBuildingsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }

    const user = req.user!;
    const farmConditions = [eq(farmsTable.id, params.data.farmId), isNull(farmsTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") {
      farmConditions.push(eq(farmsTable.tenantId, user.tenantId));
    }

    const [farm] = await db.select().from(farmsTable).where(and(...farmConditions));
    if (!farm) {
      res.status(404).json({ message: "Farm not found" });
      return;
    }

    const buildings = await db
      .select()
      .from(buildingsTable)
      .where(and(eq(buildingsTable.farmId, params.data.farmId), isNull(buildingsTable.deletedAt)));

    const buildingsWithOccupancy = await Promise.all(
      buildings.map(async (b) => {
        const [batchResult] = await db
          .select({ total: sql<number>`sum(${batchesTable.currentCount})` })
          .from(batchesTable)
          .where(and(
            eq(batchesTable.buildingId, b.id),
            eq(batchesTable.status, "ACTIF"),
            isNull(batchesTable.deletedAt)
          ));
        return { ...b, currentOccupancy: Number(batchResult?.total) || 0 };
      })
    );

    res.json(
      ListBuildingsResponse.parse({
        data: buildingsWithOccupancy,
        total: buildingsWithOccupancy.length,
      })
    );
  }
);

router.post(
  "/farms/:farmId/buildings",
  requireAuth,
  requirePermission("BUILDING", "CREATE"),
  async (req, res): Promise<void> => {
    const params = CreateBuildingParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }
    const parsed = CreateBuildingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;
    const farmConditions = [eq(farmsTable.id, params.data.farmId), isNull(farmsTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") {
      farmConditions.push(eq(farmsTable.tenantId, user.tenantId));
    }
    const [farm] = await db.select().from(farmsTable).where(and(...farmConditions));
    if (!farm) {
      res.status(404).json({ message: "Farm not found" });
      return;
    }

    const [building] = await db
      .insert(buildingsTable)
      .values({ id: randomUUID(), farmId: params.data.farmId, tenantId: user.tenantId, ...parsed.data })
      .returning();

    await logAudit(user, "CREATE_BUILDING", "BUILDING", building.id);

    res.status(201).json({ ...building, currentOccupancy: 0 });
  }
);

export default router;
