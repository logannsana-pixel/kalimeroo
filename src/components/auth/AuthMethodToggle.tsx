import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";

interface AuthMethodToggleProps {
  method: "email" | "phone";
  onMethodChange: (method: "email" | "phone") => void;
}

export const AuthMethodToggle = ({ method, onMethodChange }: AuthMethodToggleProps) => {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-xl">
      <Button
        type="button"
        variant={method === "email" ? "default" : "ghost"}
        size="sm"
        className="flex-1 h-9 rounded-lg gap-2"
        onClick={() => onMethodChange("email")}
      >
        <Mail className="w-4 h-4" />
        Email
      </Button>
      <Button
        type="button"
        variant={method === "phone" ? "default" : "ghost"}
        size="sm"
        className="flex-1 h-9 rounded-lg gap-2"
        onClick={() => onMethodChange("phone")}
      >
        <Phone className="w-4 h-4" />
        Téléphone
      </Button>
    </div>
  );
};
