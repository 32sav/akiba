import { Router, type IRouter } from "express";
import { InitiateMpesaPaymentBody } from "@workspace/api-zod";
import { initiateMPesaSTKPush } from "../lib/mpesa";

const router: IRouter = Router();

router.post("/mpesa/stkpush", async (req, res): Promise<void> => {
  const parsed = InitiateMpesaPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phoneNumber, amount, accountReference, transactionDesc } = parsed.data;
  const result = await initiateMPesaSTKPush(phoneNumber, amount, accountReference, transactionDesc);
  res.json({
    merchantRequestId: result.MerchantRequestID as string,
    checkoutRequestId: result.CheckoutRequestID as string,
    responseCode: result.ResponseCode as string,
    responseDescription: result.ResponseDescription as string,
    customerMessage: result.CustomerMessage as string,
  });
});

router.post("/mpesa/callback", async (req, res): Promise<void> => {
  req.log.info({ body: req.body }, "M-Pesa callback received");
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

export default router;
