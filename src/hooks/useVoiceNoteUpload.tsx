import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useVoiceNoteUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadVoiceNote = async (audioBlob: Blob, orderId?: string): Promise<string | null> => {
    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté pour envoyer une note vocale");
        return null;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
      const fileName = `${user.id}/${orderId || "checkout"}-${timestamp}.${extension}`;

      console.log("Uploading voice note:", fileName, "Size:", audioBlob.size);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("voice-notes")
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        toast.error("Erreur lors de l'envoi de la note vocale");
        return null;
      }

      // Get signed URL (private bucket)
      const { data: signedUrl } = await supabase.storage
        .from("voice-notes")
        .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 days validity

      console.log("Voice note uploaded successfully:", data.path);
      toast.success("Note vocale enregistrée");
      
      return signedUrl?.signedUrl || null;
    } catch (error) {
      console.error("Error uploading voice note:", error);
      toast.error("Erreur lors de l'envoi");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadVoiceNote, uploading };
};