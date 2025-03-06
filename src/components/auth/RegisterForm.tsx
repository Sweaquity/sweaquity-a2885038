
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface RegisterFormProps {
  type: string;
}

export const RegisterForm = ({ type }: RegisterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isParentAccount, setIsParentAccount] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        toast.error("An account with this email already exists. Please try logging in or reset your password.");
        setIsLoading(false);
        return;
      }

      const metadata: any = {
        user_type: type,
        is_parent: isParentAccount.toString()
      };

      if (isParentAccount && (type === 'business' || type === 'recruiter')) {
        if (!companyName) {
          throw new Error("Company name is required for organization accounts");
        }
        metadata.company_name = companyName;
      } else if (!isParentAccount) {
        if (!organizationId) {
          throw new Error("Organization ID is required for member accounts");
        }
        if (!firstName || !lastName) {
          throw new Error("First and last name are required for member accounts");
        }
        metadata.organization_id = organizationId;
        metadata.first_name = firstName;
        metadata.last_name = lastName;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/${type}`
        }
      });
      
      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("An account with this email already exists. Please try logging in or reset your password.");
        } else {
          throw error;
        }
        setIsLoading(false);
        return;
      }

      toast.success("Registration successful! Please check your email to confirm your account.");
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInSignUp = async () => {
    setIsLinkedInLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/${type}`,
          queryParams: {
            userType: type,
            isParent: isParentAccount.toString(),
            ...(isParentAccount && (type === 'business' || type === 'recruiter') ? { companyName } : {}),
            ...(!isParentAccount ? { 
              organizationId,
              firstName, 
              lastName 
            } : {})
          }
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('LinkedIn signup error:', error);
      toast.error("Failed to sign up with LinkedIn");
    } finally {
      setIsLinkedInLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      {(type === 'business' || type === 'recruiter') && (
        <div className="space-y-2">
          <Label>Account Type</Label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={isParentAccount ? "default" : "outline"}
              onClick={() => setIsParentAccount(true)}
              className="flex-1"
            >
              Organization
            </Button>
            <Button
              type="button"
              variant={!isParentAccount ? "default" : "outline"}
              onClick={() => setIsParentAccount(false)}
              className="flex-1"
            >
              Member
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="registerEmail">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="registerEmail"
            type="email"
            className="pl-9"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      {(type === 'business' || type === 'recruiter') && isParentAccount && (
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            type="text"
            placeholder="Enter company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
      )}

      {!isParentAccount && (
        <>
          <div className="space-y-2">
            <Label htmlFor="organizationId">Organization ID</Label>
            <Input
              id="organizationId"
              type="text"
              placeholder="Enter organization ID"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="registerPassword">Password</Label>
        <Input
          id="registerPassword"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <p className="text-sm text-muted-foreground">Password must be at least 6 characters long</p>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
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
        onClick={handleLinkedInSignUp}
        disabled={isLinkedInLoading}
      >
        <Linkedin className="h-4 w-4" />
        {isLinkedInLoading ? "Connecting..." : "Sign up with LinkedIn"}
      </Button>
    </form>
  );
};
