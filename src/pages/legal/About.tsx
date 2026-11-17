import { LegalPage } from "./LegalPage";
export default function About() {
  return <LegalPage title="À propos de Kalimero" updated="17 novembre 2026" sections={[
    { title: "Notre mission", body: ["Kalimero connecte les meilleurs restaurants de Brazzaville et Pointe-Noire à leurs clients, avec une livraison rapide et des paiements adaptés : espèces, Mobile Money ou acompte."] },
    { title: "Fait au Congo", body: ["Une équipe locale, des restaurants locaux et des livreurs locaux, pour faire vivre l'économie congolaise."] },
  ]} />;
}
