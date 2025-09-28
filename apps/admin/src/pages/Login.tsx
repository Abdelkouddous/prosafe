import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
const API_BASE_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // const { register } = useAuth(); // Uncomment if using AuthContext for registration

  const navigate = useNavigate();
  // const t = useTranslation(); const { t, i18n } = useTranslation();
  const { t, i18n } = useTranslation();
  // Handle navigation after successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/dashboard");
      } else {
        navigate("/profile");
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Navigation is now handled by useEffect hook
    } catch (error) {
      console.error("Login failed:", error);
      // Display specific error message if available
      if (error.response && error.response.data && error.response.data.msg) {
        toast({
          title: "Login Failed",
          description: error.response.data.msg,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: "An error occurred during login. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    // Made function async
    e.preventDefault();

    if (!API_BASE_URL) {
      console.error("Admin: VITE_API_URL is not defined!");
      toast({
        title: "Error",
        description: "API URL is not configured.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Registration attempt:", {
        firstName,
        lastName,
        email,
        password,
      }); // Placeholder log

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        // Assuming /auth/register endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      const result = await response.json(); // Parse response body

      if (response.ok) {
        // Handle successful registration
        console.log("Registration successful:", result);
        toast({
          title: "Registration Successful",
          description: result.message || "Your account has been created.", // Use message from backend or default
        });
        // Optional: Navigate to login page after successful registration
        navigate("/login");
      } else {
        // Handle registration errors (e.g., email already exists, validation errors)
        console.error("Registration failed:", result);
        toast({
          title: "Registration Failed",
          description:
            result.message || "An error occurred during registration.", // Use message from backend or default
          variant: "destructive",
        });
      }
    } catch (error) {
      // Handle network errors or other exceptions
      console.error("Error during registration fetch:", error);
      toast({
        title: "Error",
        description: "Could not connect to the server. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container max-w-md mx-auto flex-grow flex flex-col justify-center px-4 py-12">
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{t("auth.backToHome")}</span>
            </Link>
          </Button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-prosafe-100 mb-4">
            <Shield className="h-6 w-6 text-prosafe-600" />
          </div>
          <h1 className="text-2xl font-bold text-center">
            {t("auth.welcomeTitle")}
          </h1>
          <p className="text-sm text-gray-500 mt-2">{t("auth.signIn")}</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">{t("auth.loginTab")}</TabsTrigger>
            <TabsTrigger value="signup">{t("auth.signupTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-prosafe-600 hover:text-prosafe-800"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-prosafe-600 hover:bg-prosafe-700"
              >
                {t("auth.signIn")}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-2 text-gray-500">
                    {t("auth.orContinueWith")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" type="button">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" type="button">
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                  Facebook
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">{t("auth.firstName")}</Label>
                  <Input
                    id="first-name"
                    placeholder="John"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">{t("auth.lastName")}</Label>
                  <Input
                    id="last-name"
                    placeholder="Doe"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-signup">{t("auth.email")}</Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">{t("auth.password")}</Label>
                <Input
                  id="password-signup"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  {t("auth.passwordMinLength")}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-prosafe-600 hover:bg-prosafe-700"
              >
                {t("auth.signUp")}
              </Button>

              <p className="text-xs text-center text-gray-500 pt-4">
                {t("auth.termsAgreement")}{" "}
                <Link
                  to="/terms"
                  className="text-prosafe-600 hover:text-prosafe-800"
                >
                  {t("auth.termsOfService")}
                </Link>{" "}
                {t("auth.and")}{" "}
                <Link
                  to="/privacy"
                  className="text-prosafe-600 hover:text-prosafe-800"
                >
                  {t("auth.privacyPolicy")}
                </Link>
                .
              </p>

              <p className="text-sm text-center text-gray-500 pt-2">
                {t("auth.alreadyHaveAccount")}{" "}
              </p>
              <TabsList className="flex w-full  mb-8">
                <TabsTrigger
                  value="login"
                  className="text-prosafe-600 hover:text-prosafe-800"
                >
                  {t("auth.loginTab")}
                </TabsTrigger>
              </TabsList>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
