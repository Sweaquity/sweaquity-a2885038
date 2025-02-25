
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface RegisterFormProps {
  type: string;
}

export const RegisterForm = ({ type }: RegisterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
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
      
      if (error) throw error;

      toast.success("Registration successful! Please check your email to confirm your account.");
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "An error occurred during registration");
    } finally {
      setIsLoading(false);
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
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
};
