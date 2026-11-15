import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export async function invokePayment(body: { action: "start" | "status"; order_id: string }) {
  const { data, error } = await supabase.functions.invoke("nyole-payment", { body });
  if (error) {
    const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
    try {
      const parsed = JSON.parse(details);
      throw new Error(parsed.details || parsed.error || details);
    } catch (parseError) {
      if (parseError instanceof SyntaxError) throw new Error(details);
      throw parseError;
    }
  }
  return data as { status: string; url?: string; due_now?: number; due_on_delivery?: number };
}