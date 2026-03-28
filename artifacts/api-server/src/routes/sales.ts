import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq, and, isNull, count, sum } from "drizzle-orm";
import { db } from "@workspace/db";
import { salesTable, batchesTable } from "@workspace/db";
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
      .where(and(...conditions))
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

    const [sale] = await db
      .insert(salesTable)
      .values({
        id: randomUUID(),
        tenantId: user.tenantId,
        totalAmount,
        ...parsed.data,
      })
      .returning();

    await logAudit(user, "CREATE_SALE", "SALE", sale.id, `Sale to ${sale.buyerName} for ${totalAmount}`);

    res.status(201).json({ ...sale, batchName: null });
  }
);

export default router;
