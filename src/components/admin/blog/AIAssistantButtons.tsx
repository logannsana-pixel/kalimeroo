import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wand2, Languages, Sparkles, Type, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AIAssistantButtonsProps {
  content: string;
  title: string;
  language: 'fr' | 'en';
  onContentUpdate: (content: string) => void;
  onTitleUpdate: (title: string) => void;
  onMetaUpdate: (meta: { meta_title: string; meta_description: string }) => void;
}

export function AIAssistantButtons({
  content,
  title,
  language,
  onContentUpdate,
  onTitleUpdate,
  onMetaUpdate,
}: AIAssistantButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const callAI = async (action: string, prompt: string): Promise<string | null> => {
    try {
      const response = await supabase.functions.invoke("blog-ai-assistant", {
        body: { action, prompt, content, title, language },
      });

      if (response.error) throw response.error;
      return response.data?.result || null;
    } catch (error) {
      console.error("AI error:", error);
      toast.error("Erreur lors de l'appel à l'IA");
      return null;
    }
  };

  const handleOptimizeSEO = async () => {
    setLoading("seo");
    try {
      const result = await callAI("optimize_seo", "Optimise cet article pour le SEO");
      if (result) {
        try {
          const parsed = JSON.parse(result);
          if (parsed.meta_title && parsed.meta_description) {
            onMetaUpdate({
              meta_title: parsed.meta_title,
              meta_description: parsed.meta_description,
            });
            toast.success("SEO optimisé");
          }
        } catch {
          toast.error("Format de réponse invalide");
        }
      }
    } finally {
      setLoading(null);
    }
  };

  const handleTranslate = async () => {
    setLoading("translate");
    try {
      const targetLang = language === "fr" ? "anglais" : "français";
      const result = await callAI("translate", `Traduis cet article en ${targetLang}`);
      if (result) {
        onContentUpdate(result);
        toast.success(`Article traduit en ${targetLang}`);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleImproveReadability = async () => {
    setLoading("readability");
    try {
      const result = await callAI("improve_readability", "Améliore la lisibilité de cet article");
      if (result) {
        onContentUpdate(result);
        toast.success("Lisibilité améliorée");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleSuggestTitle = async () => {
    setLoading("title");
    try {
      const result = await callAI("suggest_title", "Propose un titre SEO accrocheur pour cet article");
      if (result) {
        onTitleUpdate(result.replace(/^["']|["']$/g, ""));
        toast.success("Nouveau titre proposé");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading !== null}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4 mr-2" />
          )}
          Assistant IA
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleOptimizeSEO} disabled={loading !== null}>
          <Sparkles className="h-4 w-4 mr-2" />
          Optimiser SEO
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTranslate} disabled={loading !== null}>
          <Languages className="h-4 w-4 mr-2" />
          Traduire {language === "fr" ? "EN" : "FR"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleImproveReadability} disabled={loading !== null}>
          <Sparkles className="h-4 w-4 mr-2" />
          Améliorer lisibilité
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSuggestTitle} disabled={loading !== null}>
          <Type className="h-4 w-4 mr-2" />
          Proposer titre SEO
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
