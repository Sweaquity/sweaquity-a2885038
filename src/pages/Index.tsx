
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, User, Mail, Phone, ChevronRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

const Index = () => {
  const [activeCard, setActiveCard] = useState<"seeker" | "business" | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
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
      if (verificationMethod === "email") {
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
      } else {
        // For phone verification, we'll use signInWithOtp but with phone option
        const { error } = await supabase.auth.signInWithOtp({
          phone: contact,
          options: {
            shouldCreateUser: true,
            data: {
              type: activeCard
            }
          }
        });
        if (error) throw error;
      }
      
      toast.success(`Check your ${verificationMethod} for the verification code!`);
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
      if (verificationMethod === "email") {
        const { error } = await supabase.auth.verifyOtp({
          email: contact,
          token: verificationCode,
          type: "signup"
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone: contact,
          token: verificationCode,
          type: "signup"
        });
        if (error) throw error;
      }
      
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
            <Label htmlFor="code">Enter 6-Digit Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              pattern="[0-9]{6}"
              inputMode="numeric"
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
      <div className="space-y-4">
        <Tabs value={verificationMethod} onValueChange={(v: "email" | "phone") => setVerificationMethod(v)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSendCode} className="mt-4 space-y-4">
            <TabsContent value="email">
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
            </TabsContent>

            <TabsContent value="phone">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    className="pl-9"
                    placeholder="+1234567890"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending code..." : "Send Verification Code"}
            </Button>
          </form>
        </Tabs>
      </div>
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
              <Card
                key={type.type}
                className="p-6 landing-card"
              >
                <div className="flex flex-col items-center text-center h-full">
                  <div className="mb-4 p-3 rounded-full bg-accent/10 text-accent">
                    <type.icon size={24} />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{type.title}</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {type.description}
                  </p>
                  <div className="mt-auto space-y-3 w-full">
                    <Button
                      className="w-full"
                      onClick={() => setActiveCard(type.type)}
                    >
                      Sign Up
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <Link to={`/login/${type.type}`}>Log In</Link>
                    </Button>
                  </div>
                </div>
              </Card>
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
