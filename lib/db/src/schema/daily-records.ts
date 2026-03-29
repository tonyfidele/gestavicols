import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { batchesTable } from "./batches";
import { usersTable } from "./users";
import { tenantsTable } from "./tenants";

export const dailyRecordsTable = pgTable("daily_records", {
  id: text("id").primaryKey(),
  batchId: text("batch_id").notNull().references(() => batchesTable.id),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id),
  date: text("date").notNull(),
  mortality: integer("mortality").notNull().default(0),
  feedConsumption: real("feed_consumption").notNull().default(0),
  waterConsumption: real("water_consumption").notNull().default(0),
  eggsCollected: integer("eggs_collected"),
  averageWeight: real("average_weight"),
  temperature: real("temperature"),
  notes: text("notes"),
  recordedBy: text("recorded_by").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDailyRecordSchema = createInsertSchema(dailyRecordsTable).omit({ createdAt: true, updatedAt: true });
export type InsertDailyRecord = z.infer<typeof insertDailyRecordSchema>;
export type DailyRecord = typeof dailyRecordsTable.$inferSelect;
