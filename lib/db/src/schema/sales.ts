import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { batchesTable } from "./batches";
import { tenantsTable } from "./tenants";

export const salesTable = pgTable("sales", {
  id: text("id").primaryKey(),
  batchId: text("batch_id").references(() => batchesTable.id),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalAmount: real("total_amount").notNull(),
  buyerName: text("buyer_name").notNull(),
  saleDate: text("sale_date").notNull(),
  type: text("type").notNull(),
  notes: text("notes"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({ createdAt: true, updatedAt: true, deletedAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
