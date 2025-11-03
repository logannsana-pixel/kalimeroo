import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Categories } from "@/components/Categories";
import { FeaturedRestaurants } from "@/components/FeaturedRestaurants";
import { Footer } from "@/components/Footer";
import { LocationModal } from "@/components/LocationModal";

const Index = () => {
  return (
    <>
      <LocationModal />
      <Navbar />
      <main className="min-h-screen pb-16 md:pb-0">
        <Hero />
        <HowItWorks />
        <Categories />
        <FeaturedRestaurants />
        <Footer />
      </main>
      <BottomNav />
    </>
  );
};

export default Index;
