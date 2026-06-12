import { pgTable, text, serial, timestamp, integer, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { chamasTable } from "./chamas";
import { membersTable } from "./members";
import { contributionsTable } from "./contributions";

export const mpesaTransactionsTable = pgTable(
  "mpesa_transactions",
  {
    id: serial("id").primaryKey(),
    checkoutRequestId: text("checkout_request_id").unique(),
    merchantRequestId: text("merchant_request_id"),
    conversationId: text("conversation_id").unique(),
    originatorConversationId: text("originator_conversation_id"),
    chamaId: integer("chama_id")
      .notNull()
      .references(() => chamasTable.id, { onDelete: "cascade" }),
    memberId: integer("member_id").references(() => membersTable.id, { onDelete: "set null" }),
    contributionId: integer("contribution_id").references(() => contributionsTable.id, { onDelete: "set null" }),
    type: text("type").notNull().default("contribution"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    phoneNumber: text("phone_number"),
    status: text("status").notNull().default("pending"),
    mpesaReceiptNumber: text("mpesa_receipt_number"),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_mpesa_tx_chama").on(t.chamaId),
    index("idx_mpesa_tx_status").on(t.status),
  ]
);

export const insertMpesaTransactionSchema = createInsertSchema(mpesaTransactionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertMpesaTransaction = z.infer<typeof insertMpesaTransactionSchema>;
export type MpesaTransaction = typeof mpesaTransactionsTable.$inferSelect;
