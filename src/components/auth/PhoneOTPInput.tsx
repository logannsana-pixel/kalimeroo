import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface PhoneOTPInputProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  onVerified: () => void;
  disabled?: boolean;
}

export const PhoneOTPInput = ({ 
  phone, 
  onPhoneChange, 
  onVerified, 
  disabled 
}: PhoneOTPInputProps) => {
  const [step, setStep] = useState<"phone" | "otp" | "verified">("phone");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 9) {
      toast.error("Veuillez entrer un numéro valide");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Code envoyé par SMS");
        setStep("otp");
        startCountdown();
      } else {
        throw new Error(data.error || "Erreur d'envoi");
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast.error(error.message || "Impossible d'envoyer le code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Entrez le code à 6 chiffres");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone, code: otp },
      });

      if (error) throw error;

      if (data.verified) {
        toast.success("Numéro vérifié !");
        setStep("verified");
        onVerified();
      } else {
        toast.error(data.message || "Code incorrect");
        setOtp("");
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast.error(error.message || "Erreur de vérification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown === 0) {
      handleSendOTP();
    }
  };

  if (step === "verified") {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Numéro de téléphone
        </Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
            🇨🇬
          </span>
          <Input
            type="tel"
            value={phone}
            disabled
            className="h-12 rounded-xl pl-12 pr-12 bg-muted"
          />
          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
        </div>
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Numéro vérifié
        </p>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Code envoyé au <strong>{phone}</strong>
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setStep("phone")}
            className="text-xs"
          >
            Modifier le numéro
          </Button>
        </div>

        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="button"
          onClick={handleVerifyOTP}
          disabled={isLoading || otp.length !== 6}
          className="w-full h-12 rounded-xl"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Vérification...
            </>
          ) : (
            "Vérifier le code"
          )}
        </Button>

        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-xs text-muted-foreground">
              Renvoyer le code dans {countdown}s
            </p>
          ) : (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleResend}
              disabled={isLoading}
            >
              Renvoyer le code
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="phone" className="flex items-center gap-2">
        <Phone className="w-4 h-4" />
        Numéro de téléphone
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
            🇨🇬
          </span>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="06 123 45 67"
            className="h-12 rounded-xl pl-12"
            disabled={disabled || isLoading}
          />
        </div>
        <Button
          type="button"
          onClick={handleSendOTP}
          disabled={isLoading || !phone || phone.length < 9}
          className="h-12 px-4 rounded-xl whitespace-nowrap"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Vérifier"
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Un code de vérification sera envoyé par SMS
      </p>
    </div>
  );
};
