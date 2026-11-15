import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { adminClient, nyoleRequest, ProviderError, reconcilePayment } from "../_shared/nyole.ts";

const Input = z.object({ action: z.enum(["start", "status"]), order_id: z.string().uuid() });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Connexion requise" }, 401);
    const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return json({ error: "Connexion requise" }, 401);
    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Demande invalide" }, 400);
    const { action, order_id } = parsed.data;
    const db = adminClient();
    const { data: order } = await db.from("orders").select("id,user_id,status,phone").eq("id", order_id).eq("user_id", user.id).maybeSingle();
    if (!order) return json({ error: "Commande introuvable" }, 404);
    let payment = await reconcilePayment(order_id);
    if (action === "status" || payment.status === "paid" || payment.method === "cod") return json(payment);
    if (order.status === "cancelled" || payment.status === "refunded") return json({ error: "Commande annulée ou remboursée" }, 409);
    if (payment.session_id && payment.checkout_url && payment.status !== "cancelled") return json({ ...payment, url: payment.checkout_url });
    // Never accept client-supplied return destinations or amounts.
    const origin = req.headers.get("Origin") ?? "";
    const allowed = ["https://kalimeroo.lovable.app", "https://kalimeroo.vercel.app", "http://localhost:8080", "https://id-preview--ba44aca0-da00-438a-97f5-d6a21390cbe7.lovable.app"];
    const returnOrigin = allowed.includes(origin) ? origin : allowed[0];
    const session = await nyoleRequest("/v1/checkout/sessions", "POST", {
      amount: payment.due_now, currency: "XAF", customer_email: user.email, customer_phone: order.phone,
      description: `Commande Kalimero ${order_id.slice(0, 8)}`, merchant_name: "Kalimero",
      success_url: `${returnOrigin}/orders?payment_order=${order_id}`,
      cancel_url: `${returnOrigin}/orders?payment_order=${order_id}`,
      metadata: { order_id, source: "kalimero" },
    }, `kalimero-${order_id}-${payment.session_id ?? "initial"}`);
    if (typeof session.id !== "string" || typeof session.url !== "string" || !session.url.startsWith("https://app.nyole.com/checkout/")) throw new Error("Réponse Nyole invalide");
    const { error: updateError } = await db.from("order_payments").update({ session_id: session.id, checkout_url: session.url, livemode: session.livemode, status: "pending" }).eq("order_id", order_id);
    if (updateError) throw updateError;
    return json({ status: "pending", url: session.url });
  } catch (error) {
    if (error instanceof ProviderError) return json({ error: "Nyole a refusé la demande", status: error.status, details: error.details }, error.status);
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Erreur de paiement" }, 400);
  }
});