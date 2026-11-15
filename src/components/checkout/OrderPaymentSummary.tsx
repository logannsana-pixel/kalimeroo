import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { invokePayment } from "@/services/checkoutPayments";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Payment = Database["public"]["Tables"]["order_payments"]["Row"];
export function OrderPaymentSummary({ orderId, customer = false, cancelled = false }: { orderId: string; customer?: boolean; cancelled?: boolean }) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const { data, error } = await supabase.from("order_payments").select("*").eq("order_id", orderId).maybeSingle();
    if (!error) setPayment(data);
  };
  useEffect(() => {
    load();
    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, [orderId]);
  const run = async (action: "start" | "status") => {
    setBusy(true);
    try {
      const data = await invokePayment({ action, order_id: orderId });
      if (action === "start" && data.url) window.location.assign(data.url);
      else { await load(); toast.info(data.status === "paid" ? "Paiement confirmé" : "Paiement non confirmé"); }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Vérification impossible"); }
    finally { setBusy(false); }
  };
  if (!payment) return null;
  const labels: Record<string, string> = { cod: "Paiement à la livraison", pending: "Paiement en attente", paid: "Paiement confirmé", failed: "Paiement échoué", cancelled: "Paiement annulé", refunded: "Paiement remboursé" };
  return <section className="border-t border-border pt-3 space-y-2 text-sm" aria-label="Paiement de la commande">
    <p className="font-medium">{labels[payment.status] ?? payment.status}{payment.livemode === false ? " · Test" : ""}</p>
    <div className="flex justify-between"><span className="text-muted-foreground">Payé en ligne</span><span>{payment.paid_amount} FCFA</span></div>
    {payment.due_now > 0 && payment.status !== "paid" && <div className="flex justify-between"><span>À payer en ligne</span><span>{payment.due_now} FCFA</span></div>}
    <div className="flex justify-between font-medium"><span>À régler à la livraison</span><span>{payment.due_on_delivery} FCFA</span></div>
    {customer && payment.due_now > 0 && !cancelled && !["paid", "refunded"].includes(payment.status) && <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={busy} onClick={() => run("start")}>Payer avec Nyole</Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => run("status")}>Vérifier le paiement</Button>
    </div>}
  </section>;
}