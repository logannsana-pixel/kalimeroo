import { LegalPage } from "./LegalPage";
export default function Terms() {
  return <LegalPage title="Conditions générales d'utilisation" updated="17 novembre 2026" sections={[
    { title: "1. Objet", body: ["Kalimero est une plateforme de commande et de livraison de repas opérant en République du Congo (Brazzaville et Pointe-Noire). Les présentes conditions régissent l'utilisation du service par les clients."] },
    { title: "2. Commandes", body: ["Les prix affichés sont en francs CFA (XAF) et fixés par les restaurants partenaires. Une commande est confirmée lorsqu'elle est acceptée par le restaurant.", "Le client s'engage à fournir une adresse et un numéro de téléphone exacts et à être joignable lors de la livraison."] },
    { title: "3. Paiement", body: ["Selon le restaurant, le paiement s'effectue à la livraison (espèces), par Mobile Money (MTN, Airtel) via notre prestataire Nyole, ou par un acompte payé à l'avance avec le solde à la livraison.", "Un paiement Mobile Money n'est considéré comme effectué qu'après confirmation par notre prestataire."] },
    { title: "4. Livraison", body: ["Les délais sont indicatifs et peuvent varier selon le trafic, la météo et l'activité du restaurant. Les frais de livraison sont indiqués avant validation."] },
    { title: "5. Annulation et remboursement", body: ["Une commande peut être annulée tant que le restaurant ne l'a pas mise en préparation. En cas de commande non livrée, incomplète ou non conforme, contactez-nous dans les 24 heures : les sommes payées en ligne sont remboursées sur le même compte Mobile Money après vérification."] },
    { title: "6. Responsabilité", body: ["Les restaurants sont responsables de la qualité et de la conformité des plats. Kalimero assure l'intermédiation et la livraison."] },
    { title: "7. Contact", body: ["Pour toute question : via la page Aide ou notre chaîne WhatsApp officielle."] },
  ]} />;
}
