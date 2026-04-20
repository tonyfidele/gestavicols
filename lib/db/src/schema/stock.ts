import { pgTable, text, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";
import { farmsTable } from "./farms";
import { batchesTable } from "./batches";

export const stockCategoryEnum = pgEnum("stock_category", ["ALIMENTS", "MEDICAMENTS", "MATERIEL", "LITIERE", "EQUIPEMENT", "AUTRE"]);
export const stockMovementTypeEnum = pgEnum("stock_movement_type", ["ENTREE", "SORTIE"]);

export const stockTable = pgTable("stock", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: stockCategoryEnum("category").notNull().default("ALIMENTS"),
  quantity: real("quantity").notNull().default(0),
  unit: text("unit").notNull(),
  minimumLevel: real("minimum_level").notNull().default(0),
  unitPrice: real("unit_price").notNull().default(0),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const stockMovementsTable = pgTable("stock_movements", {
  id: text("id").primaryKey(),
  stockItemId: text("stock_item_id").notNull().references(() => stockTable.id),
  batchId: text("batch_id").references(() => batchesTable.id),
  farmId: text("farm_id").references(() => farmsTable.id),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id),
  type: stockMovementTypeEnum("type").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price"),
  movementDate: text("movement_date").notNull(),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStockSchema = createInsertSchema(stockTable).omit({ createdAt: true, updatedAt: true, deletedAt: true });
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stockTable.$inferSelect;

export const insertStockMovementSchema = createInsertSchema(stockMovementsTable).omit({ createdAt: true });
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovementsTable.$inferSelect;
