import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface NeighborhoodInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const NeighborhoodInput = ({
  value,
  onChange,
  error,
  label = "Quartier",
  required = true,
  placeholder = "Ex: Bacongo, Poto-Poto, Moungali...",
  className = ""
}: NeighborhoodInputProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          {label} {required && "*"}
        </Label>
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-xl"
        required={required}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Saisissez votre quartier pour la livraison
      </p>
    </div>
  );
};