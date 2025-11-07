import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tag } from "lucide-react";

interface PromoCodeInputProps {
  subtotal: number;
  onPromoApplied: (discount: number, promoCodeId: string) => void;
}

export function PromoCodeInput({ subtotal, onPromoApplied }: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const applyPromoCode = async () => {
    if (!code.trim()) return;

    setIsLoading(true);

    const { data: promoCode, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .gt("valid_until", new Date().toISOString())
      .maybeSingle();

    if (error || !promoCode) {
      toast({
        title: "Code invalide",
        description: "Ce code promo n'existe pas ou a expiré",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (promoCode.max_uses && promoCode.uses_count >= promoCode.max_uses) {
      toast({
        title: "Code expiré",
        description: "Ce code promo a atteint son nombre maximum d'utilisations",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (subtotal < promoCode.min_order_amount) {
      toast({
        title: "Montant minimum requis",
        description: `Commande minimum de ${promoCode.min_order_amount}€ requise`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    let discount = 0;
    if (promoCode.discount_type === "percentage") {
      discount = subtotal * (promoCode.discount_value / 100);
    } else {
      discount = promoCode.discount_value;
    }

    onPromoApplied(discount, promoCode.id);
    toast({
      title: "Code promo appliqué !",
      description: `Vous économisez ${discount.toFixed(2)}€`,
    });

    setIsLoading(false);
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Code promo"
          className="pl-10"
          onKeyDown={(e) => e.key === "Enter" && applyPromoCode()}
        />
      </div>
      <Button onClick={applyPromoCode} disabled={isLoading || !code.trim()}>
        Appliquer
      </Button>
    </div>
  );
}
