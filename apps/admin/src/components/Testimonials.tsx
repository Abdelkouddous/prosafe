import React from "react";

const Testimonials = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            Trusted by Security Leaders
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See why top companies choose PROSAFE to protect their critical
            assets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border prosafe-shadow">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <img
                  className="h-12 w-12 rounded-full"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="User"
                />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold">Michael Roberts</h4>
                <p className="text-gray-500">CISO, TechCorp Inc.</p>
              </div>
            </div>
            <p className="text-gray-600">
              "PROSAFE has transformed our security operations. We've reduced
              incident response time by 60% and improved our overall security
              posture."
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border prosafe-shadow">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <img
                  className="h-12 w-12 rounded-full"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="User"
                />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold">Sarah Johnson</h4>
                <p className="text-gray-500">Security Director, FinSecure</p>
              </div>
            </div>
            <p className="text-gray-600">
              "The comprehensive dashboard and real-time alerts have made
              managing our security team much more efficient. PROSAFE is now
              central to our security strategy."
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border prosafe-shadow">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <img
                  className="h-12 w-12 rounded-full"
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="User"
                />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold">David Kumar</h4>
                <p className="text-gray-500">IT Director, GlobalHealth</p>
              </div>
            </div>
            <p className="text-gray-600">
              "In the healthcare industry, security is non-negotiable. PROSAFE
              provides the protection and compliance features we need with an
              intuitive interface."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
