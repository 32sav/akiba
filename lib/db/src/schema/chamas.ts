import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chamasTable = pgTable("chamas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  meetingFrequency: text("meeting_frequency").notNull().default("monthly"),
  contributionAmount: numeric("contribution_amount", { precision: 12, scale: 2 }).notNull(),
  bankAccount: text("bank_account"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertChamaSchema = createInsertSchema(chamasTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChama = z.infer<typeof insertChamaSchema>;
export type Chama = typeof chamasTable.$inferSelect;
