import { pgTable, text, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmsTable } from "./farms";
import { buildingsTable } from "./buildings";
import { tenantsTable } from "./tenants";

export const batchStatusEnum = pgEnum("batch_status", ["ACTIF", "TERMINE", "EN_ATTENTE"]);
export const batchTypeEnum = pgEnum("batch_type", ["CHAIR", "PONDEUSE"]);

export const batchesTable = pgTable("batches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  farmId: text("farm_id").notNull().references(() => farmsTable.id),
  buildingId: text("building_id").references(() => buildingsTable.id),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id),
  species: text("species").notNull(),
  type: batchTypeEnum("type").notNull().default("CHAIR"),
  initialCount: integer("initial_count").notNull(),
  currentCount: integer("current_count").notNull(),
  purchaseCost: real("purchase_cost").default(0),
  provenance: text("provenance"),
  status: batchStatusEnum("status").notNull().default("EN_ATTENTE"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  mortalityRate: real("mortality_rate").notNull().default(0),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBatchSchema = createInsertSchema(batchesTable).omit({ createdAt: true, updatedAt: true, deletedAt: true });
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batchesTable.$inferSelect;
