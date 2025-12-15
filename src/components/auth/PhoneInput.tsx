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
  const digits = phone.replace(/\D/g, "");
  // Accept: 04xxxxxxx, 05xxxxxxx, 06xxxxxxx (9 digits total)
  // Or without leading 0: 4xxxxxxx, 5xxxxxxx, 6xxxxxxx (8 digits)
  return /^0[456]\d{7}$/.test(digits) || /^[456]\d{7}$/.test(digits);
};

/**
 * Normalizes a Congo phone number to E.164 format
 */
export const normalizeCongoPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  let national = digits.startsWith("242") ? digits.slice(3) : digits;
  
  // Add leading 0 if missing
  if (/^[456]\d{7}$/.test(national)) {
    national = "0" + national;
  }
  
  return "+242" + national;
};

export const PhoneInput = ({ phone, onPhoneChange, disabled, error }: PhoneInputProps) => {
  const isValid = phone.length > 0 && isValidCongoPhone(phone);
  const showValidation = phone.length >= 8;

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
          placeholder="06 123 45 67"
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
          Format attendu : 04, 05 ou 06 suivi de 7 chiffres
        </p>
      )}
    </div>
  );
};
