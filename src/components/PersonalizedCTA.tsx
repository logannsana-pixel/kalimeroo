import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PersonalizedCTA = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/auth/customer")}
      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl text-xs text-foreground hover:from-primary/20 hover:to-primary/10 transition-all"
    >
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      <span>Connectez-vous pour des recommandations personnalisées</span>
    </button>
  );
};
