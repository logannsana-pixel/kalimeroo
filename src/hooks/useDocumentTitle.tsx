import { useEffect } from "react";

export const useDocumentTitle = (title: string, description?: string, suffix = "Kalimero") => {
  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.getAttribute("content");
    document.title = title ? `${title} | ${suffix}` : "Kalimero — Livraison de repas au Congo";
    
    // Update meta description if provided
    if (description) {
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      }
    }
    
    return () => {
      document.title = previousTitle;
      if (description && metaDescription && previousDescription !== null && previousDescription !== undefined) {
        metaDescription.setAttribute("content", previousDescription);
      }
    };
  }, [title, description, suffix]);
};
