import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { chamasTable } from "./chamas";

export const chamaInvitationsTable = pgTable("chama_invitations", {
  id: serial("id").primaryKey(),
  chamaId: integer("chama_id").notNull().references(() => chamasTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  maxUses: integer("max_uses").notNull().default(50),
  useCount: integer("use_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvitationSchema = createInsertSchema(chamaInvitationsTable).omit({ id: true, createdAt: true, useCount: true });
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type ChamaInvitation = typeof chamaInvitationsTable.$inferSelect;
