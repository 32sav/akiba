import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, membersTable } from "@workspace/db";
import {
  ListMembersParams,
  AddMemberParams,
  AddMemberBody,
  GetMemberParams,
  UpdateMemberParams,
  UpdateMemberBody,
  RemoveMemberParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const fmt = (m: typeof membersTable.$inferSelect) => ({
  ...m,
  joinedAt: m.joinedAt.toISOString(),
  createdAt: m.createdAt.toISOString(),
});

router.get("/chamas/:chamaId/members", async (req, res): Promise<void> => {
  const params = ListMembersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const members = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.chamaId, params.data.chamaId))
    .orderBy(membersTable.joinedAt);
  res.json(members.map(fmt));
});

router.post("/chamas/:chamaId/members", async (req, res): Promise<void> => {
  const params = AddMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [member] = await db
    .insert(membersTable)
    .values({ chamaId: params.data.chamaId, ...parsed.data })
    .returning();
  res.status(201).json(fmt(member));
});

router.get("/chamas/:chamaId/members/:memberId", async (req, res): Promise<void> => {
  const params = GetMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [member] = await db
    .select()
    .from(membersTable)
    .where(and(eq(membersTable.chamaId, params.data.chamaId), eq(membersTable.id, params.data.memberId)));
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.json(fmt(member));
});

router.patch("/chamas/:chamaId/members/:memberId", async (req, res): Promise<void> => {
  const params = UpdateMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [member] = await db
    .update(membersTable)
    .set(parsed.data)
    .where(and(eq(membersTable.chamaId, params.data.chamaId), eq(membersTable.id, params.data.memberId)))
    .returning();
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.json(fmt(member));
});

router.delete("/chamas/:chamaId/members/:memberId", async (req, res): Promise<void> => {
  const params = RemoveMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [member] = await db
    .delete(membersTable)
    .where(and(eq(membersTable.chamaId, params.data.chamaId), eq(membersTable.id, params.data.memberId)))
    .returning();
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
