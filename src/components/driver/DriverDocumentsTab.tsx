import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, Upload, Check, Clock, X, Loader2, Camera, File } from "lucide-react";

interface Document {
  name: string;
  url: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
}

const requiredDocs = [
  { type: 'id_card', label: "Carte d'identité", icon: FileText },
  { type: 'license', label: "Permis de conduire", icon: File },
  { type: 'vehicle', label: "Carte grise véhicule", icon: File },
  { type: 'photo', label: "Photo de profil", icon: Camera },
];

export function DriverDocumentsTab() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('validation_documents')
        .eq('id', user.id)
        .single();

      if (data?.validation_documents && Array.isArray(data.validation_documents)) {
        setDocuments(data.validation_documents as unknown as Document[]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(type);
    try {
      const fileName = `drivers/${user.id}/${type}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('restaurant-images') // Using existing bucket
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);

      const newDoc: Document = {
        name: file.name,
        url: publicUrl,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
        type
      };

      // Update or add document
      const existingIndex = documents.findIndex(d => d.type === type);
      const updatedDocs = existingIndex >= 0
        ? documents.map((d, i) => i === existingIndex ? newDoc : d)
        : [...documents, newDoc];

      await supabase
        .from('profiles')
        .update({ validation_documents: updatedDocs as unknown as any })
        .eq('id', user.id);

      setDocuments(updatedDocs);
      toast.success("Document téléchargé");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setUploading(null);
    }
  };

  const getDocStatus = (type: string) => {
    const doc = documents.find(d => d.type === type);
    if (!doc) return null;
    
    switch (doc.status) {
      case 'approved':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Validé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" /> Refusé</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
    }
  };

  const getDocUrl = (type: string) => {
    return documents.find(d => d.type === type)?.url;
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div>
        <h2 className="text-xl font-bold">Mes documents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Téléchargez vos documents pour validation
        </p>
      </div>

      {/* Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progression</span>
          <span className="text-sm text-muted-foreground">
            {documents.length}/{requiredDocs.length} documents
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${(documents.length / requiredDocs.length) * 100}%` }}
          />
        </div>
      </Card>

      {/* Documents list */}
      <div className="space-y-3">
        {requiredDocs.map((doc) => {
          const Icon = doc.icon;
          const docUrl = getDocUrl(doc.type);
          const status = getDocStatus(doc.type);
          const isUploading = uploading === doc.type;

          return (
            <Card key={doc.type} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    docUrl ? 'bg-green-500/10' : 'bg-muted'
                  }`}>
                    <Icon className={`h-6 w-6 ${docUrl ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{doc.label}</p>
                    {status || <span className="text-sm text-muted-foreground">Non téléchargé</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {docUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={docUrl} target="_blank" rel="noopener noreferrer">
                        Voir
                      </a>
                    </Button>
                  )}
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleUpload(doc.type, e)}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <Button 
                      variant={docUrl ? "outline" : "default"} 
                      size="sm"
                      disabled={isUploading}
                      asChild
                    >
                      <span>
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><Upload className="h-4 w-4 mr-1" /> {docUrl ? 'Modifier' : 'Ajouter'}</>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💡 Vos documents seront vérifiés par notre équipe sous 24-48h.
        </p>
      </Card>
    </div>
  );
}
