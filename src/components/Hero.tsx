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
    <section className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-hero">
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
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            Manger comme au restaurant{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">sans sortir de chez soi</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8">
            Des centaines de restaurants à portée de main. Commandez vos plats préférés et savourez-les en toute tranquillité.
          </p>
          
          {district && (
            <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground">
                Livraison vers : <span className="font-semibold text-foreground">{district}, {city}</span>
              </p>
            </div>
          )}
          
          <Button 
            variant="default"
            size="lg" 
            className="w-full sm:w-auto px-8 mb-8 shadow-glow hover:shadow-hover transition-all"
            onClick={handleSearch}
          >
            Découvrir les restaurants
          </Button>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 shadow-soft">
              <span className="font-bold text-primary text-xl md:text-2xl block">500+</span>
              <p className="text-xs md:text-sm text-muted-foreground">Restaurants</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 shadow-soft">
              <span className="font-bold text-primary text-xl md:text-2xl block">50k+</span>
              <p className="text-xs md:text-sm text-muted-foreground">Commandes</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 shadow-soft">
              <span className="font-bold text-primary text-xl md:text-2xl block">4.8/5</span>
              <p className="text-xs md:text-sm text-muted-foreground">Note</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
