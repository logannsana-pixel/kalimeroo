import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PersonalizedCTA = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/auth/customer")}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl text-sm text-foreground hover:from-primary/20 hover:to-primary/10 transition-all"
    >
      <Sparkles className="h-4 w-4 text-primary" />
      <span>Connectez-vous pour des recommandations personnalisées</span>
    </button>
  );
};
