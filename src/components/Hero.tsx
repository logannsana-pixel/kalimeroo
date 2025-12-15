import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/contexts/LocationContext";
import heroFood from "@/assets/hero-food.jpg";

export const Hero = () => {
  const navigate = useNavigate();
  const { district, city } = useLocation();

  const handleSearch = () => {
    navigate("/restaurants");
  };

  return (
    <section className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center overflow-hidden bg-gradient-hero">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroFood})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
      </div>
      
      <div className="container mx-auto px-4 z-10 animate-fade-in">
        <div className="max-w-xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight">
            Manger comme au restaurant{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">sans sortir de chez soi</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-5">
            Des centaines de restaurants à portée de main. Commandez vos plats préférés et savourez-les en toute tranquillité.
          </p>
          
          {district && (
            <div className="mb-4 p-3 bg-primary/10 rounded-xl border border-primary/20 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground">
                Livraison vers : <span className="font-medium text-foreground">{district}, {city}</span>
              </p>
            </div>
          )}
          
          <Button 
            variant="default"
            className="w-full sm:w-auto px-6 mb-6 shadow-glow hover:shadow-hover transition-all"
            onClick={handleSearch}
          >
            Découvrir les restaurants
          </Button>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 shadow-soft">
              <span className="font-bold text-primary text-lg block">500+</span>
              <p className="text-xs text-muted-foreground">Restaurants</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 shadow-soft">
              <span className="font-bold text-primary text-lg block">50k+</span>
              <p className="text-xs text-muted-foreground">Commandes</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 shadow-soft">
              <span className="font-bold text-primary text-lg block">4.8/5</span>
              <p className="text-xs text-muted-foreground">Note</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
