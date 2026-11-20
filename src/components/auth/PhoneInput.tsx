import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, CheckCircle2, XCircle } from "lucide-react";

interface PhoneInputProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Validates if a phone number is a valid Congo number
 * Accepted formats: 04/05/06 followed by 7 digits
 */
export const isValidCongoPhone = (phone: string): boolean => {
  const raw = phone.trim();
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("00")) digits = digits.slice(2);
  const hasPlus = raw.startsWith("+") || raw.startsWith("00");
  if (digits.startsWith("242") && (hasPlus || digits.length > 9)) {
    const national = digits.slice(3);
    return /^0?[0-9]\d{7}$/.test(national);
  }
  if (hasPlus) return /^[1-9]\d{6,14}$/.test(digits); // international number
  return /^0[0-9]\d{7}$/.test(digits) || /^[1-9]\d{7}$/.test(digits);
};

/**
 * Normalizes a phone number to E.164 format (Congo by default, foreign numbers kept)
 */
export const normalizeCongoPhone = (phone: string): string => {
  const raw = phone.trim();
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("00")) digits = digits.slice(2);
  const hasPlus = raw.startsWith("+") || raw.startsWith("00");
  if (hasPlus && !digits.startsWith("242")) return "+" + digits;
  let national = digits.startsWith("242") ? digits.slice(3) : digits;
  if (/^[1-9]\d{7}$/.test(national)) national = "0" + national;
  return "+242" + national;
};

export const PhoneInput = ({ phone, onPhoneChange, disabled, error }: PhoneInputProps) => {
  const isValid = phone.length > 0 && isValidCongoPhone(phone);
  const showValidation = phone.replace(/\D/g, "").length >= 6;

  return (
    <div className="space-y-2">
      <Label htmlFor="phone" className="flex items-center gap-2">
        <Phone className="w-4 h-4" />
        Numéro de téléphone
      </Label>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🇨🇬</span>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="06 123 45 67 ou +33 6 12 34 56 78"
          className="h-12 rounded-xl pl-12 pr-12"
          disabled={disabled}
        />
        {showValidation && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      
      {showValidation && !isValid && (
        <p className="text-xs text-muted-foreground">
          Numéro congolais (ex. 06 123 45 67) ou étranger avec indicatif (ex. +33 6…)
        </p>
      )}
    </div>
  );
};
