
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Pencil, Save } from "lucide-react";
import { AvailabilitySelector } from "./AvailabilitySelector";
import { PersonalInfoFields } from "./PersonalInfoFields";
import { ConsentCheckboxes } from "./ConsentCheckboxes";

export function ProfileEditor({ profileData, onProfileUpdate }: { profileData: any, onProfileUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profileData?.full_name || "",
    email: profileData?.email || "",
    location: profileData?.location || "",
    phone: profileData?.phone || "",
    summary: profileData?.summary || "",
    availability: profileData?.availability || "full-time",
    open_to_recruiters: profileData?.open_to_recruiters || false,
    marketing_consent: profileData?.marketing_consent || false,
    terms_accepted: profileData?.terms_accepted || false
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profileData) {
      setFormData({
        full_name: profileData.full_name || "",
        email: profileData.email || "",
        location: profileData.location || "",
        phone: profileData.phone || "",
        summary: profileData.summary || "",
        availability: profileData.availability || "full-time",
        open_to_recruiters: profileData.open_to_recruiters || false,
        marketing_consent: profileData.marketing_consent || false,
        terms_accepted: profileData.terms_accepted || true // If they already have a profile, they've accepted terms
      });
    }
  }, [profileData]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.terms_accepted) {
      toast.error("You must accept the terms and conditions");
      return;
    }

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          location: formData.location,
          phone: formData.phone,
          summary: formData.summary,
          availability: formData.availability,
          open_to_recruiters: formData.open_to_recruiters,
          marketing_consent: formData.marketing_consent,
          terms_accepted: formData.terms_accepted,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileData.id);
      
      if (error) throw error;
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
      onProfileUpdate();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profileData?.full_name || "",
      email: profileData?.email || "",
      location: profileData?.location || "",
      phone: profileData?.phone || "",
      summary: profileData?.summary || "",
      availability: profileData?.availability || "full-time",
      open_to_recruiters: profileData?.open_to_recruiters || false,
      marketing_consent: profileData?.marketing_consent || false,
      terms_accepted: profileData?.terms_accepted || true
    });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Personal Information</h3>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm">Full Name</Label>
            <p className="font-medium">{profileData?.full_name || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Email</Label>
            <p className="font-medium">{profileData?.email || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Location</Label>
            <p className="font-medium">{profileData?.location || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Phone</Label>
            <p className="font-medium">{profileData?.phone || "Not specified"}</p>
          </div>
          
          <div className="col-span-2">
            <Label className="text-muted-foreground text-sm">Summary</Label>
            <p className="font-medium">{profileData?.summary || "No summary provided"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Availability</Label>
            <p className="font-medium">
              {profileData?.availability === "full-time" && "Full-time"}
              {profileData?.availability === "part-time" && "Part-time"}
              {profileData?.availability === "contract" && "Contract"}
              {profileData?.availability === "freelance" && "Freelance"}
              {!profileData?.availability && "Not specified"}
            </p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Open to Recruiters</Label>
            <p className="font-medium">{profileData?.open_to_recruiters ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Edit Profile</h3>
      </div>
      
      <form className="space-y-4">
        <PersonalInfoFields formData={formData} setFormData={setFormData} />
        
        <div className="space-y-2">
          <Label htmlFor="summary">Professional Summary</Label>
          <Textarea 
            id="summary"
            placeholder="Write a brief summary about your professional background, skills, and career goals"
            value={formData.summary}
            onChange={(e) => handleChange("summary", e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        <AvailabilitySelector 
          availability={formData.availability} 
          onChange={(value) => handleChange("availability", value)} 
        />
        
        <ConsentCheckboxes 
          openToRecruiters={formData.open_to_recruiters}
          marketingConsent={formData.marketing_consent}
          termsAccepted={formData.terms_accepted}
          onOpenToRecruitersChange={(checked) => handleChange("open_to_recruiters", checked)}
          onMarketingConsentChange={(checked) => handleChange("marketing_consent", checked)}
          onTermsAcceptedChange={(checked) => handleChange("terms_accepted", checked)}
        />
        
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
