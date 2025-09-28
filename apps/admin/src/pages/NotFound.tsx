import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, Home, ArrowLeft, Clock, Wrench } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.log(
      "Feature not available: User attempted to access:",
      location.pathname
    );
  }, [location.pathname]);

  const getFeatureName = (pathname: string) => {
    const path = pathname.toLowerCase();
    if (path.includes('profile')) return 'User Profile';
    if (path.includes('settings')) return 'Settings';
    if (path.includes('reports')) return 'Reports';
    if (path.includes('analytics')) return 'Analytics';
    if (path.includes('users')) return 'User Management';
    if (path.includes('notifications')) return 'Notifications';
    return 'This Feature';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
            <Construction className="h-12 w-12 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Feature Coming Soon!
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            {getFeatureName(location.pathname)} is currently under development
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <Wrench className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">We're Working On It!</span>
            </div>
            <p className="text-blue-700 text-sm">
              Our development team is actively building this feature. 
              It will be available in an upcoming release.
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Expected completion: Soon™</span>
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                asChild 
                className="bg-prosafe-600 hover:bg-prosafe-700"
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Need this feature urgently? Contact our support team for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
