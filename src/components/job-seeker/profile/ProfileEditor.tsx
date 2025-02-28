
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Profile } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PersonalInfoFields } from "./PersonalInfoFields";
import { AvailabilitySelector } from "./AvailabilitySelector";
import { ConsentCheckboxes } from "./ConsentCheckboxes";

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
    employment_preference: 'both' as 'full_time' | 'equity' | 'both',
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
        
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          title: data.title || '',
          email: data.email || '',
          location: data.location || '',
          availability: data.availability ? 
            (typeof data.availability === 'string' ? 
              [data.availability] : 
              Array.isArray(data.availability) ? 
                data.availability : []) : [],
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

      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
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
        
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          title: data.title || '',
          email: data.email || '',
          location: data.location || '',
          availability: data.availability ? 
            (typeof data.availability === 'string' ? 
              [data.availability] : 
              Array.isArray(data.availability) ? 
                data.availability : []) : [],
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
              <Label htmlFor="employment_preference">Sweaquity options or Employment too?</Label>
              <Select
                value={formData.employment_preference}
                onValueChange={(value: 'full_time' | 'equity' | 'both') => 
                  handleFieldChange('employment_preference', value)
                }
              >
                <SelectTrigger id="employment_preference">
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
                  {formData.employment_preference === 'both' ? 'Both Sweaquity and Employment' :
                   formData.employment_preference === 'equity' ? 'Sweaquity options only' :
                   'Employment only'}
                </p>
              </div>
            </div>
            
            <div>
              <Label className="text-muted-foreground">Availability</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.availability.length > 0 ? (
                  formData.availability.map((item, index) => (
                    <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No availability specified</p>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-muted-foreground">Consents</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-sm border ${formData.terms_accepted ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                    {formData.terms_accepted && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">Terms & Conditions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-sm border ${formData.marketing_consent ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                    {formData.marketing_consent && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">Marketing Communications</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-sm border ${formData.project_updates_consent ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                    {formData.project_updates_consent && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">Project Updates</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
