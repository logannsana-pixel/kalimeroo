import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Truck } from "lucide-react";
import burgerImg from "@/assets/burger.jpg";
import sushiImg from "@/assets/sushi.jpg";
import pastaImg from "@/assets/pasta.jpg";
import pizzaImg from "@/assets/pizza.jpg";

const restaurants = [
  {
    name: "Burger House",
    image: burgerImg,
    rating: 4.8,
    reviews: 1250,
    deliveryTime: "25-35 min",
    deliveryFee: "2.99€",
    categories: ["Burgers", "Américain"],
  },
  {
    name: "Sushi Master",
    image: sushiImg,
    rating: 4.9,
    reviews: 980,
    deliveryTime: "30-40 min",
    deliveryFee: "3.49€",
    categories: ["Japonais", "Sushi"],
  },
  {
    name: "La Trattoria",
    image: pastaImg,
    rating: 4.7,
    reviews: 1520,
    deliveryTime: "25-35 min",
    deliveryFee: "2.99€",
    categories: ["Italien", "Pâtes"],
  },
  {
    name: "Pizza Bella",
    image: pizzaImg,
    rating: 4.8,
    reviews: 2100,
    deliveryTime: "20-30 min",
    deliveryFee: "1.99€",
    categories: ["Italien", "Pizza"],
  },
];

export const FeaturedRestaurants = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">Restaurants populaires</h2>
          <p className="text-xl text-muted-foreground">
            Découvrez nos meilleurs partenaires
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {restaurants.map((restaurant, index) => (
            <Card 
              key={index}
              className="group cursor-pointer overflow-hidden border-none shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-2 bg-gradient-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <Badge className="absolute top-3 right-3 bg-background/90 text-foreground">
                  <Star className="w-3 h-3 fill-primary text-primary mr-1" />
                  {restaurant.rating}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">{restaurant.name}</h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  {restaurant.categories.map((cat, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{restaurant.deliveryTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    <span>{restaurant.deliveryFee}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {restaurant.reviews} avis
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
