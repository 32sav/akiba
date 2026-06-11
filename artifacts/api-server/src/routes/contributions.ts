import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, contributionsTable, membersTable } from "@workspace/db";
import {
  ListContributionsParams,
  RecordContributionParams,
  RecordContributionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/chamas/:chamaId/contributions", async (req, res): Promise<void> => {
  const params = ListContributionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select({
      id: contributionsTable.id,
      chamaId: contributionsTable.chamaId,
      memberId: contributionsTable.memberId,
      memberName: membersTable.name,
      amount: contributionsTable.amount,
      status: contributionsTable.status,
      mpesaRef: contributionsTable.mpesaRef,
      paidAt: contributionsTable.paidAt,
      createdAt: contributionsTable.createdAt,
    })
    .from(contributionsTable)
    .innerJoin(membersTable, eq(contributionsTable.memberId, membersTable.id))
    .where(eq(contributionsTable.chamaId, params.data.chamaId))
    .orderBy(contributionsTable.createdAt);
  res.json(
    rows.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
      paidAt: r.paidAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/chamas/:chamaId/contributions", async (req, res): Promise<void> => {
  const params = RecordContributionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = RecordContributionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, parsed.data.memberId));
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const [contribution] = await db
    .insert(contributionsTable)
    .values({
      chamaId: params.data.chamaId,
      memberId: parsed.data.memberId,
      amount: String(parsed.data.amount),
      status: parsed.data.status ?? "completed",
      mpesaRef: parsed.data.mpesaRef,
      paidAt: new Date(),
    })
    .returning();

  res.status(201).json({
    ...contribution,
    memberName: member.name,
    amount: parseFloat(contribution.amount),
    paidAt: contribution.paidAt?.toISOString() ?? null,
    createdAt: contribution.createdAt.toISOString(),
  });
});

export default router;
