import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, loansTable, membersTable, repaymentsTable } from "@workspace/db";
import {
  ListLoansParams,
  CreateLoanParams,
  CreateLoanBody,
  GetLoanParams,
  UpdateLoanParams,
  UpdateLoanBody,
  ListRepaymentsParams,
  RecordRepaymentParams,
  RecordRepaymentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const fmtLoan = async (loan: typeof loansTable.$inferSelect) => {
  const [member] = await db.select({ name: membersTable.name }).from(membersTable).where(eq(membersTable.id, loan.memberId));
  const repaid = await db
    .select({ amount: repaymentsTable.amount })
    .from(repaymentsTable)
    .where(eq(repaymentsTable.loanId, loan.id));
  const totalRepaid = repaid.reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const principal = parseFloat(loan.principal);
  const rate = parseFloat(loan.interestRate);
  const totalDue = principal + (principal * rate) / 100;
  return {
    id: loan.id,
    chamaId: loan.chamaId,
    memberId: loan.memberId,
    memberName: member?.name ?? "Unknown",
    principal,
    interestRate: rate,
    totalDue,
    totalRepaid,
    status: loan.status,
    disbursedAt: loan.disbursedAt?.toISOString() ?? null,
    dueDate: loan.dueDate,
    notes: loan.notes ?? null,
    createdAt: loan.createdAt.toISOString(),
  };
};

router.get("/chamas/:chamaId/loans", async (req, res): Promise<void> => {
  const params = ListLoansParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const loans = await db
    .select()
    .from(loansTable)
    .where(eq(loansTable.chamaId, params.data.chamaId))
    .orderBy(loansTable.createdAt);
  const result = await Promise.all(loans.map(fmtLoan));
  res.json(result);
});

router.post("/chamas/:chamaId/loans", async (req, res): Promise<void> => {
  const params = CreateLoanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateLoanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [loan] = await db
    .insert(loansTable)
    .values({
      chamaId: params.data.chamaId,
      memberId: parsed.data.memberId,
      principal: String(parsed.data.principal),
      interestRate: String(parsed.data.interestRate),
      dueDate: parsed.data.dueDate instanceof Date
        ? parsed.data.dueDate.toISOString().split("T")[0]
        : String(parsed.data.dueDate),
      notes: parsed.data.notes,
    })
    .returning();
  res.status(201).json(await fmtLoan(loan));
});

router.get("/chamas/:chamaId/loans/:loanId", async (req, res): Promise<void> => {
  const params = GetLoanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [loan] = await db
    .select()
    .from(loansTable)
    .where(and(eq(loansTable.chamaId, params.data.chamaId), eq(loansTable.id, params.data.loanId)));
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }
  res.json(await fmtLoan(loan));
});

router.patch("/chamas/:chamaId/loans/:loanId", async (req, res): Promise<void> => {
  const params = UpdateLoanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateLoanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.disbursedAt) {
    updates.disbursedAt = new Date(parsed.data.disbursedAt);
  }
  const [loan] = await db
    .update(loansTable)
    .set(updates)
    .where(and(eq(loansTable.chamaId, params.data.chamaId), eq(loansTable.id, params.data.loanId)))
    .returning();
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }
  res.json(await fmtLoan(loan));
});

router.get("/chamas/:chamaId/loans/:loanId/repayments", async (req, res): Promise<void> => {
  const params = ListRepaymentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(repaymentsTable)
    .where(eq(repaymentsTable.loanId, params.data.loanId))
    .orderBy(repaymentsTable.paidAt);
  res.json(
    rows.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
      paidAt: r.paidAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/chamas/:chamaId/loans/:loanId/repayments", async (req, res): Promise<void> => {
  const params = RecordRepaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = RecordRepaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [loan] = await db
    .select()
    .from(loansTable)
    .where(and(eq(loansTable.chamaId, params.data.chamaId), eq(loansTable.id, params.data.loanId)));
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }
  const [repayment] = await db
    .insert(repaymentsTable)
    .values({
      loanId: params.data.loanId,
      chamaId: params.data.chamaId,
      memberId: loan.memberId,
      amount: String(parsed.data.amount),
      mpesaRef: parsed.data.mpesaRef,
      paidAt: new Date(),
    })
    .returning();

  const allRepayments = await db
    .select({ amount: repaymentsTable.amount })
    .from(repaymentsTable)
    .where(eq(repaymentsTable.loanId, params.data.loanId));
  const totalRepaid = allRepayments.reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const principal = parseFloat(loan.principal);
  const rate = parseFloat(loan.interestRate);
  const totalDue = principal + (principal * rate) / 100;
  if (totalRepaid >= totalDue) {
    await db.update(loansTable).set({ status: "repaid" }).where(eq(loansTable.id, params.data.loanId));
  }

  res.status(201).json({
    ...repayment,
    amount: parseFloat(repayment.amount),
    paidAt: repayment.paidAt.toISOString(),
    createdAt: repayment.createdAt.toISOString(),
  });
});

export default router;
