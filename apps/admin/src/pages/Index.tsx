import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Shield, Target, Zap, Award } from "lucide-react";
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

        {/* Stats Section */}
        <Stats />

        {/* Testimonial Section */}
        <Testimonials />

        {/* CTA Section */}
        <Cta />
        {/* Why choose us ÷ */}
        <ChooseUs />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
