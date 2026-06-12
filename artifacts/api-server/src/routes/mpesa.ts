import { Router, type IRouter } from "express";
import { eq, and, desc, lt } from "drizzle-orm";
import {
  db,
  mpesaTransactionsTable,
  contributionsTable,
  membersTable,
} from "@workspace/db";
import {
  InitiateMpesaPaymentBody,
  DisburseB2cPayoutBody,
  ListMpesaTransactionsParams,
} from "@workspace/api-zod";
import {
  initiateMPesaSTKPush,
  initiateB2cPayout,
  getDarajaErrorMessage,
  formatPhone,
} from "../lib/mpesa";

const router: IRouter = Router();

router.post("/mpesa/stkpush", async (req, res): Promise<void> => {
  const parsed = InitiateMpesaPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { phoneNumber, amount, accountReference, transactionDesc, chamaId, memberId } =
    parsed.data;

  let contributionId: number | undefined;

  if (chamaId && memberId) {
    const [contribution] = await db
      .insert(contributionsTable)
      .values({
        chamaId,
        memberId,
        amount: String(amount),
        status: "pending",
      })
      .returning();
    contributionId = contribution.id;
  }

  const result = await initiateMPesaSTKPush(
    phoneNumber,
    amount,
    accountReference,
    transactionDesc
  );

  if (chamaId && contributionId) {
    await db.insert(mpesaTransactionsTable).values({
      checkoutRequestId: result.checkoutRequestId,
      merchantRequestId: result.merchantRequestId,
      chamaId,
      memberId: memberId ?? null,
      contributionId,
      type: "contribution",
      amount: String(amount),
      phoneNumber: formatPhone(phoneNumber),
      status: "pending",
    });
  }

  res.json({
    merchantRequestId: result.merchantRequestId,
    checkoutRequestId: result.checkoutRequestId,
    responseCode: result.responseCode,
    responseDescription: result.responseDescription,
    customerMessage: result.customerMessage,
    contributionId: contributionId ?? null,
  });
});

router.post("/mpesa/callback", async (req, res): Promise<void> => {
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) return;

    const { CheckoutRequestID, ResultCode, ResultDesc } = callback as {
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
    };

    const [tx] = await db
      .select()
      .from(mpesaTransactionsTable)
      .where(eq(mpesaTransactionsTable.checkoutRequestId, CheckoutRequestID))
      .limit(1);

    if (!tx) {
      req.log.warn({ CheckoutRequestID }, "STK callback: unknown checkoutRequestId");
      return;
    }

    if (tx.status !== "pending") {
      req.log.info({ CheckoutRequestID }, "STK callback: already processed — skipping");
      return;
    }

    if (ResultCode === 0) {
      const items: Array<{ Name: string; Value: string | number }> =
        callback.CallbackMetadata?.Item ?? [];
      const get = (name: string) => items.find((i) => i.Name === name)?.Value;

      const mpesaReceiptNumber = String(get("MpesaReceiptNumber") ?? "");
      const paidAmount = Number(get("Amount") ?? tx.amount);

      await db
        .update(mpesaTransactionsTable)
        .set({
          status: "completed",
          mpesaReceiptNumber,
          completedAt: new Date(),
        })
        .where(eq(mpesaTransactionsTable.id, tx.id));

      if (tx.contributionId) {
        await db
          .update(contributionsTable)
          .set({
            status: "completed",
            mpesaRef: mpesaReceiptNumber,
            amount: String(paidAmount),
            paidAt: new Date(),
          })
          .where(eq(contributionsTable.id, tx.contributionId));
      }

      req.log.info(
        { CheckoutRequestID, mpesaReceiptNumber, amount: paidAmount },
        "STK callback: payment completed"
      );
    } else {
      const isCancel = ResultCode === 1032;
      const newStatus = isCancel ? "cancelled" : "failed";

      await db
        .update(mpesaTransactionsTable)
        .set({ status: newStatus, failureReason: ResultDesc })
        .where(eq(mpesaTransactionsTable.id, tx.id));

      if (tx.contributionId) {
        await db
          .update(contributionsTable)
          .set({ status: "failed" })
          .where(eq(contributionsTable.id, tx.contributionId));
      }

      req.log.warn(
        { CheckoutRequestID, ResultCode, ResultDesc },
        `STK callback: payment ${newStatus}`
      );
    }
  } catch (err) {
    req.log.error({ err }, "STK callback processing error");
  }
});

router.post("/mpesa/disburse", async (req, res): Promise<void> => {
  const parsed = DisburseB2cPayoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { chamaId, memberId, phoneNumber, amount, roundNumber } = parsed.data;

  const result = await initiateB2cPayout(phoneNumber, amount, chamaId, roundNumber);

  await db.insert(mpesaTransactionsTable).values({
    conversationId: result.conversationId,
    originatorConversationId: result.originatorConversationId,
    chamaId,
    memberId,
    type: "payout",
    amount: String(amount),
    phoneNumber: formatPhone(phoneNumber),
    status: "pending",
  });

  res.json({
    conversationId: result.conversationId,
    originatorConversationId: result.originatorConversationId,
    responseCode: result.responseCode,
    responseDescription: result.responseDescription,
  });
});

router.post("/mpesa/webhooks/b2c-result", async (req, res): Promise<void> => {
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  try {
    const result = req.body?.Result;
    if (!result) return;

    const { ConversationID, ResultCode, ResultDesc, ResultParameters } = result as {
      ConversationID: string;
      ResultCode: number;
      ResultDesc: string;
      ResultParameters?: { ResultParameter: Array<{ Key: string; Value: string | number }> };
    };

    const [tx] = await db
      .select()
      .from(mpesaTransactionsTable)
      .where(eq(mpesaTransactionsTable.conversationId, ConversationID))
      .limit(1);

    if (!tx) return;

    if (ResultCode === 0) {
      const params = ResultParameters?.ResultParameter ?? [];
      const get = (key: string) => params.find((p) => p.Key === key)?.Value;

      await db
        .update(mpesaTransactionsTable)
        .set({
          status: "completed",
          mpesaReceiptNumber: String(get("TransactionReceipt") ?? get("TransactionID") ?? ""),
          completedAt: new Date(),
        })
        .where(eq(mpesaTransactionsTable.id, tx.id));

      req.log.info({ ConversationID }, "B2C payout completed");
    } else {
      await db
        .update(mpesaTransactionsTable)
        .set({ status: "failed", failureReason: ResultDesc })
        .where(eq(mpesaTransactionsTable.id, tx.id));

      req.log.warn({ ConversationID, ResultCode, ResultDesc }, "B2C payout failed");
    }
  } catch (err) {
    req.log.error({ err }, "B2C result callback error");
  }
});

router.post("/mpesa/webhooks/b2c-timeout", async (req, res): Promise<void> => {
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  try {
    const ConversationID = req.body?.Result?.ConversationID as string | undefined;
    if (ConversationID) {
      await db
        .update(mpesaTransactionsTable)
        .set({ status: "timeout" })
        .where(eq(mpesaTransactionsTable.conversationId, ConversationID));

      req.log.warn({ ConversationID }, "B2C payout timed out");
    }
  } catch (err) {
    req.log.error({ err }, "B2C timeout callback error");
  }
});

router.get("/chamas/:chamaId/transactions", async (req, res): Promise<void> => {
  const params = ListMpesaTransactionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      id: mpesaTransactionsTable.id,
      chamaId: mpesaTransactionsTable.chamaId,
      memberId: mpesaTransactionsTable.memberId,
      memberName: membersTable.name,
      contributionId: mpesaTransactionsTable.contributionId,
      type: mpesaTransactionsTable.type,
      amount: mpesaTransactionsTable.amount,
      phoneNumber: mpesaTransactionsTable.phoneNumber,
      status: mpesaTransactionsTable.status,
      mpesaReceiptNumber: mpesaTransactionsTable.mpesaReceiptNumber,
      checkoutRequestId: mpesaTransactionsTable.checkoutRequestId,
      conversationId: mpesaTransactionsTable.conversationId,
      failureReason: mpesaTransactionsTable.failureReason,
      createdAt: mpesaTransactionsTable.createdAt,
      completedAt: mpesaTransactionsTable.completedAt,
    })
    .from(mpesaTransactionsTable)
    .leftJoin(membersTable, eq(mpesaTransactionsTable.memberId, membersTable.id))
    .where(eq(mpesaTransactionsTable.chamaId, params.data.chamaId))
    .orderBy(desc(mpesaTransactionsTable.createdAt))
    .limit(100);

  res.json(
    rows.map((r) => ({
      ...r,
      memberName: r.memberName ?? null,
      amount: parseFloat(r.amount),
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    }))
  );
});

router.post("/mpesa/reconcile", async (req, res): Promise<void> => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const stale = await db
    .select()
    .from(mpesaTransactionsTable)
    .where(
      and(
        eq(mpesaTransactionsTable.status, "pending"),
        lt(mpesaTransactionsTable.createdAt, fiveMinutesAgo)
      )
    );

  const expired = stale.filter((tx) => !tx.mpesaReceiptNumber);
  for (const tx of expired) {
    await db
      .update(mpesaTransactionsTable)
      .set({ status: "expired" })
      .where(eq(mpesaTransactionsTable.id, tx.id));

    if (tx.contributionId) {
      await db
        .update(contributionsTable)
        .set({ status: "failed" })
        .where(eq(contributionsTable.id, tx.contributionId));
    }
  }

  res.json({ expiredCount: expired.length });
});

export default router;
