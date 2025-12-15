import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Lock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminAuth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
        if (roleData?.role === "admin") navigate("/admin-dashboard");
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { error: authError, data } = await supabase.auth.signInWithPassword({ email: loginData.email, password: loginData.password });
      if (authError) { setError("Identifiants invalides"); return; }
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", data.user?.id).single();
      if (roleData?.role !== "admin") { setError("Accès refusé"); await supabase.auth.signOut(); return; }
      toast.success("Accès accordé"); navigate("/admin-dashboard");
    } catch { setError("Erreur"); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Warning */}
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs text-yellow-200">
          <strong>Zone sécurisée</strong> - Accès restreint aux administrateurs.
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-700 flex items-center justify-center mb-3 ring-2 ring-slate-600">
              <Shield className="w-7 h-7 text-slate-300" />
            </div>
            <h1 className="text-lg font-semibold text-white">Administration</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-slate-300">Identifiant</Label>
              <Input id="email" type="email" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} placeholder="admin@kalimero.cg" className="h-11 rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-sm" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-slate-300">Mot de passe</Label>
              <div className="relative">
                <Input id="password" type="password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} placeholder="••••••••" className="h-11 rounded-xl bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-sm pr-10" required />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
            </div>
            {error && <p className="text-xs text-red-400 text-center bg-red-500/10 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm flex items-center justify-center gap-2 border border-slate-600 disabled:opacity-50">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Shield className="w-4 h-4" />Accéder</>}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">© 2025 KALIMERO Admin</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
