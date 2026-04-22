import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, isNull, count, sum, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { salesTable, batchesTable, customersTable } from "@workspace/db";
import { recalcBatchCurrentCount } from "../lib/batch-utils";
import {
  ListSalesQueryParams,
  ListSalesResponse,
  CreateSaleBody,
} from "@workspace/api-zod";
import { requireAuth, requirePermission } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

router.get(
  "/sales",
  requireAuth,
  requirePermission("SALE", "READ"),
  async (req, res): Promise<void> => {
    const query = ListSalesQueryParams.safeParse(req.query);
    const page = query.success ? query.data.page ?? 1 : 1;
    const limit = query.success ? query.data.limit ?? 20 : 20;
    const offset = (page - 1) * limit;
    const user = req.user!;

    const conditions = [isNull(salesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(salesTable.tenantId, user.tenantId));
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(salesTable)
      .where(and(...conditions));

    const [sumResult] = await db
      .select({ total: sum(salesTable.totalAmount) })
      .from(salesTable)
      .where(and(...conditions));

    const sales = await db
      .select({
        id: salesTable.id,
        batchId: salesTable.batchId,
        batchName: batchesTable.name,
        customerId: salesTable.customerId,
        customerName: customersTable.name,
        tenantId: salesTable.tenantId,
        quantity: salesTable.quantity,
        unitPrice: salesTable.unitPrice,
        totalAmount: salesTable.totalAmount,
        buyerName: salesTable.buyerName,
        saleDate: salesTable.saleDate,
        type: salesTable.type,
        notes: salesTable.notes,
        createdAt: salesTable.createdAt,
      })
      .from(salesTable)
      .leftJoin(batchesTable, eq(salesTable.batchId, batchesTable.id))
      .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
      .where(and(...conditions))
      .orderBy(desc(salesTable.saleDate))
      .limit(limit)
      .offset(offset);

    res.json(
      ListSalesResponse.parse({
        data: sales,
        total: totalResult?.count ?? 0,
        page,
        limit,
        totalAmount: Number(sumResult?.total) || 0,
      })
    );
  }
);

router.post(
  "/sales",
  requireAuth,
  requirePermission("SALE", "CREATE"),
  async (req, res): Promise<void> => {
    const parsed = CreateSaleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;
    const totalAmount = parsed.data.quantity * parsed.data.unitPrice;

    let farmId: string | null = null;
    const isAnimalSale = parsed.data.type === "ANIMAUX";

    if (parsed.data.batchId) {
      const [batch] = await db
        .select({ currentCount: batchesTable.currentCount, status: batchesTable.status, farmId: batchesTable.farmId })
        .from(batchesTable)
        .where(and(eq(batchesTable.id, parsed.data.batchId), isNull(batchesTable.deletedAt)));

      if (!batch) {
        res.status(404).json({ message: "Lot introuvable" });
        return;
      }

      if (isAnimalSale) {
        if (batch.currentCount <= 0) {
          res.status(400).json({ message: "Ce lot est épuisé, aucune vente ne peut être enregistrée." });
          return;
        }
        if (parsed.data.quantity > batch.currentCount) {
          res.status(400).json({
            message: `Quantité insuffisante. Ce lot ne dispose que de ${batch.currentCount} animaux disponibles.`,
          });
          return;
        }
      }

      farmId = batch.farmId;
    }

    const [sale] = await db
      .insert(salesTable)
      .values({
        id: randomUUID(),
        tenantId: user.tenantId,
        totalAmount,
        farmId,
        ...parsed.data,
      } as any)
      .returning();

    if (sale.batchId && isAnimalSale) {
      await recalcBatchCurrentCount(sale.batchId);
    }

    await logAudit(user, "CREATE_SALE", "SALE", sale.id, `Sale to ${sale.buyerName} for ${totalAmount}`);

    res.status(201).json({ ...sale, batchName: null });
  }
);

router.put(
  "/sales/:saleId",
  requireAuth,
  requirePermission("SALE", "UPDATE"),
  async (req, res): Promise<void> => {
    const saleId = req.params.saleId as string;
    const user = req.user!;
    const parsed = CreateSaleBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }

    const conditions = [eq(salesTable.id, saleId), isNull(salesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(salesTable.tenantId, user.tenantId));

    const [existing] = await db.select().from(salesTable).where(and(...conditions));
    if (!existing) { res.status(404).json({ message: "Vente introuvable" }); return; }

    const totalAmount = parsed.data.quantity * parsed.data.unitPrice;
    const [updated] = await db
      .update(salesTable)
      .set({ ...parsed.data, totalAmount } as any)
      .where(and(...conditions))
      .returning();
    if (!updated) { res.status(404).json({ message: "Vente introuvable" }); return; }

    if (existing.batchId && existing.type === "ANIMAUX") {
      await recalcBatchCurrentCount(existing.batchId);
    }

    await logAudit(user, "UPDATE_SALE", "SALE", updated.id);
    res.json({ ...updated, batchName: null });
  }
);

router.delete(
  "/sales/:saleId",
  requireAuth,
  requirePermission("SALE", "DELETE"),
  async (req, res): Promise<void> => {
    const saleId = req.params.saleId as string;
    const user = req.user!;
    const conditions = [eq(salesTable.id, saleId), isNull(salesTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(salesTable.tenantId, user.tenantId));

    const [existing] = await db.select().from(salesTable).where(and(...conditions));
    if (!existing) { res.status(404).json({ message: "Vente introuvable" }); return; }

    const [deleted] = await db
      .update(salesTable)
      .set({ deletedAt: new Date() })
      .where(and(...conditions))
      .returning();
    if (!deleted) { res.status(404).json({ message: "Vente introuvable" }); return; }

    if (existing.batchId && existing.type === "ANIMAUX") {
      await recalcBatchCurrentCount(existing.batchId);
    }

    await logAudit(user, "DELETE_SALE", "SALE", deleted.id);
    res.json({ message: "Vente supprimée" });
  }
);

export default router;
