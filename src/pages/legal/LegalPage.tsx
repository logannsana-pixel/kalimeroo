import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

export interface LegalSection { title: string; body: string[] }

export const LegalPage = ({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) => (
  <div className="min-h-screen bg-background">
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>
      <h1 className="text-3xl font-bold mb-2 text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {updated}</p>
      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold mb-3 text-foreground">{s.title}</h2>
            {s.body.map((p, i) => <p key={i} className="text-muted-foreground leading-relaxed mb-2">{p}</p>)}
          </section>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);
