import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmsTable } from "./farms";

export const buildingsTable = pgTable("buildings", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  farmId: text("farm_id").notNull().references(() => farmsTable.id),
  type: text("type").notNull(),
  capacity: integer("capacity").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBuildingSchema = createInsertSchema(buildingsTable).omit({ createdAt: true, updatedAt: true, deletedAt: true });
export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type Building = typeof buildingsTable.$inferSelect;
