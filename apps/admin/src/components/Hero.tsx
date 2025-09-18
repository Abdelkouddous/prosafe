
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldCheck, ChevronRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="py-20 md:py-32 px-4">
      <div className="container max-w-6xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-prosafe-100 text-prosafe-800 text-sm font-medium">
            <span className="mr-1">✨</span> 
            <span>Introducing PROSAFE Guardian System</span>
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
          Advanced Security Management for Modern Enterprises
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Comprehensive protection for your business assets with real-time monitoring, 
          threat detection, and intelligent response capabilities.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button size="lg" className="bg-prosafe-600 hover:bg-prosafe-700 h-12 px-8" asChild>
            <Link to="/login">
              Get Started
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-8" asChild>
            <Link to="/demo">Request Demo</Link>
          </Button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 h-10 bottom-0 top-auto"></div>
          <div className="rounded-xl overflow-hidden border prosafe-shadow">
            <div className="bg-card p-1">
              <div className="rounded-lg overflow-hidden bg-slate-900 relative">
                <div className="absolute top-0 w-full h-12 bg-slate-800 flex items-center px-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 bg-slate-700 rounded-md px-4 py-1 text-xs text-slate-300">
                    PROSAFE Dashboard
                  </div>
                </div>
                <div className="pt-16 pb-4 px-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 md:col-span-2 bg-slate-800 rounded-lg p-4 animate-pulse-slow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-white">Security Overview</h3>
                        <ShieldCheck className="h-5 w-5 text-prosafe-400" />
                      </div>
                      <div className="h-40 rounded-md bg-slate-700"></div>
                    </div>
                    <div className="col-span-3 md:col-span-1 bg-slate-800 rounded-lg p-4 animate-pulse-slow">
                      <h3 className="text-sm font-medium text-white mb-4">Recent Alerts</h3>
                      <div className="space-y-2">
                        <div className="h-8 rounded-md bg-slate-700"></div>
                        <div className="h-8 rounded-md bg-slate-700"></div>
                        <div className="h-8 rounded-md bg-slate-700"></div>
                        <div className="h-8 rounded-md bg-slate-700"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
