import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Profile } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PersonalInfoFields } from "./PersonalInfoFields";
import { AvailabilitySelector } from "./AvailabilitySelector";
import { ConsentCheckboxes } from "./ConsentCheckboxes";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface ProfileEditorProps {
  profile: Profile | null;
  onProfileUpdate?: () => void;
}

export const ProfileEditor = ({ profile, onProfileUpdate = () => {} }: ProfileEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    title: '',
    email: '',
    location: '',
    availability: [] as string[],
    employment_preference: 'both' as 'salary_only' | 'equity_only' | 'both',
    terms_accepted: false,
    marketing_consent: false,
    project_updates_consent: false,
  });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (error) throw error;
        
        let availabilityArray = [];
        
        // Parse availability properly
        if (data.availability) {
          if (typeof data.availability === 'string') {
            try {
              // Try to parse JSON string
              availabilityArray = JSON.parse(data.availability);
            } catch (e) {
              // If not valid JSON, treat as a single item
              availabilityArray = [data.availability];
            }
          } else if (Array.isArray(data.availability)) {
            availabilityArray = data.availability;
          }
        }
        
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          title: data.title || '',
          email: data.email || '',
          location: data.location || '',
          availability: availabilityArray,
          employment_preference: data.employment_preference || 'both',
          terms_accepted: !!data.terms_accepted,
          marketing_consent: !!data.marketing_consent,
          project_updates_consent: !!data.project_updates_consent,
        });
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast.error("Failed to load profile data");
      }
    };
    
    loadProfileData();
  }, [profile]);

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

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No authenticated session");
      }

      // Convert availability to string if needed for storage
      const availabilityData = 
        Array.isArray(formData.availability) 
          ? JSON.stringify(formData.availability) 
          : formData.availability;

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          title: formData.title,
          email: formData.email,
          location: formData.location, 
          availability: availabilityData,
          employment_preference: formData.employment_preference,
          terms_accepted: formData.terms_accepted,
          marketing_consent: formData.marketing_consent,
          project_updates_consent: formData.project_updates_consent,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      setIsEditing(false);
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload the data
    const loadProfileData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (error) throw error;
        
        let availabilityArray = [];
        
        // Parse availability properly
        if (data.availability) {
          if (typeof data.availability === 'string') {
            try {
              // Try to parse JSON string
              availabilityArray = JSON.parse(data.availability);
            } catch (e) {
              // If not valid JSON, treat as a single item
              availabilityArray = [data.availability];
            }
          } else if (Array.isArray(data.availability)) {
            availabilityArray = data.availability;
          }
        }
        
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          title: data.title || '',
          email: data.email || '',
          location: data.location || '',
          availability: availabilityArray,
          employment_preference: data.employment_preference || 'both',
          terms_accepted: !!data.terms_accepted,
          marketing_consent: !!data.marketing_consent,
          project_updates_consent: !!data.project_updates_consent,
        });
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast.error("Failed to load profile data");
      }
    };
    
    loadProfileData();
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personal Information</CardTitle>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
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
                <Label htmlFor="employment_preference">Employment Preference</Label>
                <Select
                  value={formData.employment_preference}
                  onValueChange={(value: 'salary_only' | 'equity_only' | 'both') => 
                    handleFieldChange('employment_preference', value)
                  }
                >
                  <SelectTrigger id="employment_preference" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equity_only">Equity only</SelectItem>
                    <SelectItem value="both">Both Equity and Salary</SelectItem>
                    <SelectItem value="salary_only">Salary only</SelectItem>
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

              <div className="flex gap-2 justify-end">
                <Button variant="outline" type="button" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">First Name</Label>
                  <p className="font-medium">{formData.first_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Name</Label>
                  <p className="font-medium">{formData.last_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Professional Title</Label>
                  <p className="font-medium">{formData.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{formData.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{formData.location}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Employment Preference</Label>
                  <p className="font-medium">
                    {formData.employment_preference === 'both' ? 'Both Equity and Salary' :
                     formData.employment_preference === 'equity_only' ? 'Equity only' :
                     'Salary only'}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Availability</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.availability && formData.availability.length > 0 ? (
                    formData.availability.map((item, index) => (
                      <Badge key={index} variant="secondary" className="px-2 py-1 text-sm">
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No availability specified</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Consents</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${formData.terms_accepted ? 'bg-primary border-primary text-primary-foreground' : 'border-gray-300'}`}>
                      {formData.terms_accepted && <Check className="h-3 w-3" />}
                    </div>
                    <span className="text-sm">Terms & Conditions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${formData.marketing_consent ? 'bg-primary border-primary text-primary-foreground' : 'border-gray-300'}`}>
                      {formData.marketing_consent && <Check className="h-3 w-3" />}
                    </div>
                    <span className="text-sm">Marketing Communications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${formData.project_updates_consent ? 'bg-primary border-primary text-primary-foreground' : 'border-gray-300'}`}>
                      {formData.project_updates_consent && <Check className="h-3 w-3" />}
                    </div>
                    <span className="text-sm">Project Updates</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
