import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const slides = [
  {
    emoji: "🍽️",
    title: "Vos plats préférés livrés",
    subtitle: "Commandez auprès des meilleurs restaurants de votre ville en quelques taps",
    bg: "from-primary via-primary-dark to-secondary",
  },
  {
    emoji: "🛵",
    title: "Suivez votre livraison en direct",
    subtitle: "Suivez votre livreur en temps réel jusqu'à votre porte",
    bg: "from-primary-dark via-primary to-accent",
  },
  {
    emoji: "⭐",
    title: "Gagnez des récompenses",
    subtitle: "Commandez, gagnez des Kalimero Stars et profitez d'avantages exclusifs",
    bg: "from-accent via-primary to-primary-dark",
  },
];

export default function Onboarding() {
  useDocumentTitle("Bienvenue sur Kalimero");
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const finish = useCallback(() => {
    localStorage.setItem("kalimero_onboarded", "true");
    navigate("/", { replace: true });
  }, [navigate]);

  const next = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else finish();
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50 && current < slides.length - 1) setCurrent(current + 1);
    if (diff < -50 && current > 0) setCurrent(current - 1);
    setTouchStart(null);
  };

  const slide = slides[current];

  return (
    <div
      className={cn("min-h-screen flex flex-col items-center justify-center px-6 text-white transition-all duration-500 bg-gradient-to-br", slide.bg)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip */}
      {current < slides.length - 1 && (
        <button onClick={finish} className="absolute top-6 right-6 text-xs text-white/60 font-medium z-10">
          Passer
        </button>
      )}

      {/* Content */}
      <div key={current} className="text-center animate-fade-in">
        <div className="text-7xl mb-8 animate-bounce-soft">{slide.emoji}</div>
        <h1 className="text-2xl font-bold mb-3 font-display">{slide.title}</h1>
        <p className="text-sm text-white/70 max-w-xs mx-auto font-body leading-relaxed">{slide.subtitle}</p>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mt-12">
        {slides.map((_, i) => (
          <div key={i} className={cn("h-2 rounded-full transition-all duration-300",
            i === current ? "w-6 bg-white" : "w-2 bg-white/30"
          )} />
        ))}
      </div>

      {/* Button */}
      <button onClick={next}
        className="mt-8 bg-white text-primary font-semibold px-8 py-3 rounded-full text-sm transition-all active:scale-95 shadow-lg">
        {current === slides.length - 1 ? "Commencer" : "Suivant"}
      </button>
    </div>
  );
}
