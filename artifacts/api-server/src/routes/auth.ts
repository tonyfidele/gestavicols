import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq, and, isNull, sql } from "drizzle-orm";
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

  const { email: rawEmail, password } = parsed.data;
  const email = rawEmail.toLowerCase().trim();

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
    .where(and(sql`LOWER(${usersTable.email}) = ${email}`, isNull(usersTable.deletedAt)));

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

router.post("/auth/register", async (req, res): Promise<void> => {
  const RegisterBody = z.object({
    farmName: z.string().min(2, "Nom de la ferme requis"),
    adminName: z.string().min(2, "Votre nom est requis"),
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Mot de passe minimum 6 caractères"),
  });

  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0]?.message || "Données invalides" });
    return;
  }

  const { farmName, adminName, email: rawEmail, password } = parsed.data;
  const email = rawEmail.toLowerCase().trim();

  try {
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
    if (existing) {
      res.status(409).json({ message: "Un compte avec cet email existe déjà" });
      return;
    }

    const tenantId = randomUUID();
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);

    // Générer un slug unique à partir du nom de la ferme
    const baseSlug = farmName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 40);
    const slug = `${baseSlug}-${tenantId.substring(0, 8)}`;

    await db.insert(tenantsTable).values({
      id: tenantId,
      name: farmName,
      slug,
    });

    await db.insert(usersTable).values({
      id: userId,
      tenantId,
      name: adminName,
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    });

    const authUser = { userId, tenantId, role: "ADMIN" as const, email, name: adminName };
    const token = generateToken(authUser);
    const permissions = getPermissionsForRole("ADMIN");

    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        name: adminName,
        role: "ADMIN",
        tenantId,
        tenantName: farmName,
        permissions,
      },
    });
  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    res.status(500).json({ message: "Erreur lors de la création du compte. Veuillez réessayer." });
  }
});

router.post("/auth/logout", requireAuth, async (_req, res): Promise<void> => {
  res.json(LogoutResponse.parse({ message: "Déconnexion réussie" }));
});

export default router;
