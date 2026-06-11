import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, chamasTable, membersTable, contributionsTable, loansTable } from "@workspace/db";
import {
  CreateChamaBody,
  UpdateChamaParams,
  UpdateChamaBody,
  GetChamaParams,
  DeleteChamaParams,
  GetChamaSummaryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/chamas", async (_req, res): Promise<void> => {
  const chamas = await db.select().from(chamasTable).orderBy(chamasTable.createdAt);
  res.json(
    chamas.map((c) => ({
      ...c,
      contributionAmount: parseFloat(c.contributionAmount),
      updatedAt: c.updatedAt?.toISOString(),
      createdAt: c.createdAt.toISOString(),
    }))
  );
});

router.post("/chamas", async (req, res): Promise<void> => {
  const parsed = CreateChamaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [chama] = await db
    .insert(chamasTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      meetingFrequency: parsed.data.meetingFrequency,
      contributionAmount: String(parsed.data.contributionAmount),
      bankAccount: parsed.data.bankAccount,
    })
    .returning();
  res.status(201).json({
    ...chama,
    contributionAmount: parseFloat(chama.contributionAmount),
    updatedAt: chama.updatedAt?.toISOString(),
    createdAt: chama.createdAt.toISOString(),
  });
});

router.get("/chamas/:id", async (req, res): Promise<void> => {
  const params = GetChamaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [chama] = await db.select().from(chamasTable).where(eq(chamasTable.id, params.data.id));
  if (!chama) {
    res.status(404).json({ error: "Chama not found" });
    return;
  }
  res.json({
    ...chama,
    contributionAmount: parseFloat(chama.contributionAmount),
    updatedAt: chama.updatedAt?.toISOString(),
    createdAt: chama.createdAt.toISOString(),
  });
});

router.patch("/chamas/:id", async (req, res): Promise<void> => {
  const params = UpdateChamaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateChamaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.contributionAmount !== undefined) {
    updates.contributionAmount = String(parsed.data.contributionAmount);
  }
  const [chama] = await db
    .update(chamasTable)
    .set(updates)
    .where(eq(chamasTable.id, params.data.id))
    .returning();
  if (!chama) {
    res.status(404).json({ error: "Chama not found" });
    return;
  }
  res.json({
    ...chama,
    contributionAmount: parseFloat(chama.contributionAmount),
    updatedAt: chama.updatedAt?.toISOString(),
    createdAt: chama.createdAt.toISOString(),
  });
});

router.delete("/chamas/:id", async (req, res): Promise<void> => {
  const params = DeleteChamaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [chama] = await db
    .delete(chamasTable)
    .where(eq(chamasTable.id, params.data.id))
    .returning();
  if (!chama) {
    res.status(404).json({ error: "Chama not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/chamas/:id/summary", async (req, res): Promise<void> => {
  const params = GetChamaSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const chamaId = params.data.id;

  const [chama] = await db.select().from(chamasTable).where(eq(chamasTable.id, chamaId));
  if (!chama) {
    res.status(404).json({ error: "Chama not found" });
    return;
  }

  const [savingsResult] = await db
    .select({ total: sql<string>`coalesce(sum(${contributionsTable.amount}), 0)` })
    .from(contributionsTable)
    .where(
      sql`${contributionsTable.chamaId} = ${chamaId} AND ${contributionsTable.status} = 'completed'`
    );

  const [loanedResult] = await db
    .select({ total: sql<string>`coalesce(sum(${loansTable.principal}), 0)` })
    .from(loansTable)
    .where(sql`${loansTable.chamaId} = ${chamaId} AND ${loansTable.status} IN ('active', 'repaid')`);

  const [activeLoanResult] = await db
    .select({ count: sql<string>`count(*)` })
    .from(loansTable)
    .where(sql`${loansTable.chamaId} = ${chamaId} AND ${loansTable.status} = 'active'`);

  const [memberCountResult] = await db
    .select({ count: sql<string>`count(*)` })
    .from(membersTable)
    .where(eq(membersTable.chamaId, chamaId));

  const recentContributions = await db
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
    .where(eq(contributionsTable.chamaId, chamaId))
    .orderBy(sql`${contributionsTable.createdAt} DESC`)
    .limit(5);

  res.json({
    chamaId,
    totalSavings: parseFloat(savingsResult.total),
    totalLoaned: parseFloat(loanedResult.total),
    totalRepaid: 0,
    activeLoanCount: parseInt(activeLoanResult.count, 10),
    memberCount: parseInt(memberCountResult.count, 10),
    recentContributions: recentContributions.map((c) => ({
      ...c,
      amount: parseFloat(c.amount),
      paidAt: c.paidAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
  });
});

export default router;
