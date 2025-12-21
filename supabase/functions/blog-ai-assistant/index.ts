import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, content, title, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "optimize_seo":
        systemPrompt = "Tu es un expert SEO. Génère un meta_title (max 60 chars) et meta_description (max 160 chars) optimisés pour le SEO. Réponds UNIQUEMENT en JSON: {\"meta_title\": \"...\", \"meta_description\": \"...\"}";
        userPrompt = `Titre: ${title}\nContenu: ${content?.substring(0, 1000)}`;
        break;
      case "translate":
        const targetLang = language === "fr" ? "anglais" : "français";
        systemPrompt = `Tu es un traducteur professionnel. Traduis le texte en ${targetLang} en conservant le formatage Markdown.`;
        userPrompt = content || "";
        break;
      case "improve_readability":
        systemPrompt = "Tu es un rédacteur expert. Améliore la lisibilité du texte en gardant le sens et le formatage Markdown. Rends-le plus clair et engageant.";
        userPrompt = content || "";
        break;
      case "suggest_title":
        systemPrompt = "Tu es un expert en copywriting. Propose UN titre SEO accrocheur (max 60 chars). Réponds avec le titre seul, sans guillemets ni explications.";
        userPrompt = `Contenu: ${content?.substring(0, 500)}`;
        break;
      default:
        throw new Error("Action non reconnue");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("Erreur de l'IA");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
