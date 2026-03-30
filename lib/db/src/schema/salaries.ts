import { pgTable, text, timestamp, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";
import { usersTable } from "./users";

export const salaryPaymentStatusEnum = pgEnum("salary_payment_status", ["EN_ATTENTE", "PAYE", "ANNULE"]);

export const salariesTable = pgTable("salaries", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenantsTable.id),
  userId: text("user_id").notNull().references(() => usersTable.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  baseSalary: real("base_salary").notNull().default(0),
  bonuses: real("bonuses").notNull().default(0),
  deductions: real("deductions").notNull().default(0),
  netSalary: real("net_salary").notNull().default(0),
  paymentDate: text("payment_date"),
  paymentStatus: salaryPaymentStatusEnum("payment_status").notNull().default("EN_ATTENTE"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSalarySchema = createInsertSchema(salariesTable).omit({ createdAt: true, updatedAt: true });
export type InsertSalary = z.infer<typeof insertSalarySchema>;
export type Salary = typeof salariesTable.$inferSelect;
