import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, chamaInvitationsTable, chamasTable, membersTable } from "@workspace/db";
import { randomUUID } from "crypto";
import {
  CreateInvitationParams,
  GetInvitationParams,
  AcceptInvitationBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/chamas/:chamaId/invitations", async (req, res): Promise<void> => {
  const params = CreateInvitationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [chama] = await db.select({ id: chamasTable.id }).from(chamasTable).where(eq(chamasTable.id, params.data.chamaId));
  if (!chama) { res.status(404).json({ error: "Chama not found" }); return; }

  const token = randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [invite] = await db.insert(chamaInvitationsTable).values({
    chamaId: params.data.chamaId,
    token,
    maxUses: 50,
    expiresAt,
  }).returning();

  res.status(201).json({
    id: invite.id,
    chamaId: invite.chamaId,
    token: invite.token,
    maxUses: invite.maxUses,
    useCount: invite.useCount,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString(),
  });
});

router.get("/invitations/:token", async (req, res): Promise<void> => {
  const params = GetInvitationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid token" }); return; }

  const [invite] = await db
    .select()
    .from(chamaInvitationsTable)
    .where(and(
      eq(chamaInvitationsTable.token, params.data.token),
      gt(chamaInvitationsTable.expiresAt, new Date()),
    ));

  if (!invite) { res.status(404).json({ error: "Invite not found or expired" }); return; }
  if (invite.useCount >= invite.maxUses) { res.status(400).json({ error: "Invite link has reached its maximum uses" }); return; }

  const [chama] = await db.select().from(chamasTable).where(eq(chamasTable.id, invite.chamaId));
  if (!chama) { res.status(404).json({ error: "Chama not found" }); return; }

  const memberRows = await db.select({ id: membersTable.id }).from(membersTable).where(eq(membersTable.chamaId, invite.chamaId));

  res.json({
    chamaId: chama.id,
    chamaName: chama.name,
    chamaDescription: chama.description ?? null,
    contributionAmount: parseFloat(String(chama.contributionAmount)),
    meetingFrequency: chama.meetingFrequency,
    memberCount: memberRows.length,
    expiresAt: invite.expiresAt.toISOString(),
    isExpired: false,
  });
});

router.post("/invitations/:token/accept", async (req, res): Promise<void> => {
  const params = GetInvitationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid token" }); return; }

  const parsed = AcceptInvitationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [invite] = await db
    .select()
    .from(chamaInvitationsTable)
    .where(and(
      eq(chamaInvitationsTable.token, params.data.token),
      gt(chamaInvitationsTable.expiresAt, new Date()),
    ));

  if (!invite) { res.status(400).json({ error: "Invite not found or expired" }); return; }
  if (invite.useCount >= invite.maxUses) { res.status(400).json({ error: "Invite link has reached its maximum uses" }); return; }

  const [member] = await db.insert(membersTable).values({
    chamaId: invite.chamaId,
    name: parsed.data.name,
    phoneNumber: parsed.data.phoneNumber,
    email: parsed.data.email ?? undefined,
    role: parsed.data.role ?? "member",
  }).returning();

  await db.update(chamaInvitationsTable)
    .set({ useCount: invite.useCount + 1 })
    .where(eq(chamaInvitationsTable.id, invite.id));

  res.status(201).json({
    id: member.id,
    chamaId: member.chamaId,
    name: member.name,
    phoneNumber: member.phoneNumber,
    email: member.email ?? null,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    createdAt: member.createdAt.toISOString(),
  });
});

export default router;
