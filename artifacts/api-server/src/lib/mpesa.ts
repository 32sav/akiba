import axios from "axios";
import { logger } from "./logger";

const SANDBOX_BASE = "https://sandbox.safaricom.co.ke";
const PROD_BASE = "https://api.safaricom.co.ke";

function getBaseUrl() {
  return process.env.DARAJA_ENV === "production" ? PROD_BASE : SANDBOX_BASE;
}

const getConfig = () => ({
  consumerKey: process.env.DARAJA_CONSUMER_KEY ?? "",
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET ?? "",
  shortCode: process.env.DARAJA_SHORT_CODE ?? "",
  passkey: process.env.DARAJA_PASSKEY ?? "",
  b2cInitiatorName: process.env.DARAJA_B2C_INITIATOR_NAME ?? "",
  b2cSecurityCredential: process.env.DARAJA_B2C_SECURITY_CREDENTIAL ?? "",
});

const isConfigured = () => {
  const c = getConfig();
  return !!(c.consumerKey && c.consumerSecret && c.shortCode && c.passkey);
};

const isB2cConfigured = () => {
  const c = getConfig();
  return isConfigured() && !!(c.b2cInitiatorName && c.b2cSecurityCredential);
};

const tokenCache = { token: "", expiresAt: 0 };

export const getDarajaToken = async (): Promise<string> => {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const config = getConfig();
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");

  const response = await axios.get(
    `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  const { access_token } = response.data as { access_token: string };
  tokenCache.token = access_token;
  tokenCache.expiresAt = Date.now() + 50 * 60 * 1000;
  return access_token;
};

export function formatPhone(phone: string): string {
  return phone.replace(/^0/, "254").replace(/^\+/, "").replace(/\s/g, "");
}

function makeTimestamp(): string {
  return new Date().toISOString().replace(/[^\d]/g, "").slice(0, 14);
}

function makeStkPassword(shortCode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");
}

function getCallbackBaseUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN ?? process.env.BASE_URL ?? "";
  if (!domain) return "https://localhost";
  return domain.startsWith("http") ? domain : `https://${domain}`;
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

export const initiateMPesaSTKPush = async (
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<StkPushResult> => {
  const config = getConfig();

  if (!isConfigured()) {
    logger.warn("Daraja credentials not configured — returning mock STK push response");
    return {
      merchantRequestId: `mock-${Date.now()}`,
      checkoutRequestId: `mock-checkout-${Date.now()}`,
      responseCode: "0",
      responseDescription: "Success. Request accepted for processing",
      customerMessage: "Success. Request accepted for processing",
    };
  }

  const token = await getDarajaToken();
  const timestamp = makeTimestamp();
  const password = makeStkPassword(config.shortCode, config.passkey, timestamp);
  const callbackUrl = `${getCallbackBaseUrl()}/api/mpesa/callback`;

  const response = await axios.post(
    `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount),
      PartyA: formatPhone(phoneNumber),
      PartyB: config.shortCode,
      PhoneNumber: formatPhone(phoneNumber),
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = response.data as Record<string, string>;

  if (data.ResponseCode !== "0") {
    throw new Error(`STK Push failed: ${data.ResponseDescription}`);
  }

  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    responseCode: data.ResponseCode,
    responseDescription: data.ResponseDescription,
    customerMessage: data.CustomerMessage,
  };
};

export interface B2cPayoutResult {
  conversationId: string;
  originatorConversationId: string;
  responseCode: string;
  responseDescription: string;
}

export const initiateB2cPayout = async (
  phoneNumber: string,
  amount: number,
  chamaId: number,
  roundNumber: number
): Promise<B2cPayoutResult> => {
  const config = getConfig();

  if (!isB2cConfigured()) {
    logger.warn("Daraja B2C credentials not configured — returning mock B2C response");
    return {
      conversationId: `mock-conv-${Date.now()}`,
      originatorConversationId: `mock-orig-${Date.now()}`,
      responseCode: "0",
      responseDescription: "Accept the service request successfully.",
    };
  }

  const token = await getDarajaToken();
  const baseUrl = getCallbackBaseUrl();

  const response = await axios.post(
    `${getBaseUrl()}/mpesa/b2c/v3/paymentrequest`,
    {
      InitiatorName: config.b2cInitiatorName,
      SecurityCredential: config.b2cSecurityCredential,
      CommandID: "BusinessPayment",
      Amount: Math.round(amount),
      PartyA: config.shortCode,
      PartyB: formatPhone(phoneNumber),
      Remarks: `Chama ${chamaId} Round ${roundNumber} payout`,
      QueueTimeOutURL: `${baseUrl}/api/mpesa/webhooks/b2c-timeout`,
      ResultURL: `${baseUrl}/api/mpesa/webhooks/b2c-result`,
      Occassion: `Round ${roundNumber}`,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = response.data as Record<string, string>;

  return {
    conversationId: data.ConversationID,
    originatorConversationId: data.OriginatorConversationID,
    responseCode: data.ResponseCode,
    responseDescription: data.ResponseDescription,
  };
};

export const DARAJA_ERROR_CODES: Record<number, string> = {
  0: "Success",
  1: "Insufficient funds",
  17: "M-Pesa limit reached",
  1032: "Request cancelled by user",
  1037: "Request timed out — user did not respond",
  2001: "Wrong PIN entered",
};

export function getDarajaErrorMessage(resultCode: number): string {
  return DARAJA_ERROR_CODES[resultCode] ?? `M-Pesa error code ${resultCode}`;
}
