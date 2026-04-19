import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { eq, and, isNull, count } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  CreateUserBody,
  GetUserParams,
  GetUserResponse,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
  DeleteUserParams,
  DeleteUserResponse,
} from "@workspace/api-zod";
import { requireAuth, requirePermission, withTenant } from "../middlewares/auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

router.get(
  "/users",
  requireAuth,
  requirePermission("USER", "READ"),
  async (req, res): Promise<void> => {
    const query = ListUsersQueryParams.safeParse(req.query);
    const page = query.success ? query.data.page ?? 1 : 1;
    const limit = query.success ? query.data.limit ?? 20 : 20;
    const offset = (page - 1) * limit;

    const user = req.user!;
    const tenantFilter = withTenant(user);

    const conditions = [isNull(usersTable.deletedAt)];
    if (tenantFilter.tenantId) {
      conditions.push(eq(usersTable.tenantId, tenantFilter.tenantId));
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(usersTable)
      .where(and(...conditions));

    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        tenantId: usersTable.tenantId,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    res.json(
      ListUsersResponse.parse({
        data: users,
        total: totalResult?.count ?? 0,
        page,
        limit,
      })
    );
  }
);

router.post(
  "/users",
  requireAuth,
  requirePermission("USER", "CREATE"),
  async (req, res): Promise<void> => {
    const parsed = CreateUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;
    const { email, name, password, role } = parsed.data;

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(usersTable)
      .values({
        id: randomUUID(),
        email,
        name,
        passwordHash,
        role,
        tenantId: user.tenantId,
      })
      .returning();

    await logAudit(user, "CREATE_USER", "USER", newUser.id, `Created user ${email} with role ${role}`);

    res.status(201).json(
      GetUserResponse.parse({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        tenantId: newUser.tenantId,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      })
    );
  }
);

router.get(
  "/users/:userId",
  requireAuth,
  requirePermission("USER", "READ"),
  async (req, res): Promise<void> => {
    const params = GetUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }

    const user = req.user!;
    const conditions = [
      eq(usersTable.id, params.data.userId),
      isNull(usersTable.deletedAt),
    ];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(usersTable.tenantId, user.tenantId));
    }

    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(and(...conditions));

    if (!dbUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(
      GetUserResponse.parse({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        tenantId: dbUser.tenantId,
        isActive: dbUser.isActive,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      })
    );
  }
);

router.put(
  "/users/:userId",
  requireAuth,
  requirePermission("USER", "UPDATE"),
  async (req, res): Promise<void> => {
    const params = UpdateUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }
    const parsed = UpdateUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.message });
      return;
    }

    const user = req.user!;
    const conditions = [
      eq(usersTable.id, params.data.userId),
      isNull(usersTable.deletedAt),
    ];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(usersTable.tenantId, user.tenantId));
    }

    const [updated] = await db
      .update(usersTable)
      .set(parsed.data)
      .where(and(...conditions))
      .returning();

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await logAudit(user, "UPDATE_USER", "USER", updated.id);

    res.json(
      UpdateUserResponse.parse({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        tenantId: updated.tenantId,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      })
    );
  }
);

router.delete(
  "/users/:userId",
  requireAuth,
  requirePermission("USER", "DELETE"),
  async (req, res): Promise<void> => {
    const params = DeleteUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: params.error.message });
      return;
    }

    const user = req.user!;
    const conditions = [
      eq(usersTable.id, params.data.userId),
      isNull(usersTable.deletedAt),
    ];
    if (user.role !== "SUPER_ADMIN") {
      conditions.push(eq(usersTable.tenantId, user.tenantId));
    }

    const [deleted] = await db
      .update(usersTable)
      .set({ deletedAt: new Date() })
      .where(and(...conditions))
      .returning();

    if (!deleted) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await logAudit(user, "DELETE_USER", "USER", deleted.id);

    res.json(DeleteUserResponse.parse({ message: "Utilisateur supprimé" }));
  }
);

router.patch(
  "/users/:userId/toggle-active",
  requireAuth,
  requirePermission("USER", "UPDATE"),
  async (req, res): Promise<void> => {
    const { userId } = req.params;
    const user = req.user!;
    if (userId === user.userId) { res.status(400).json({ message: "Impossible de modifier votre propre compte" }); return; }
    const conditions = [eq(usersTable.id, userId), isNull(usersTable.deletedAt)];
    if (user.role !== "SUPER_ADMIN") conditions.push(eq(usersTable.tenantId, user.tenantId));
    const [target] = await db.select({ isActive: usersTable.isActive }).from(usersTable).where(and(...conditions));
    if (!target) { res.status(404).json({ message: "Utilisateur introuvable" }); return; }
    const [updated] = await db.update(usersTable).set({ isActive: !target.isActive }).where(and(...conditions)).returning();
    await logAudit(user, "TOGGLE_USER", "USER", updated.id, `User ${updated.isActive ? "activated" : "deactivated"}`);
    res.json({ id: updated.id, isActive: updated.isActive, message: updated.isActive ? "Utilisateur activé" : "Utilisateur désactivé" });
  }
);

export default router;
