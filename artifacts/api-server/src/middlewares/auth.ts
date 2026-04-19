import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "gestavicole-secret-key-change-in-production";

export interface AuthUser {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "FARM:CREATE", "FARM:READ", "FARM:UPDATE", "FARM:DELETE",
    "BUILDING:CREATE", "BUILDING:READ", "BUILDING:UPDATE", "BUILDING:DELETE",
    "BATCH:CREATE", "BATCH:READ", "BATCH:UPDATE", "BATCH:DELETE",
    "SALE:CREATE", "SALE:READ", "SALE:UPDATE", "SALE:DELETE",
    "STOCK:CREATE", "STOCK:READ", "STOCK:UPDATE", "STOCK:DELETE",
    "EXPENSE:CREATE", "EXPENSE:READ", "EXPENSE:UPDATE", "EXPENSE:DELETE",
    "DAILY_RECORD:CREATE", "DAILY_RECORD:READ", "DAILY_RECORD:UPDATE", "DAILY_RECORD:DELETE",
    "VET_RECORD:CREATE", "VET_RECORD:READ", "VET_RECORD:UPDATE", "VET_RECORD:DELETE",
    "USER:CREATE", "USER:READ", "USER:UPDATE", "USER:DELETE",
    "AUDIT:READ",
    "ANALYTICS:READ",
    "REPORT:EXPORT",
    "CUSTOMER:CREATE", "CUSTOMER:READ", "CUSTOMER:UPDATE", "CUSTOMER:DELETE",
    "SALARY:CREATE", "SALARY:READ", "SALARY:UPDATE",
  ],
  CHEF_FERME: [
    "FARM:READ",
    "BUILDING:READ",
    "BATCH:READ",
    "SALE:READ",
    "STOCK:READ",
    "DAILY_RECORD:CREATE", "DAILY_RECORD:READ", "DAILY_RECORD:UPDATE",
    "VET_RECORD:READ",
    "CUSTOMER:CREATE", "CUSTOMER:READ",
  ],
  OUVRIER: [
    "FARM:READ",
    "BATCH:READ",
    "DAILY_RECORD:CREATE", "DAILY_RECORD:READ",
  ],
  VETERINAIRE: [
    "BATCH:READ",
    "VET_RECORD:CREATE", "VET_RECORD:READ", "VET_RECORD:UPDATE", "VET_RECORD:DELETE",
  ],
  COMPTABLE: [
    "EXPENSE:CREATE", "EXPENSE:READ",
    "SALE:CREATE", "SALE:READ",
    "REPORT:EXPORT",
    "ANALYTICS:READ",
    "CUSTOMER:READ",
    "SALARY:CREATE", "SALARY:READ", "SALARY:UPDATE",
  ],
};

export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function checkPermission(user: AuthUser, resource: string, action: string): boolean {
  const perms = ROLE_PERMISSIONS[user.role] || [];
  if (perms.includes("*")) return true;
  return perms.includes(`${resource}:${action}`);
}

export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!checkPermission(req.user, resource, action)) {
      res.status(403).json({ message: "Forbidden: insufficient permissions" });
      return;
    }
    next();
  };
}

export function withTenant(user: AuthUser, where: Record<string, unknown> = {}) {
  if (user.role === "SUPER_ADMIN") return where;
  return { ...where, tenantId: user.tenantId };
}
