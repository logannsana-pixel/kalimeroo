import { LegalPage } from "./LegalPage";
export default function Privacy() {
  return <LegalPage title="Politique de confidentialité" updated="17 novembre 2026" sections={[
    { title: "Données collectées", body: ["Nom, numéro de téléphone, adresse e-mail, adresses de livraison (quartier, repères), position GPS lorsque vous l'autorisez, historique de commandes et de paiements."] },
    { title: "Utilisation", body: ["Vos données servent à traiter et livrer vos commandes, vous contacter au sujet d'une commande, gérer votre programme de fidélité et améliorer le service. Nous ne vendons pas vos données."] },
    { title: "Partage", body: ["Le restaurant et le livreur reçoivent uniquement les informations nécessaires à votre commande (nom, téléphone, adresse). Les paiements Mobile Money sont traités par notre prestataire Nyole et les opérateurs concernés."] },
    { title: "Géolocalisation", body: ["La position GPS sert uniquement à détecter votre ville et faciliter la saisie de votre adresse. Vous pouvez refuser et saisir votre adresse manuellement."] },
    { title: "Stockage local et mesure d'audience", body: ["L'application enregistre sur votre appareil votre session de connexion, votre ville et vos préférences (thème). Une mesure d'audience sans cookies, ne conservant pas les adresses IP, recense les pages visitées. Lovable collecte ces données pour nous. Sa politique de confidentialité (lovable.dev/privacy) explique leur traitement."] },
    { title: "Vos droits", body: ["Vous pouvez demander l'accès, la rectification ou la suppression de vos données et de votre compte en nous contactant via la page Aide."] },
  ]} />;
}
