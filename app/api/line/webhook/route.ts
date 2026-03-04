import crypto from "crypto";
import { ok } from "@/lib/api";
import { processPendingDispatchesByLineUser } from "@/lib/line-dispatch";

type FollowEvent = {
  type: "follow";
  source?: {
    userId?: string;
  };
};

type WebhookPayload = {
  events?: FollowEvent[];
};

function validateSignature(rawBody: string, signature: string | null): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET ?? "";
  if (!channelSecret || !signature) {
    return false;
  }

  const hmac = crypto
    .createHmac("sha256", channelSecret)
    .update(rawBody)
    .digest("base64");

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-line-signature");
  const rawBody = await req.text();

  if (!validateSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const events = payload.events ?? [];

  for (const event of events) {
    if (event.type !== "follow") {
      continue;
    }

    const lineUserId = event.source?.userId;
    if (!lineUserId) {
      continue;
    }

    await processPendingDispatchesByLineUser(lineUserId);
  }

  return ok();
}
