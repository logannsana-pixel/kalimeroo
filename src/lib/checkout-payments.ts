export type PaymentMethod = "cod" | "mobile_money" | "deposit";
export interface CheckoutSettings {
  allow_cod: boolean;
  allow_mobile_money: boolean;
  deposit_type: "none" | "percentage" | "fixed";
  deposit_value: number;
}
export const defaultCheckoutSettings: CheckoutSettings = {
  allow_cod: true, allow_mobile_money: false, deposit_type: "none", deposit_value: 0,
};
export function paymentAmounts(total: number, method: PaymentMethod, settings: CheckoutSettings) {
  const amount = Math.max(0, Math.round(total));
  if (!Number.isFinite(amount)) throw new Error("Montant invalide");
  if (method === "cod" && !settings.allow_cod) throw new Error("Paiement à la livraison indisponible");
  if (method !== "cod" && !settings.allow_mobile_money) throw new Error("Mobile Money indisponible");
  if (method === "deposit" && (settings.deposit_type === "none" || settings.deposit_value <= 0 ||
    !Number.isFinite(settings.deposit_value) || (settings.deposit_type === "percentage" && settings.deposit_value >= 100))) {
    throw new Error("Acompte invalide");
  }
  const dueNow = method === "cod" ? 0 : method === "mobile_money" ? amount : Math.min(amount,
    Math.ceil(settings.deposit_type === "percentage" ? amount * settings.deposit_value / 100 : settings.deposit_value));
  return { dueNow, dueOnDelivery: amount - dueNow };
}