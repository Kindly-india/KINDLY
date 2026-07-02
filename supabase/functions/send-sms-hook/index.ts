// Supabase Auth "Send SMS" hook — routes phone OTPs through 2Factor.in instead
// of Supabase's own (Twilio-based) SMS provider.
//
// Required secrets (set via `supabase secrets set`, never hardcoded here):
//   TWOFACTOR_API_KEY   - your 2Factor.in transactional API key
//   SEND_SMS_HOOK_SECRET - the "whsec_..." value Supabase shows when you
//                          enable this hook in Authentication -> Hooks
//
// Supabase signs every hook request per the Standard Webhooks spec
// (webhook-id / webhook-timestamp / webhook-signature headers). Skipping
// verification would let anyone who finds this function's URL POST to it
// and fire SMS through your 2Factor account on your dime — so verification
// isn't optional here, it's the only thing standing between this endpoint
// and being a free SMS relay for whoever finds the URL.
import { Webhook } from "npm:standardwebhooks@1.0.0";

const TWOFACTOR_API_KEY = Deno.env.get("TWOFACTOR_API_KEY");
const HOOK_SECRET = Deno.env.get("SEND_SMS_HOOK_SECRET");

interface SendSmsPayload {
  user: { phone: string };
  sms: { otp: string };
}

function hookError(httpCode: number, message: string) {
  return new Response(
    JSON.stringify({ error: { http_code: httpCode, message } }),
    { status: httpCode, headers: { "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req) => {
  if (!TWOFACTOR_API_KEY || !HOOK_SECRET) {
    console.error("Missing TWOFACTOR_API_KEY or SEND_SMS_HOOK_SECRET secret");
    return hookError(500, "Server misconfigured");
  }

  const rawBody = await req.text();

  // Verify this request genuinely came from Supabase Auth, not a spoofed caller.
  let payload: SendSmsPayload;
  try {
    const webhook = new Webhook(HOOK_SECRET);
    payload = webhook.verify(rawBody, Object.fromEntries(req.headers)) as SendSmsPayload;
  } catch (err) {
    console.error("Hook signature verification failed:", err);
    return hookError(401, "Invalid signature");
  }

  const phone = payload.user?.phone;
  const otp = payload.sms?.otp;

  if (!phone || !otp) {
    return hookError(400, "Missing user.phone or sms.otp in payload");
  }

  try {
    const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${phone}/${otp}`;
    const res = await fetch(url, { method: "GET" });
    const body = await res.json().catch(() => null);

    // 2Factor returns 200 with { Status: "Success" | "Error", ... } — an HTTP
    // 200 alone doesn't guarantee the SMS was actually accepted.
    if (!res.ok || body?.Status !== "Success") {
      console.error("2Factor send failed:", res.status, body);
      return hookError(500, "Failed to send SMS via 2Factor");
    }
  } catch (err) {
    console.error("2Factor request threw:", err);
    return hookError(500, "Failed to reach 2Factor");
  }

  // Send SMS hook just needs a 200 acknowledgement, no transformed payload.
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
