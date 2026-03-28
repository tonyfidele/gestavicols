import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db } from "@workspace/db";
import { auditLogsTable, usersTable } from "@workspace/db";
import {
  ListAuditLogsQueryParams,
  ListAuditLogsResponse,
} from "@workspace/api-zod";
import { requireAuth, requirePermission } from "../middlewares/auth";

const router: IRouter = Router();

router.get(
  "/audit-logs",
  requireAuth,
  requirePermission("AUDIT", "READ"),
  async (req, res): Promise<void> => {
    const query = ListAuditLogsQueryParams.safeParse(req.query);
    const page = query.success ? query.data.page ?? 1 : 1;
    const limit = query.success ? query.data.limit ?? 50 : 50;
    const offset = (page - 1) * limit;
    const user = req.user!;

    const conditions = [];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(auditLogsTable.tenantId, user.tenantId));
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(auditLogsTable)
      .where(conditions.length ? and(...conditions) : undefined);

    const logs = await db
      .select({
        id: auditLogsTable.id,
        tenantId: auditLogsTable.tenantId,
        userId: auditLogsTable.userId,
        userName: usersTable.name,
        action: auditLogsTable.action,
        entity: auditLogsTable.entity,
        entityId: auditLogsTable.entityId,
        details: auditLogsTable.details,
        createdAt: auditLogsTable.createdAt,
      })
      .from(auditLogsTable)
      .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(auditLogsTable.createdAt)
      .limit(limit)
      .offset(offset);

    res.json(
      ListAuditLogsResponse.parse({
        data: logs.map((l) => ({ ...l, userName: l.userName || "Inconnu" })),
        total: totalResult?.count ?? 0,
        page,
        limit,
      })
    );
  }
);

export default router;
