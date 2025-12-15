import { Clock, Zap, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface IntentionFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  filter: string;
  color: string;
}

const filters: IntentionFilter[] = [
  {
    id: "open",
    label: "Ouvert",
    icon: <Clock className="h-4 w-4" />,
    filter: "open=true",
    color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "fast",
    label: "Rapide",
    icon: <Zap className="h-4 w-4" />,
    filter: "fast=true",
    color: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  },
  {
    id: "cheap",
    label: "Pas cher",
    icon: <Coins className="h-4 w-4" />,
    filter: "cheap=true",
    color: "bg-primary/20 text-primary",
  },
];

export const IntentionFilters = () => {
  const navigate = useNavigate();

  const handleFilter = (filter: string) => {
    navigate(`/restaurants?${filter}`);
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => handleFilter(f.filter)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${f.color} hover:opacity-80`}
        >
          {f.icon}
          {f.label}
        </button>
      ))}
    </div>
  );
};
