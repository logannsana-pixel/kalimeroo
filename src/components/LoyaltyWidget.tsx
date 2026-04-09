import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star } from "lucide-react";

const LEVELS = [
  { name: "Bronze", min: 0, color: "from-amber-600 to-amber-800" },
  { name: "Silver", min: 500, color: "from-gray-400 to-gray-600" },
  { name: "Gold", min: 1500, color: "from-yellow-400 to-amber-500" },
  { name: "Platinum", min: 5000, color: "from-indigo-400 to-purple-600" },
];

export function LoyaltyWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [level, setLevel] = useState("bronze");

  useEffect(() => {
    if (!user) return;
    supabase.from("loyalty_points").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPoints(data.points);
          setTotalEarned(data.total_earned);
          setLevel(data.level);
        }
      });
  }, [user]);

  if (!user) return null;

  const currentLevel = LEVELS.find(l => l.name.toLowerCase() === level) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.min > totalEarned);
  const progress = nextLevel
    ? ((totalEarned - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  return (
    <button
      onClick={() => navigate("/profile")}
      className={`w-full bg-gradient-to-r ${currentLevel.color} rounded-2xl p-4 text-white text-left transition-all active:scale-[0.98]`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 fill-white" />
          <span className="text-lg font-bold">{points}</span>
          <span className="text-xs opacity-80">Kalimero Stars</span>
        </div>
        <span className="text-2xs px-2 py-0.5 rounded-full bg-white/20 font-medium">
          {currentLevel.name}
        </span>
      </div>
      {nextLevel && (
        <div>
          <div className="flex justify-between text-2xs opacity-70 mb-1">
            <span>{currentLevel.name}</span>
            <span>{nextLevel.name}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <p className="text-2xs opacity-60 mt-1">
            Encore {nextLevel.min - totalEarned} pts pour {nextLevel.name}
          </p>
        </div>
      )}
    </button>
  );
}
