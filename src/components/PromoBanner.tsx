import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export const PromoBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary to-secondary p-6 md:p-8 shadow-glow">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
      
      {/* Floating food emoji decorations */}
      <div className="absolute top-4 right-4 text-4xl animate-bounce" style={{ animationDuration: '3s' }}>🍔</div>
      <div className="absolute bottom-4 right-20 text-3xl animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>🍟</div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-white flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Promo
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
            15% <span className="text-white/90">de réduction</span>
          </h3>
          <p className="text-white/80 text-sm md:text-base">
            Sur votre première commande avec le code <span className="font-bold text-white">BIENVENUE15</span>
          </p>
        </div>
        <Button 
          onClick={() => navigate("/restaurants")}
          className="bg-white text-primary hover:bg-white/90 rounded-full px-6 shadow-lg whitespace-nowrap"
        >
          Commander maintenant
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
