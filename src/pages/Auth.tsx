
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [showPasswordCreation, setShowPasswordCreation] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            type
          }
        }
      });
      if (error) throw error;
      
      toast.success("Check your email for the verification code!");
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
        email,
        token: verificationCode,
        type: "signup"
      });
      if (error) throw error;
      
      setShowPasswordCreation(true);
      toast.success("Email verified! Please set your password.");
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
      toast.success("Registration complete!");
      navigate(`/${type}/profile`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to set password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      navigate(`/${type}/dashboard`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const renderRegistrationForm = () => {
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
            {isLoading ? "Creating account..." : "Complete Registration"}
          </Button>
        </form>
      );
    }

    if (showVerification) {
      return (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
            />
          </div>
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
          <Label htmlFor="registerEmail">Email address</Label>
          <Input
            id="registerEmail"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending code..." : "Send Verification Code"}
        </Button>
      </form>
    );
  };

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
            {type === 'seeker' ? 'Job Seeker' : 'Business'} Account
          </h1>
        </div>

        {!showVerification && !showPasswordCreation ? (
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="login">Log in</TabsTrigger>
            </TabsList>
            <TabsContent value="register">
              {renderRegistrationForm()}
            </TabsContent>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">Email address</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="loginPassword">Password</Label>
                    <Button
                      variant="link"
                      className="px-0"
                      type="button"
                      onClick={() => {
                        setShowVerification(false);
                        setShowPasswordCreation(false);
                        handleSendCode(new Event('click') as any);
                      }}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="loginPassword"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Log in"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        ) : (
          renderRegistrationForm()
        )}
      </Card>
    </div>
  );
};

export default Auth;
