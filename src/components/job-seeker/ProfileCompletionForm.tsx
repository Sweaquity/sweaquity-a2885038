
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PersonalInfoFields } from "./profile/PersonalInfoFields";
import { AvailabilitySelector } from "./profile/AvailabilitySelector";
import { ConsentCheckboxes } from "./profile/ConsentCheckboxes";

interface ProfileFormData {
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  location: string;
  availability: string[];
  employment_preference: 'full_time' | 'equity' | 'both';
  terms_accepted: boolean;
  marketing_consent: boolean;
  project_updates_consent: boolean;
  source?: string;
}

export const ProfileCompletionForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    title: '',
    email: '',
    location: '',
    availability: [],
    employment_preference: 'both',
    terms_accepted: false,
    marketing_consent: false,
    project_updates_consent: false,
  });

  useEffect(() => {
    const loadUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setFormData(prev => ({
          ...prev,
          email: session.user.email!
        }));
      }
    };

    loadUserEmail();
  }, []);

  useEffect(() => {
    const source = document.cookie
      .split('; ')
      .find(row => row.startsWith('referral_source='))
      ?.split('=')[1];
    
    if (source) {
      setFormData(prev => ({
        ...prev,
        source: decodeURIComponent(source)
      }));
    }
  }, []);

  const handleFieldChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTermsAcceptedChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      terms_accepted: checked
    }));
  };

  const handleMarketingConsentChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      marketing_consent: checked
    }));
  };

  const handleProjectUpdatesConsentChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      project_updates_consent: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terms_accepted) {
      toast.error("You must accept the terms and conditions");
      return;
    }

    if (formData.availability.length === 0) {
      toast.error("Please select at least one availability option");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No authenticated session");
      }

      // Convert availability array to string format if needed
      const availabilityData = 
        Array.isArray(formData.availability) 
          ? JSON.stringify(formData.availability) 
          : formData.availability;

      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          availability: availabilityData,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }

      toast.success("Profile updated successfully");
      navigate("/seeker/dashboard", { state: { activeTab: "profile" } });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Please complete your profile to continue using the platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PersonalInfoFields
            firstName={formData.first_name}
            lastName={formData.last_name}
            title={formData.title}
            email={formData.email}
            location={formData.location}
            onFieldChange={handleFieldChange}
          />

          <AvailabilitySelector
            selected={formData.availability}
            onSelect={(value) => handleFieldChange('availability', value)}
          />

          <div className="space-y-2">
            <Label htmlFor="employment_preference">Employment Preference *</Label>
            <Select
              value={formData.employment_preference}
              onValueChange={(value: 'full_time' | 'equity' | 'both') => 
                handleFieldChange('employment_preference', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equity">Sweaquity options only</SelectItem>
                <SelectItem value="both">Both Sweaquity and Employment</SelectItem>
                <SelectItem value="full_time">Employment only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ConsentCheckboxes
            termsAccepted={formData.terms_accepted}
            marketingConsent={formData.marketing_consent}
            projectUpdatesConsent={formData.project_updates_consent}
            onTermsAcceptedChange={handleTermsAcceptedChange}
            onMarketingConsentChange={handleMarketingConsentChange}
            onProjectUpdatesConsentChange={handleProjectUpdatesConsentChange}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
};
