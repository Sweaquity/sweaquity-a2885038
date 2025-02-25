
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface LoginFormProps {
  type: string;
}

export const LoginForm = ({ type }: LoginFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check for existing session on component mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(`/${type}/dashboard`);
      }
    };

    checkSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate(`/${type}/dashboard`);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error("Invalid email or password. Please try again or reset your password.");
        } else if (error.message === "Email not confirmed") {
          toast.error("Please confirm your email address before logging in.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Update the user's last active account type
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            account_type: [type],
            session_data: {
              last_login: new Date().toISOString(),
              last_account_type: type
            }
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }

        toast.success("Login successful!");
        navigate(`/${type}/dashboard`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "An error occurred during login");
    } finally {
      setIsLoading(false);
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
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to send reset instructions");
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
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to resend confirmation email");
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
            >
              Forgot password?
            </Button>
            <Button
              variant="link"
              className="px-0"
              type="button"
              onClick={handleResendConfirmation}
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
    </form>
  );
};
