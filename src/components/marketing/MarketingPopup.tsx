import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MarketingPopupData {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  popup_type: string | null;
  display_frequency: string | null;
  target_pages: string[] | null;
}

const POPUP_STORAGE_KEY = "kalimero_seen_popups";

export function MarketingPopup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [popup, setPopup] = useState<MarketingPopupData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchPopup = async () => {
      // Get current page name
      const currentPage = location.pathname === "/" ? "home" : location.pathname.slice(1);
      
      try {
        const { data, error } = await supabase
          .from("marketing_popups")
          .select("*")
          .eq("is_active", true)
          .contains("target_pages", [currentPage]);

        if (data && data.length > 0 && !error) {
          // Check if popup was already seen
          const seenPopups = JSON.parse(localStorage.getItem(POPUP_STORAGE_KEY) || "{}");
          
          const validPopup = data.find(p => {
            if (p.display_frequency === "once" && seenPopups[p.id]) {
              return false;
            }
            if (p.display_frequency === "daily") {
              const lastSeen = seenPopups[p.id];
              if (lastSeen) {
                const lastSeenDate = new Date(lastSeen).toDateString();
                const today = new Date().toDateString();
                if (lastSeenDate === today) return false;
              }
            }
            return true;
          });

          if (validPopup) {
            setPopup(validPopup);
            // Delay popup show for better UX
            setTimeout(() => setIsOpen(true), 1500);
          }
        }
      } catch (error) {
        console.error("Error fetching popup:", error);
      }
    };

    fetchPopup();
  }, [location.pathname]);

  const handleClose = async () => {
    if (popup) {
      // Mark as seen
      const seenPopups = JSON.parse(localStorage.getItem(POPUP_STORAGE_KEY) || "{}");
      seenPopups[popup.id] = new Date().toISOString();
      localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify(seenPopups));

      // Track display
      await supabase
        .from("marketing_popups")
        .update({ display_count: ((popup as any).display_count || 0) + 1 })
        .eq("id", popup.id);
    }
    setIsOpen(false);
  };

  const handleButtonClick = async () => {
    if (!popup) return;

    // Track click
    await supabase
      .from("marketing_popups")
      .update({ click_count: ((popup as any).click_count || 0) + 1 })
      .eq("id", popup.id);

    if (popup.button_url) {
      if (popup.button_url.startsWith("http")) {
        window.open(popup.button_url, "_blank");
      } else {
        navigate(popup.button_url);
      }
    }
    handleClose();
  };

  if (!popup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-background/80 backdrop-blur p-1.5 hover:bg-background"
        >
          <X className="w-4 h-4" />
        </button>

        {popup.image_url && (
          <div className="w-full h-40 bg-muted">
            <img
              src={popup.image_url}
              alt={popup.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-5">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-lg">{popup.title}</DialogTitle>
            {popup.content && (
              <DialogDescription className="text-sm">
                {popup.content}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Plus tard
            </Button>
            {popup.button_url && (
              <Button
                className="flex-1"
                onClick={handleButtonClick}
              >
                {popup.button_text || "OK"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
