import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { chamasTable } from "./chamas";
import { loansTable } from "./loans";
import { membersTable } from "./members";

export const repaymentsTable = pgTable("repayments", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull().references(() => loansTable.id, { onDelete: "cascade" }),
  chamaId: integer("chama_id").notNull().references(() => chamasTable.id, { onDelete: "cascade" }),
  memberId: integer("member_id").notNull().references(() => membersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  mpesaRef: text("mpesa_ref"),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRepaymentSchema = createInsertSchema(repaymentsTable).omit({ id: true, createdAt: true });
export type InsertRepayment = z.infer<typeof insertRepaymentSchema>;
export type Repayment = typeof repaymentsTable.$inferSelect;
