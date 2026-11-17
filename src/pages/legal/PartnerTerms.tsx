import { LegalPage } from "./LegalPage";
export default function PartnerTerms() {
  return <LegalPage title="Conditions partenaires" updated="17 novembre 2026" sections={[
    { title: "Restaurants partenaires", body: ["Le restaurant s'engage à tenir à jour son menu, ses prix, ses horaires et sa disponibilité, et à préparer les commandes acceptées dans les délais annoncés.", "Les paiements en ligne sont encaissés par Kalimero puis reversés au restaurant, déduction faite de la commission convenue."] },
    { title: "Livreurs partenaires", body: ["Le livreur s'engage à livrer avec soin, à respecter le code de la route et à remettre intégralement les sommes encaissées en espèces selon les modalités de clôture de caisse.", "Tout manquement grave peut entraîner la suspension du compte."] },
    { title: "Suspension", body: ["Kalimero peut suspendre un compte partenaire en cas de fraude, de plaintes répétées ou de non-respect des présentes conditions."] },
  ]} />;
}
