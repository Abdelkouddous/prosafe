import { Award, Shield, Target, Zap } from "lucide-react";
import React from "react";

const ChooseUs = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            Why Choose PROSAFE
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform stands out with a combination of advanced technology
            and user-centered design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-prosafe-100 text-prosafe-600">
                <Shield className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">
                Enterprise-Grade Security
              </h3>
              <p className="mt-2 text-gray-600">
                Built with the same security standards trusted by Fortune 500
                companies and government organizations.
              </p>
            </div>
          </div>

          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-prosafe-100 text-prosafe-600">
                <Target className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">
                Precision Monitoring
              </h3>
              <p className="mt-2 text-gray-600">
                Advanced analytics and AI-powered threat detection to identify
                and neutralize threats before they cause damage.
              </p>
            </div>
          </div>

          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-prosafe-100 text-prosafe-600">
                <Zap className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">
                Quick Implementation
              </h3>
              <p className="mt-2 text-gray-600">
                Get up and running in days, not months. Our platform integrates
                seamlessly with your existing infrastructure.
              </p>
            </div>
          </div>

          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-prosafe-100 text-prosafe-600">
                <Award className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">
                Compliance Ready
              </h3>
              <p className="mt-2 text-gray-600">
                Built-in compliance tools for GDPR, HIPAA, SOC 2, and other
                standards to simplify your regulatory requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChooseUs;
