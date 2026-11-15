import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { adminClient, ProviderError, reconcilePayment } from "../_shared/nyole.ts";

// Notifications are only wake-up signals. Every status/amount is independently
// fetched using the private Nyole connection; no webhook payload can confirm a payment.
const Event = z.object({ data: z.object({ id: z.string().min(1).max(200) }) });
Deno.serve(async (req) => {
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const parsed = Event.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid notification" }, 400);
    const { data } = await adminClient().from("order_payments").select("order_id").eq("session_id", parsed.data.data.id).maybeSingle();
    if (data) await reconcilePayment(data.order_id);
    return json({ received: true });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof ProviderError ? error.details : "Verification failed" }, error instanceof ProviderError ? error.status : 500);
  }
});