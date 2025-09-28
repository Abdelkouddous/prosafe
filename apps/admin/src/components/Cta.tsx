import React from "react";
import { Button } from "./ui/button";

const Cta = () => {
  return (
    <section className="py-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-prosafe-800 to-prosafe-600 rounded-2xl prosafe-shadow overflow-hidden">
          <div className="px-6 py-16 md:p-16 md:flex md:items-center md:justify-between">
            <div className="mb-8 md:mb-0 md:max-w-lg">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to secure your business?
              </h2>
              <p className="text-prosafe-100 text-lg">
                Get started with PROSAFE today and experience enterprise-grade
                security that scales with your business.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-white text-prosafe-800 hover:bg-prosafe-50 h-12 px-8"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white text-white hover:bg-prosafe-700 h-12 px-8"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;
