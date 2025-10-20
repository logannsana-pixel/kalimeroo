import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import heroFood from "@/assets/hero-food.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroFood})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>
      
      <div className="container mx-auto px-4 z-10 animate-fade-in">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Manger comme au restaurant{" "}
            <span className="text-primary">sans sortir de chez soi</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Des centaines de restaurants à portée de main. Commandez vos plats préférés et savourez-les en toute tranquillité.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Entrez votre adresse de livraison..."
                className="w-full pl-12 pr-4 py-4 rounded-lg border border-border bg-background/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="hero" size="lg" className="px-8">
              Trouver des restaurants
            </Button>
          </div>
          
          <div className="flex gap-6 text-sm text-muted-foreground">
            <div>
              <span className="font-bold text-primary text-2xl">500+</span>
              <p>Restaurants</p>
            </div>
            <div>
              <span className="font-bold text-primary text-2xl">50k+</span>
              <p>Commandes livrées</p>
            </div>
            <div>
              <span className="font-bold text-primary text-2xl">4.8/5</span>
              <p>Note moyenne</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
