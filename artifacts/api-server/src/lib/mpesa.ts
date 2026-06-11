import axios from "axios";
import { logger } from "./logger";

const DARAJA_BASE_URL = "https://api.sandbox.safaricom.co.ke";

const getConfig = () => ({
  consumerKey: process.env.DARAJA_CONSUMER_KEY ?? "",
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET ?? "",
  shortCode: process.env.DARAJA_SHORT_CODE ?? "",
  passkey: process.env.DARAJA_PASSKEY ?? "",
});

export const getDarajaToken = async (): Promise<string> => {
  const config = getConfig();
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
  const response = await axios.get(
    `${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return response.data.access_token as string;
};

export const initiateMPesaSTKPush = async (
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
) => {
  const config = getConfig();

  if (!config.consumerKey || !config.consumerSecret || !config.shortCode || !config.passkey) {
    logger.warn("Daraja credentials not configured — returning mock STK push response");
    return {
      MerchantRequestID: `mock-${Date.now()}`,
      CheckoutRequestID: `mock-checkout-${Date.now()}`,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      CustomerMessage: "Success. Request accepted for processing",
    };
  }

  const token = await getDarajaToken();
  const timestamp = new Date().toISOString().replace(/[^\d]/g, "").slice(0, -3);
  const password = Buffer.from(`${config.shortCode}${config.passkey}${timestamp}`).toString("base64");

  const callbackUrl =
    process.env.MPESA_CALLBACK_URL ??
    `https://${process.env.REPLIT_DEV_DOMAIN}/api/mpesa/callback`;

  const response = await axios.post(
    `${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount),
      PartyA: phoneNumber,
      PartyB: config.shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return response.data;
};
