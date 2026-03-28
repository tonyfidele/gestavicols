import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { batchesTable } from "./batches";

export const veterinaryRecordsTable = pgTable("veterinary_records", {
  id: text("id").primaryKey(),
  batchId: text("batch_id").notNull().references(() => batchesTable.id),
  date: text("date").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  treatment: text("treatment"),
  medication: text("medication"),
  dosage: text("dosage"),
  nextVisit: text("next_visit"),
  veterinarianName: text("veterinarian_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVeterinaryRecordSchema = createInsertSchema(veterinaryRecordsTable).omit({ createdAt: true, updatedAt: true });
export type InsertVeterinaryRecord = z.infer<typeof insertVeterinaryRecordSchema>;
export type VeterinaryRecord = typeof veterinaryRecordsTable.$inferSelect;
