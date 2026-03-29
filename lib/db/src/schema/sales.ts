import { pgTable, text, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { batchesTable } from "./batches";
import { tenantsTable } from "./tenants";
import { farmsTable } from "./farms";
import { customersTable } from "./customers";

export const saleTypeEnum = pgEnum("sale_type", ["ANIMAUX", "OEUFS", "FUMIER", "AUTRE"]);

export const salesTable = pgTable("sales", {
  id: text("id").primaryKey(),
  batchId: text("batch_id").references(() => batchesTable.id),
  farmId: text("farm_id").references(() => farmsTable.id),
  customerId: text("customer_id").references(() => customersTable.id),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalAmount: real("total_amount").notNull(),
  buyerName: text("buyer_name").notNull(),
  saleDate: text("sale_date").notNull(),
  type: saleTypeEnum("type").notNull().default("ANIMAUX"),
  notes: text("notes"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({ createdAt: true, updatedAt: true, deletedAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
