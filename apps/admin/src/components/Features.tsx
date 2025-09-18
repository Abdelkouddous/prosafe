
import { Shield, Bell, Lock, Eye, ActivitySquare, Zap } from "lucide-react";

const features = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Comprehensive Protection",
    description: "Multi-layered security approach that provides complete protection for all your business assets and data."
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: "Real-time Alerts",
    description: "Instant notifications about security events with smart filtering to reduce alert fatigue."
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Access Management",
    description: "Granular control over who can access your systems with role-based permissions."
  },
  {
    icon: <Eye className="h-6 w-6" />,
    title: "24/7 Monitoring",
    description: "Continuous surveillance of your security perimeter with automated threat detection."
  },
  {
    icon: <ActivitySquare className="h-6 w-6" />,
    title: "Audit Logging",
    description: "Comprehensive activity tracking and tamper-proof logs for compliance and forensic analysis."
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Rapid Response",
    description: "Automated and manual intervention capabilities to quickly address security incidents."
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            Enterprise-Grade Security Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform offers comprehensive security solutions designed to protect your business at every layer.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-6 border border-gray-100 hover:border-prosafe-200 transition-all prosafe-shadow hover:translate-y-[-5px]"
            >
              <div className="w-12 h-12 bg-prosafe-100 rounded-lg flex items-center justify-center text-prosafe-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
