import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

export default function Profile() {
  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Mon profil</h1>
        
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8 md:py-12">
              <User className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm md:text-base text-muted-foreground">
                Gestion du profil à venir
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
