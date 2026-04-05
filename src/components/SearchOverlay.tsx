import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/contexts/LocationContext";
import { LazyImage } from "@/components/LazyImage";

interface SearchResult {
  restaurants: Array<{ id: string; name: string; image_url: string | null; cuisine_type: string | null; delivery_time: string | null }>;
  menuItems: Array<{ id: string; name: string; price: number; image_url: string | null; restaurant_id: string; restaurant_name?: string }>;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const navigate = useNavigate();
  const { city } = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ restaurants: [], menuItems: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults({ restaurants: [], menuItems: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ restaurants: [], menuItems: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const searchTerm = `%${query.trim()}%`;

        let restQuery = supabase
          .from("restaurants")
          .select("id, name, image_url, cuisine_type, delivery_time")
          .eq("is_active", true)
          .ilike("name", searchTerm)
          .limit(5);

        if (city) restQuery = restQuery.eq("city", city);

        const { data: restaurants } = await restQuery;

        const { data: items } = await supabase
          .from("menu_items")
          .select("id, name, price, image_url, restaurant_id")
          .eq("is_available", true)
          .ilike("name", searchTerm)
          .limit(5);

        setResults({
          restaurants: restaurants || [],
          menuItems: items || [],
        });
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, city]);

  if (!isOpen) return null;

  const hasResults = results.restaurants.length > 0 || results.menuItems.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-card animate-slide-down">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Pizza, sushi, burger..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-11 rounded-2xl bg-surface-3 border-none text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted">
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {query.trim() && !loading && !hasResults && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Aucun résultat pour "{query}"
          </p>
        )}

        {results.restaurants.length > 0 && (
          <section className="mb-4">
            <h3 className="text-xs font-display font-semibold text-muted-foreground mb-2 uppercase">Restaurants</h3>
            {results.restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => { onClose(); navigate(`/restaurant/${r.id}`); }}
                className="w-full flex items-center gap-3 py-2.5 hover:bg-muted/50 rounded-2xl px-2 transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  <LazyImage src={r.image_url || "/placeholder.svg"} alt={r.name} className="w-full h-full" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-display font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{r.cuisine_type} • {r.delivery_time || "20-30"} min</p>
                </div>
              </button>
            ))}
          </section>
        )}

        {results.menuItems.length > 0 && (
          <section>
            <h3 className="text-xs font-display font-semibold text-muted-foreground mb-2 uppercase">Plats</h3>
            {results.menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onClose(); navigate(`/restaurant/${item.restaurant_id}`); }}
                className="w-full flex items-center gap-3 py-2.5 hover:bg-muted/50 rounded-2xl px-2 transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                  <LazyImage src={item.image_url || "/placeholder.svg"} alt={item.name} className="w-full h-full" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-display font-semibold">{item.name}</p>
                  <p className="text-xs text-primary font-body font-bold">{item.price.toLocaleString()} FCFA</p>
                </div>
              </button>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};
