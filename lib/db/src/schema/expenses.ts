import { pgTable, text, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";
import { batchesTable } from "./batches";
import { farmsTable } from "./farms";

export const expenseCategoryEnum = pgEnum("expense_category", ["ALIMENTS", "SALAIRES", "VETERINAIRE", "MAINTENANCE", "TRANSPORT", "ENERGIE", "MAIN_OEUVRE", "EQUIPEMENT", "AUTRE"]);

export const expensesTable = pgTable("expenses", {
  id: text("id").primaryKey(),
  category: expenseCategoryEnum("category").notNull().default("AUTRE"),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  batchId: text("batch_id").references(() => batchesTable.id),
  farmId: text("farm_id").references(() => farmsTable.id),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertExpenseSchema = createInsertSchema(expensesTable).omit({ createdAt: true, updatedAt: true, deletedAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;
