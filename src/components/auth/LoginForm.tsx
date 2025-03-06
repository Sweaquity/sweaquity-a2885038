
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface LoginFormProps {
  type: string;
}

export const LoginForm = ({ type }: LoginFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check for existing session on component mount
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        // Clear any invalid session data
        await supabase.auth.signOut();
        return;
      }

      if (session) {
        navigate(`/${type}/dashboard`);
      }
    };

    checkSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (session) {
        // Update the user's last active account type
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              account_type: [type],
              session_data: {
                last_login: new Date().toISOString(),
                last_account_type: type
              }
            })
            .eq('id', session.user.id);

          if (updateError) {
            console.error('Error updating profile:', updateError);
          }

          navigate(`/${type}/dashboard`);
        } catch (error) {
          console.error('Profile update error:', error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, type]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please confirm your email address before logging in.");
        } else {
          console.error('Login error:', error);
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("Login successful!");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setIsLinkedInLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/${type}`,
          queryParams: {
            userType: type
          }
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('LinkedIn login error:', error);
      toast.error("Failed to sign in with LinkedIn");
    } finally {
      setIsLinkedInLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/${type}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success("Password reset instructions sent to your email");
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error("Failed to send reset instructions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) throw error;
      
      toast.success("Confirmation email resent. Please check your inbox.");
    } catch (error) {
      console.error('Resend confirmation error:', error);
      toast.error("Failed to resend confirmation email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="loginEmail">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="loginEmail"
            type="email"
            className="pl-9"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="loginPassword">Password</Label>
          <div className="space-x-2">
            <Button
              variant="link"
              className="px-0"
              type="button"
              onClick={handleResetPassword}
              disabled={isLoading}
            >
              Forgot password?
            </Button>
            <Button
              variant="link"
              className="px-0"
              type="button"
              onClick={handleResendConfirmation}
              disabled={isLoading}
            >
              Resend confirmation
            </Button>
          </div>
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
      
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-sm text-gray-600">or</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      <Button 
        type="button" 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2"
        onClick={handleLinkedInLogin}
        disabled={isLinkedInLoading}
      >
        <Linkedin className="h-4 w-4" />
        {isLinkedInLoading ? "Connecting..." : "Sign in with LinkedIn"}
      </Button>
    </form>
  );
};
