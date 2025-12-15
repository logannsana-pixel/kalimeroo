import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// ✅ Normalisation mobile Congo (accepte plusieurs formats)
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

// Mode développement: codes OTP statiques pour tests
const DEV_MODE = Deno.env.get("DEV_MODE") === "true";
const DEV_OTP_CODE = "123456";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, devBypass } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ success: false, message: "Numéro de téléphone requis" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    let formattedPhone: string;
    try {
      formattedPhone = normalizeCongoMobile(phone);
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, message: err.message }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Mode développement: bypass Twilio pour tests
    if (DEV_MODE || devBypass) {
      console.log(`[DEV] OTP bypass pour ${formattedPhone}. Code: ${DEV_OTP_CODE}`);
      return new Response(
        JSON.stringify({
          success: true,
          status: "pending",
          message: "Mode test: utilisez le code 123456",
          dev_mode: true,
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const serviceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!accountSid || !authToken || !serviceSid) {
      console.error("Missing Twilio configuration");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Configuration SMS non disponible. Contactez le support.",
        error_code: "CONFIG_ERROR"
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // APPEL TWILIO VERIFY
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
      
      // Gestion des erreurs Twilio spécifiques
      if (data?.code === 21608) {
        // Compte trial - numéro non vérifié
        return new Response(
          JSON.stringify({
            success: false,
            message: "Service SMS en maintenance. Utilisez le code test: 123456",
            twilio_error: "trial_unverified",
            use_dev_code: true,
          }),
          { status: 200, headers: corsHeaders },
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: data?.message || "Impossible d'envoyer le SMS. Réessayez.",
          twilio_status: data?.status ?? null,
        }),
        { status: 200, headers: corsHeaders },
      );
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
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Erreur serveur. Réessayez ou utilisez le code test: 123456",
      use_dev_code: true
    }), {
      status: 200,
      headers: corsHeaders,
    });
  }
});
