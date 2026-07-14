import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { chamasTable } from "./chamas";
import { loansTable } from "./loans";

export const loanRemindersTable = pgTable("loan_reminders", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull().references(() => loansTable.id, { onDelete: "cascade" }),
  chamaId: integer("chama_id").notNull().references(() => chamasTable.id, { onDelete: "cascade" }),
  memberId: integer("member_id").notNull(),
  phoneNumber: text("phone_number").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLoanReminderSchema = createInsertSchema(loanRemindersTable).omit({ id: true, createdAt: true });
export type InsertLoanReminder = z.infer<typeof insertLoanReminderSchema>;
export type LoanReminder = typeof loanRemindersTable.$inferSelect;
