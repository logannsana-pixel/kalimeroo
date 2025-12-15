import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Normalisation et validation Congo mobile (accepte plusieurs formats)
// Entrées acceptées :
// - 04xxxxxxx | 05xxxxxxx | 06xxxxxxx
// - 4xxxxxxx  | 5xxxxxxx  | 6xxxxxxx
// - +2424xxxxxxx | +2425xxxxxxx | +2426xxxxxxx
// - 2424xxxxxxx  | 2425xxxxxxx  | 2426xxxxxxx
// Sortie (E.164) : +2420XXXXXXXX (9 chiffres après +242)
function normalizeCongoMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let national = digits.startsWith("242") ? digits.slice(3) : digits;

  // si 8 chiffres (sans 0) : 4/5/6 + 7 digits → on préfixe 0
  if (/^[456]\d{7}$/.test(national)) {
    national = "0" + national;
  }

  // format local complet (9 chiffres) : 0[456] + 7 digits
  if (!/^0[456]\d{7}$/.test(national)) {
    throw new Error("Seuls les numéros mobiles sont acceptés (04xxxxxxx, 05xxxxxxx, 06xxxxxxx)");
  }

  return "+242" + national;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();

    // IMPORTANT UX: ne pas renvoyer 4xx pour "code incorrect" ou erreurs utilisateur
    if (!phone || !code) {
      return new Response(JSON.stringify({ success: false, verified: false, message: "Phone number and code are required" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const serviceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!accountSid || !authToken || !serviceSid) {
      return new Response(JSON.stringify({ success: false, verified: false, message: "Server configuration error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    let formattedPhone: string;
    try {
      formattedPhone = normalizeCongoMobile(phone);
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, verified: false, message: err.message }), {
        status: 200,
        headers: corsHeaders,
      });
    }

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
        Code: String(code),
      }),
    });

    const data = await response.json();

    // Même en erreur Twilio, on renvoie 200 pour éviter "Edge function returned 400" côté client
    if (!response.ok) {
      console.error("Twilio error:", data);
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: data?.message || "Code incorrect ou expiré",
          twilio_status: data?.status ?? null,
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    if (data.status !== "approved") {
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: "Code incorrect ou expiré",
          twilio_status: data.status,
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        message: "Numéro vérifié avec succès",
        twilio_status: data.status,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return new Response(JSON.stringify({ success: false, verified: false, message: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
