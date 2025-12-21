import { useEffect } from "react";

export const useDocumentTitle = (title: string, description?: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | Kalimero` : "Kalimero - Livraison de repas au Congo";
    
    // Update meta description if provided
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      }
    }
    
    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);
};
