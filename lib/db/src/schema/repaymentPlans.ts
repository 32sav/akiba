import { pgTable, text, serial, timestamp, integer, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { chamasTable } from "./chamas";
import { loansTable } from "./loans";

export const repaymentPlansTable = pgTable("loan_repayment_plans", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull().references(() => loansTable.id, { onDelete: "cascade" }),
  chamaId: integer("chama_id").notNull().references(() => chamasTable.id, { onDelete: "cascade" }),
  plannedDate: date("planned_date", { mode: "string" }).notNull(),
  plannedAmount: numeric("planned_amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("planned"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRepaymentPlanSchema = createInsertSchema(repaymentPlansTable).omit({ id: true, createdAt: true });
export type InsertRepaymentPlan = z.infer<typeof insertRepaymentPlanSchema>;
export type RepaymentPlan = typeof repaymentPlansTable.$inferSelect;
