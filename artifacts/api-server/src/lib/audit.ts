
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { AuthUser } from "../middlewares/auth";
import { randomUUID } from "crypto";

export async function logAudit(
  user: AuthUser,
  action: string,
  entity: string,
  entityId?: string,
  details?: string
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      id: randomUUID(),
      tenantId: user.tenantId,
      userId: user.userId,
      action,
      entity,
      entityId,
      details,
    });
  } catch {
  }
}
