import React from "react";

const Stats = () => {
  return (
    <section className="py-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-prosafe-600 mb-2">99.9%</p>
            <p className="text-gray-600">Uptime</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-prosafe-600 mb-2">24/7</p>
            <p className="text-gray-600">Support</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-prosafe-600 mb-2">500+</p>
            <p className="text-gray-600">Enterprises</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-prosafe-600 mb-2">10M+</p>
            <p className="text-gray-600">Threats Blocked</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
