import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";

export const stockTable = pgTable("stock", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: real("quantity").notNull().default(0),
  unit: text("unit").notNull(),
  minimumLevel: real("minimum_level").notNull().default(0),
  unitPrice: real("unit_price").notNull().default(0),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStockSchema = createInsertSchema(stockTable).omit({ createdAt: true, updatedAt: true, deletedAt: true });
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stockTable.$inferSelect;
