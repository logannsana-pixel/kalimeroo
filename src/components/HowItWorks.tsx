import { Search, ShoppingBag, Truck, Utensils } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Search,
    title: "Trouvez votre restaurant",
    description: "Parcourez des centaines de restaurants près de chez vous",
    color: "text-primary",
  },
  {
    icon: ShoppingBag,
    title: "Commandez vos plats",
    description: "Choisissez vos plats préférés en quelques clics",
    color: "text-secondary",
  },
  {
    icon: Truck,
    title: "Livraison rapide",
    description: "Nos livreurs vous apportent votre commande en un temps record",
    color: "text-accent",
  },
  {
    icon: Utensils,
    title: "Savourez !",
    description: "Dégustez vos plats comme au restaurant",
    color: "text-primary",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">Comment ça marche ?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Commander sur DeliverEat est simple et rapide
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="border-none shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 bg-gradient-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-8 text-center">
                <div className={`inline-flex p-4 rounded-full bg-muted mb-4 ${step.color}`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
