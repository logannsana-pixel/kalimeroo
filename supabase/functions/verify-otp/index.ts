import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normalisation et validation Congo mobile
function normalizeCongoMobile(raw: string): string {
  let p = raw.replace(/[\s\-\(\)]/g, "");
  if (p.startsWith("0")) p = p.slice(1);
  if (!p.match(/^6\d{7}$/)) throw new Error("Seuls les numéros mobiles sont acceptés (6xxxxxxxx)");
  return "+242" + p;
}

// Supabase admin (service role)
const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "Phone number and code are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const serviceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!accountSid || !authToken || !serviceSid) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formattedPhone = normalizeCongoMobile(phone);

    // Twilio Verification Check
    const twilioUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;
    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedPhone,
        Code: code,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Twilio error:", data);
      return new Response(JSON.stringify({ error: data.message || "Failed to verify OTP" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data.status !== "approved") {
      return new Response(JSON.stringify({ success: false, verified: false, message: "Code incorrect ou expiré" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ OTP validé → Auto-login avec Supabase
    const email = `${formattedPhone.replace("+", "")}@phone.lovable`;

    // Crée ou récupère user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.upsertUser({
      email,
      phone: formattedPhone,
      email_confirm: true,
      phone_confirm: true,
    });

    if (userError) throw userError;

    // Crée une session magique
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (sessionError) throw sessionError;

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        message: "Numéro vérifié avec succès",
        session: sessionData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
