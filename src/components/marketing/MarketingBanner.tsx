import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketingBannerData {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  background_color: string | null;
  text_color: string | null;
}

export function MarketingBanner() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState<MarketingBannerData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase
          .from("marketing_banners")
          .select("*")
          .eq("is_active", true)
          .eq("position", "top")
          .order("display_order", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          setBanner(data);
        }
      } catch (error) {
        console.error("Error fetching banner:", error);
      }
    };

    fetchBanner();
  }, []);

  const handleClick = async () => {
    if (!banner) return;
    
    // Track click
    await supabase
      .from("marketing_banners")
      .update({ click_count: (banner as any).click_count + 1 })
      .eq("id", banner.id);

    if (banner.link_url) {
      if (banner.link_url.startsWith("http")) {
        window.open(banner.link_url, "_blank");
      } else {
        navigate(banner.link_url);
      }
    }
  };

  if (!banner || dismissed) return null;

  return (
    <div 
      className="relative overflow-hidden rounded-2xl p-4 shadow-lg"
      style={{ 
        backgroundColor: banner.background_color || "hsl(var(--primary))",
        color: banner.text_color || "white"
      }}
    >
      {/* Decorations */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full blur-xl" />
      
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="relative z-10 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{banner.title}</span>
          </div>
          {banner.subtitle && (
            <p className="text-xs opacity-90 line-clamp-2">{banner.subtitle}</p>
          )}
        </div>
        {banner.link_url && (
          <Button 
            size="sm"
            onClick={handleClick}
            className="bg-white/20 hover:bg-white/30 text-inherit text-xs h-8 px-3"
          >
            {banner.link_text || "Voir"}
            <ArrowRight className="ml-1 w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
