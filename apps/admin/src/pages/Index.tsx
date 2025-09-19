import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/pages/footer/Features";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Shield, Target, Zap, Award } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <Hero />
        <Features />

        {/* Stats Section */}
        <section className="py-20">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-prosafe-600 mb-2">
                  99.9%
                </p>
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

        {/* Testimonial Section */}
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
                  "PROSAFE has transformed our security operations. We've
                  reduced incident response time by 60% and improved our overall
                  security posture."
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
                    <p className="text-gray-500">
                      Security Director, FinSecure
                    </p>
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
                  "In the healthcare industry, security is non-negotiable.
                  PROSAFE provides the protection and compliance features we
                  need with an intuitive interface."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="bg-gradient-to-r from-prosafe-800 to-prosafe-600 rounded-2xl prosafe-shadow overflow-hidden">
              <div className="px-6 py-16 md:p-16 md:flex md:items-center md:justify-between">
                <div className="mb-8 md:mb-0 md:max-w-lg">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Ready to secure your business?
                  </h2>
                  <p className="text-prosafe-100 text-lg">
                    Get started with PROSAFE today and experience
                    enterprise-grade security that scales with your business.
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

        {/* Why Choose Us */}
        <section className="py-20 bg-slate-50">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
                Why Choose PROSAFE
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our platform stands out with a combination of advanced
                technology and user-centered design.
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
                    Built with the same security standards trusted by Fortune
                    500 companies and government organizations.
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
                    Advanced analytics and AI-powered threat detection to
                    identify and neutralize threats before they cause damage.
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
                    Get up and running in days, not months. Our platform
                    integrates seamlessly with your existing infrastructure.
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
      </main>

      <Footer />
    </div>
  );
};

export default Index;
