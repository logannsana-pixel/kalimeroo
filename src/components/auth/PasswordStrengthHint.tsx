import { passwordStrength } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";

export const PasswordStrengthHint = ({ password }: { password: string }) => {
  const s = passwordStrength(password);
  if (!password) return null;
  return (
    <div className="space-y-1" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full bg-muted", s.score >= i && (s.ok ? "bg-primary" : "bg-destructive"))} />
        ))}
      </div>
      <p className={cn("text-xs", s.ok ? "text-primary" : "text-destructive")}>{s.label}</p>
    </div>
  );
};
