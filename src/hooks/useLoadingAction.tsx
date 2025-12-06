import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseLoadingActionOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useLoadingAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: UseLoadingActionOptions = {}
) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      setLoading(true);
      try {
        const result = await action(...args);
        if (options.successMessage) {
          toast({
            title: "Succès",
            description: options.successMessage,
          });
        }
        options.onSuccess?.();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : options.errorMessage || "Une erreur est survenue";
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        });
        options.onError?.(error as Error);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [action, options, toast]
  );

  return { execute, loading };
}
