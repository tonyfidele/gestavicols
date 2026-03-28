import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable, tenantsTable } from "@workspace/db";
import {
  LoginBody,
  LoginResponse,
  GetMeResponse,
  LogoutResponse,
} from "@workspace/api-zod";
import {
  generateToken,
  requireAuth,
  getPermissionsForRole,
} from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      tenantId: usersTable.tenantId,
      passwordHash: usersTable.passwordHash,
      isActive: usersTable.isActive,
    })
    .from(usersTable)
    .where(and(eq(usersTable.email, email), isNull(usersTable.deletedAt)));

  if (!user || !user.isActive) {
    res.status(401).json({ message: "Email ou mot de passe incorrect" });
    return;
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    res.status(401).json({ message: "Email ou mot de passe incorrect" });
    return;
  }

  const [tenant] = await db
    .select({ name: tenantsTable.name })
    .from(tenantsTable)
    .where(eq(tenantsTable.id, user.tenantId));

  const authUser = {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
    name: user.name,
  };

  const token = generateToken(authUser);
  const permissions = getPermissionsForRole(user.role);

  res.json(
    LoginResponse.parse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant?.name || "GESTAVICOLE",
        permissions,
      },
    })
  );
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;

  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, user.userId));

  if (!dbUser) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const [tenant] = await db
    .select({ name: tenantsTable.name })
    .from(tenantsTable)
    .where(eq(tenantsTable.id, user.tenantId));

  const permissions = getPermissionsForRole(dbUser.role);

  res.json(
    GetMeResponse.parse({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      tenantId: dbUser.tenantId,
      tenantName: tenant?.name || "GESTAVICOLE",
      permissions,
    })
  );
});

router.post("/auth/logout", requireAuth, async (_req, res): Promise<void> => {
  res.json(LogoutResponse.parse({ message: "Déconnexion réussie" }));
});

export default router;
