import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { batchesTable } from "./batches";
import { tenantsTable } from "./tenants";
import { farmsTable } from "./farms";

export const eggProductionsTable = pgTable("egg_productions", {
  id: text("id").primaryKey(),
  batchId: text("batch_id").notNull().references(() => batchesTable.id),
  farmId: text("farm_id").references(() => farmsTable.id),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id),
  date: text("date").notNull(),
  eggsCollected: integer("eggs_collected").notNull().default(0),
  brokenEggs: integer("broken_eggs").notNull().default(0),
  soldEggs: integer("sold_eggs").notNull().default(0),
  stockEggs: integer("stock_eggs").notNull().default(0),
  cratesCount: integer("crates_count").notNull().default(0),
  unitPrice: real("unit_price").notNull().default(0),
  caisseAmount: real("caisse_amount").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEggProductionSchema = createInsertSchema(eggProductionsTable).omit({ createdAt: true, updatedAt: true });
export type InsertEggProduction = z.infer<typeof insertEggProductionSchema>;
export type EggProduction = typeof eggProductionsTable.$inferSelect;
