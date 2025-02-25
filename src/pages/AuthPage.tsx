
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = useParams<{ type: string }>();

  useEffect(() => {
    // Check if we're handling a password reset
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");

    const handleAuth = async () => {
      if (accessToken) {
        if (type === "recovery") {
          // Handle password reset
          navigate(`/auth/${type}/reset-password`, {
            state: { access_token: accessToken }
          });
          return;
        }

        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken!
          });

          if (error) throw error;

          toast.success("Authentication successful!");
          navigate(`/${type}/dashboard`);
        } catch (error) {
          console.error('Error setting session:', error);
          toast.error("Authentication failed. Please try logging in.");
        }
      }
    };

    handleAuth();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 page-transition">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {type === 'seeker' ? 'Job Seeker' : type === 'business' ? 'Business' : 'Recruiter'} Account
          </h1>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm type={type || ''} />
          </TabsContent>
          
          <TabsContent value="register">
            <RegisterForm type={type || ''} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AuthPage;
