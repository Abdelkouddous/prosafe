import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import Cta from "@/components/Cta";
import ChooseUs from "@/components/ChooseUs";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <Hero />
        <Stats />
        <Testimonials />
        <Cta />
        <ChooseUs />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
