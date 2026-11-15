import { createClient } from "npm:@supabase/supabase-js@2";

export const adminClient = () => createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
const GATEWAY_URL = "https://connector-gateway.lovable.dev/udc_nyole";
export class ProviderError extends Error {
  constructor(public status: number, public details: string) { super(`[${status}]: ${details}`); }
}
export async function nyoleRequest(path: string, method = "GET", body?: unknown, idempotency?: string) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  const connectionKey = Deno.env.get("UDC_NYOLE_API_KEY");
  if (!key || !connectionKey) throw new Error("Nyole n'est pas connecté");
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json", ...(idempotency ? { "Idempotency-Key": idempotency } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const details = await response.text();
    console.error(`Nyole failed [${response.status}]: ${details}`);
    throw new ProviderError(response.status, details);
  }
  return response.json();
}
export function verifiedPaymentStatus(remote: { status?: string; paid?: boolean; amount?: number; currency?: string }, expected: number) {
  const status = remote.status?.toUpperCase();
  if (status === "SUCCESS") {
    if (remote.paid !== true || remote.amount !== expected || remote.currency !== "XAF") throw new Error("Confirmation de paiement incohérente");
    return "paid";
  }
  if (status === "FAILED") return "failed";
  if (status === "CANCELLED") return "cancelled";
  if (status === "REFUNDED") return "refunded";
  return "pending";
}
export async function reconcilePayment(orderId: string) {
  const db = adminClient();
  const { data: payment, error } = await db.from("order_payments").select("*").eq("order_id", orderId).single();
  if (error || !payment) throw new Error("Paiement introuvable");
  if (!payment.session_id || payment.method === "cod") return payment;
  const remote = await nyoleRequest(`/v1/checkout/sessions/${encodeURIComponent(payment.session_id)}/status`);
  if (remote.id !== payment.session_id) throw new Error("Session de paiement incohérente");
  const status = verifiedPaymentStatus(remote, payment.due_now);
  // A delayed pending/failed response must never erase an already confirmed payment.
  if (payment.status === "paid" && status !== "refunded") return payment;
  const update = { status, paid_amount: status === "paid" ? payment.due_now : 0, updated_at: new Date().toISOString() };
  const { data, error: updateError } = await db.from("order_payments").update(update).eq("order_id", orderId)
    .eq("status", payment.status).select().maybeSingle();
  if (updateError) throw updateError;
  return data ?? payment;
}