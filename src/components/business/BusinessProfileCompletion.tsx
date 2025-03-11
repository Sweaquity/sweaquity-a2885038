import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TermsAndConditionsLink } from "@/components/shared/TermsAndConditionsLink";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const BusinessProfileCompletion = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    industry: "",
    contact_phone: "",
    website: "",
    location: "",
    project_stage: "",
    organization_type: "",
    terms_accepted: false
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const handleBackClick = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoadError("No active session found");
          return;
        }

        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('businesses_id', session.user.id)
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log("No business data found for new user");
          } else {
            console.error('Error loading business data:', error);
            setLoadError("Error loading your business data");
          }
          return;
        }

        if (data) {
          setFormData({
            company_name: data.company_name || "",
            industry: data.industry || "",
            contact_phone: data.contact_phone || "",
            website: data.website || "",
            location: data.location || "",
            project_stage: data.project_stage || "",
            organization_type: data.organization_type || "",
            terms_accepted: data.terms_accepted || false
          });
        }
      } catch (error) {
        console.error('Error in loadBusinessData:', error);
        setLoadError("Failed to load business data");
      } finally {
        setIsLoading(false);
      }
    };

    loadBusinessData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.industry || !formData.location || 
        !formData.project_stage || !formData.organization_type) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (!formData.terms_accepted) {
      toast.error("You must accept the terms and conditions");
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("No active session found");
        return;
      }

      console.log("Updating business profile for user:", session.user.id);
      console.log("Form data:", formData);

      const { data: existingProfile } = await supabase
        .from('businesses')
        .select('businesses_id')
        .eq('businesses_id', session.user.id)
        .maybeSingle();

      let error;
      
      if (existingProfile) {
        ({ error } = await supabase
          .from('businesses')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('businesses_id', session.user.id));
      } else {
        ({ error } = await supabase
          .from('businesses')
          .insert({
            businesses_id: session.user.id,
            ...formData,
            updated_at: new Date().toISOString()
          }));
      }

      if (error) {
        console.error('Error updating business profile:', error);
        throw error;
      }
      
      toast.success("Profile updated successfully");
      
      setTimeout(() => {
        navigate("/business/dashboard");
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p>Loading your profile data...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{loadError}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackClick}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Button>
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <h2 className="text-2xl font-bold">Complete Your Business Profile</h2>
            <p className="text-muted-foreground">Please provide your business details to continue</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Input
                    id="industry"
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project_stage">Project Stage *</Label>
                  <Select
                    value={formData.project_stage}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, project_stage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea Stage</SelectItem>
                      <SelectItem value="mvp">MVP</SelectItem>
                      <SelectItem value="early">Early Stage</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization_type">Organisation Type *</Label>
                  <Select
                    value={formData.organization_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, organization_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Start Up</SelectItem>
                      <SelectItem value="scaleup">Scale Up</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="non_profit">Non-Profit</SelectItem>
                      <SelectItem value="public_sector">Public Sector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox
                  id="terms"
                  checked={formData.terms_accepted}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, terms_accepted: checked as boolean }))
                  }
                  required
                />
                <Label htmlFor="terms" className="text-sm">
                  I accept the <TermsAndConditionsLink /> *
                </Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
