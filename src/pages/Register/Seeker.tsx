
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

const SeekerRegistration = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("");
  const [consents, setConsents] = useState({
    terms: false,
    marketing: false,
    projectUpdates: false,
  });

  const handleConsent = (key: keyof typeof consents) => {
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consents.terms) {
      toast.error("You must accept the terms and conditions to continue");
      return;
    }

    setIsLoading(true);

    try {
      if (verificationMethod === "email") {
        const { error } = await supabase.auth.signInWithOtp({
          email: contact,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: {
              terms_accepted: consents.terms,
              marketing_consent: consents.marketing,
              project_updates_consent: consents.projectUpdates,
            }
          },
        });

        if (error) throw error;

        toast.success("Check your email for the verification link!");
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          phone: contact,
          options: {
            data: {
              terms_accepted: consents.terms,
              marketing_consent: consents.marketing,
              project_updates_consent: consents.projectUpdates,
            }
          }
        });

        if (error) throw error;

        toast.success("Check your phone for the verification code!");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-2xl font-semibold">Create your account</h1>
        </div>

        <Tabs value={verificationMethod} onValueChange={(v: "email" | "phone") => setVerificationMethod(v)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <TabsContent value="email">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-9"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="phone">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    className="pl-9"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your phone number in international format (e.g., +1234567890)
                </p>
              </div>
            </TabsContent>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={consents.terms}
                  onCheckedChange={() => handleConsent('terms')}
                  required
                />
                <Label htmlFor="terms" className="text-sm">
                  I accept Sweaquity terms and conditions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="marketing" 
                  checked={consents.marketing}
                  onCheckedChange={() => handleConsent('marketing')}
                />
                <Label htmlFor="marketing" className="text-sm">
                  Opt into marketing communications (can be changed later)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="projectUpdates" 
                  checked={consents.projectUpdates}
                  onCheckedChange={() => handleConsent('projectUpdates')}
                />
                <Label htmlFor="projectUpdates" className="text-sm">
                  Opt into updates about other Sweaquity projects
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending verification..." : "Continue"}
            </Button>
          </form>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            By continuing, you agree to our{" "}
            <Button variant="link" className="p-0 h-auto font-normal">
              Terms of Service
            </Button>{" "}
            and{" "}
            <Button variant="link" className="p-0 h-auto font-normal">
              Privacy Policy
            </Button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SeekerRegistration;
