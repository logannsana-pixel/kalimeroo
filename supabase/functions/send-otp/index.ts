import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// ✅ Normalisation mobile Congo (accepte plusieurs formats)
// Entrées acceptées :
// - 04xxxxxxx | 05xxxxxxx | 06xxxxxxx
// - 4xxxxxxx  | 5xxxxxxx  | 6xxxxxxx
// - +2424xxxxxxx | +2425xxxxxxx | +2426xxxxxxx
// - 2424xxxxxxx  | 2425xxxxxxx  | 2426xxxxxxx
// Sortie (E.164) : +2420XXXXXXXX (9 chiffres après +242)
// NB: pour le Congo, le "0" (04/05/06) est généralement conservé dans le format international.
function normalizeCongoMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  // retire l'indicatif si présent
  let national = digits.startsWith("242") ? digits.slice(3) : digits;

  // si 8 chiffres (sans 0) : 4/5/6 + 7 digits → on préfixe 0
  if (/^[456]\d{7}$/.test(national)) {
    national = "0" + national;
  }

  // format local complet (9 chiffres) : 0[456] + 7 digits
  if (!/^0[456]\d{7}$/.test(national)) {
    throw new Error("Numéro mobile invalide (04xxxxxxx, 05xxxxxxx, 06xxxxxxx)");
  }

  return "+242" + national;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number is required" }), {
        status: 400,
        headers: corsHeaders,
      });
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

    let formattedPhone: string;
    try {
      formattedPhone = normalizeCongoMobile(phone);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ✅ APPEL TWILIO VERIFY (x-www-form-urlencoded)
    const twilioUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedPhone,
        Channel: "sms",
      }),
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
    console.error("🔥 send-otp error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
