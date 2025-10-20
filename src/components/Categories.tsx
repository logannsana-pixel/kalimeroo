import { Card, CardContent } from "@/components/ui/card";
import burgerImg from "@/assets/burger.jpg";
import sushiImg from "@/assets/sushi.jpg";
import pastaImg from "@/assets/pasta.jpg";
import pizzaImg from "@/assets/pizza.jpg";

const categories = [
  { name: "Burgers", image: burgerImg, count: "120+ restaurants" },
  { name: "Sushi", image: sushiImg, count: "85+ restaurants" },
  { name: "Italien", image: pastaImg, count: "150+ restaurants" },
  { name: "Pizza", image: pizzaImg, count: "95+ restaurants" },
];

export const Categories = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">Catégories populaires</h2>
          <p className="text-xl text-muted-foreground">
            Trouvez votre cuisine préférée
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Card 
              key={index}
              className="group cursor-pointer overflow-hidden border-none shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-foreground mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
