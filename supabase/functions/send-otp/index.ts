import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// ✅ Normalisation mobile Congo (FORMAT OFFICIEL TWILIO)
function normalizeCongoMobile(raw: string): string {
  const cleaned = raw.replace(/[\s\-\(\)]/g, "");

  // L'utilisateur DOIT entrer : 04xxxxxxx | 05xxxxxxx | 06xxxxxxx
  if (!/^0[456]\d{7}$/.test(cleaned)) {
    throw new Error("Numéro mobile invalide (04xxxxxxx, 05xxxxxxx, 06xxxxxxx)");
  }

  // 🔥 SUPPRESSION DU 0 NATIONAL (OBLIGATOIRE)
  const withoutZero = cleaned.slice(1);

  // FORMAT E.164
  return "+242" + withoutZero;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number is required" }), { status: 400, headers: corsHeaders });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const serviceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!accountSid || !authToken || !serviceSid) {
      return new Response(JSON.stringify({ error: "Twilio configuration error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // ✅ NORMALISATION UNIQUE
    let formattedPhone: string;
    try {
      formattedPhone = normalizeCongoMobile(phone);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
    }

    // 🔍 DEBUG (À GARDER JUSQU’À VALIDATION)
    console.log("📞 PHONE SENT TO TWILIO =", formattedPhone);

    // ✅ APPEL TWILIO VERIFY (FormData recommandé)
    const form = new FormData();
    form.append("To", formattedPhone);
    form.append("Channel", "sms");

    const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      },
      body: form,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Twilio error:", data);
      return new Response(JSON.stringify({ error: data.message || "Failed to send OTP" }), {
        status: response.status,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: data.status,
        message: "Code envoyé par SMS",
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("🔥 Edge error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
