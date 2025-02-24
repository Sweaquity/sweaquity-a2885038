
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, User, Mail, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Link, useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState<"seeker" | "business" | null>(null);
  const [contact, setContact] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [showPasswordCreation, setShowPasswordCreation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const userTypes = [
    {
      title: "Job Seeker",
      description: "Find your next opportunity and showcase your skills",
      icon: User,
      type: "seeker" as const
    },
    {
      title: "Business",
      description: "Post jobs and find the perfect candidates",
      icon: Building2,
      type: "business" as const
    }
  ];

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: contact,
        options: {
          shouldCreateUser: true,
          data: {
            type: activeCard
          }
        }
      });
      if (error) throw error;
      
      toast.success(`Check your email for the verification code!`);
      setShowVerification(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: contact,
        token: verificationCode,
        type: "signup"
      });
      if (error) throw error;
      
      setShowPasswordCreation(true);
      setShowVerification(false);
      toast.success("Verification successful! Please set your password.");
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      if (error) throw error;
      toast.success("Registration complete! Redirecting to dashboard...");
      window.location.href = `/${activeCard}/dashboard`;
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to set password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (type: "seeker" | "business", isLogin: boolean) => {
    if (isLogin) {
      navigate(`/login/${type}`);
    } else {
      setActiveCard(type);
    }
  };

  const renderAuthForm = () => {
    if (showPasswordCreation) {
      return (
        <form onSubmit={handleSetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Setting password..." : "Complete Registration"}
          </Button>
        </form>
      );
    }

    if (showVerification) {
      return (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Enter 6-Character Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="ABCD12"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().slice(0, 6);
                setVerificationCode(value);
              }}
              required
              maxLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleSendCode}
            disabled={isLoading}
          >
            Resend Code
          </Button>
        </form>
      );
    }

    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              className="pl-9"
              placeholder="Enter your email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending code..." : "Send Verification Code"}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 page-transition">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-4xl font-semibold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome to Sweaquity
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Choose your role to get started on your professional journey
        </p>
      </div>

      {!activeCard ? (
        <>
          <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
            {userTypes.map((type) => (
              <div key={type.type} className="grid grid-rows-[1fr_auto] gap-3">
                <Card
                  className="p-6 landing-card hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCardClick(type.type, false)}
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="mb-4 p-3 rounded-full bg-accent/10 text-accent">
                      <type.icon size={24} />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">{type.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </Card>
                <Card
                  className="p-3 landing-card hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCardClick(type.type, true)}
                >
                  <p className="text-center text-sm">Already have an account? <span className="text-primary">Log In</span></p>
                </Card>
              </div>
            ))}
          </div>
          
          <Button asChild variant="link" className="text-muted-foreground mt-8">
            <Link to="/login/recruiter">Recruitment login here</Link>
          </Button>
        </>
      ) : (
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setActiveCard(null);
                setShowVerification(false);
                setShowPasswordCreation(false);
                setContact("");
                setVerificationCode("");
                setPassword("");
              }}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-semibold">
              Sign Up as {activeCard === "seeker" ? "Job Seeker" : "Business"}
            </h2>
          </div>
          {renderAuthForm()}
        </Card>
      )}
    </div>
  );
};

export default Index;
