import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionPlanEnum = pgEnum("subscription_plan", ["BASIC", "PRO", "PREMIUM"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["ACTIVE", "INACTIVE", "TRIAL", "EXPIRED"]);

export const tenantsTable = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").default("BASIC"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("TRIAL"),
  subscriptionEndDate: text("subscription_end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTenantSchema = createInsertSchema(tenantsTable).omit({ createdAt: true, updatedAt: true });
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenantsTable.$inferSelect;
