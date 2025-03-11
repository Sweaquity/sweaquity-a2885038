
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

interface BusinessProfileEditorProps {
  businessProfile: any;
  onProfileUpdate: () => void;
}

export function BusinessProfileEditor({ businessProfile, onProfileUpdate }: BusinessProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    company_name: businessProfile?.company_name || "",
    contact_email: businessProfile?.contact_email || "",
    contact_person: businessProfile?.contact_person || "",
    industry: businessProfile?.industry || "",
    business_type: businessProfile?.business_type || "small",
    company_size: businessProfile?.company_size || 0,
    location: businessProfile?.location || "",
    company_website: businessProfile?.company_website || "",
    organization_type: businessProfile?.organization_type || "",
    time_commitment: businessProfile?.time_commitment || "part_time",
    terms_accepted: businessProfile?.terms_accepted || false,
    marketing_consent: businessProfile?.marketing_consent || false,
    open_to_recruiters: businessProfile?.open_to_recruiters || false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (businessProfile) {
      setFormData({
        company_name: businessProfile.company_name || "",
        contact_email: businessProfile.contact_email || "",
        contact_person: businessProfile.contact_person || "",
        industry: businessProfile.industry || "",
        business_type: businessProfile.business_type || "small",
        company_size: businessProfile.company_size || 0,
        location: businessProfile.location || "",
        company_website: businessProfile.company_website || "",
        organization_type: businessProfile.organization_type || "",
        time_commitment: businessProfile.time_commitment || "part_time",
        terms_accepted: businessProfile.terms_accepted || false,
        marketing_consent: businessProfile.marketing_consent || false,
        open_to_recruiters: businessProfile.open_to_recruiters || false,
      });
    }
  }, [businessProfile]);

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
        .from('businesses')
        .update({
          company_name: formData.company_name,
          industry: formData.industry,
          contact_person: formData.contact_person,
          business_type: formData.business_type,
          company_size: Number(formData.company_size),
          location: formData.location,
          company_website: formData.company_website,
          organization_type: formData.organization_type,
          time_commitment: formData.time_commitment,
          terms_accepted: formData.terms_accepted,
          marketing_consent: formData.marketing_consent,
          open_to_recruiters: formData.open_to_recruiters,
          updated_at: new Date().toISOString()
        })
        .eq('businesses_id', businessProfile.businesses_id);
      
      if (error) throw error;
      
      toast.success("Business profile updated successfully");
      setIsEditing(false);
      onProfileUpdate();
    } catch (error) {
      console.error("Error updating business profile:", error);
      toast.error("Failed to update business profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      company_name: businessProfile?.company_name || "",
      contact_email: businessProfile?.contact_email || "",
      contact_person: businessProfile?.contact_person || "",
      industry: businessProfile?.industry || "",
      business_type: businessProfile?.business_type || "small",
      company_size: businessProfile?.company_size || 0,
      location: businessProfile?.location || "",
      company_website: businessProfile?.company_website || "",
      organization_type: businessProfile?.organization_type || "",
      time_commitment: businessProfile?.time_commitment || "part_time",
      terms_accepted: businessProfile?.terms_accepted || false,
      marketing_consent: businessProfile?.marketing_consent || false,
      open_to_recruiters: businessProfile?.open_to_recruiters || false,
    });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Business Information</h3>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm">Company Name</Label>
            <p className="font-medium">{businessProfile?.company_name || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Contact Email</Label>
            <p className="font-medium">{businessProfile?.contact_email || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Contact Person</Label>
            <p className="font-medium">{businessProfile?.contact_person || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Industry</Label>
            <p className="font-medium">{businessProfile?.industry || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Business Type</Label>
            <p className="font-medium">{businessProfile?.business_type || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Company Size</Label>
            <p className="font-medium">{businessProfile?.company_size || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Location</Label>
            <p className="font-medium">{businessProfile?.location || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Website</Label>
            <p className="font-medium">{businessProfile?.company_website || "Not specified"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Edit Business Profile</h3>
      </div>
      
      <form className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              placeholder="Company Name"
              value={formData.company_name}
              onChange={(e) => handleChange("company_name", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              readOnly
              disabled
              className="bg-gray-100"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact_person">Contact Person</Label>
            <Input
              id="contact_person"
              placeholder="Contact Person"
              value={formData.contact_person}
              onChange={(e) => handleChange("contact_person", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="Industry"
              value={formData.industry}
              onChange={(e) => handleChange("industry", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="business_type">Business Type</Label>
            <Select 
              value={formData.business_type} 
              onValueChange={(value) => handleChange("business_type", value)}
            >
              <SelectTrigger id="business_type">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small Business</SelectItem>
                <SelectItem value="medium">Medium Business</SelectItem>
                <SelectItem value="large">Large Business</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="nonprofit">Nonprofit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company_size">Company Size (# of employees)</Label>
            <Input
              id="company_size"
              type="number"
              placeholder="Number of employees"
              value={formData.company_size.toString()}
              onChange={(e) => handleChange("company_size", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="City, Country"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company_website">Website</Label>
            <Input
              id="company_website"
              placeholder="https://example.com"
              value={formData.company_website}
              onChange={(e) => handleChange("company_website", e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="organization_type">Organization Type</Label>
          <Input
            id="organization_type"
            placeholder="Organization Type"
            value={formData.organization_type}
            onChange={(e) => handleChange("organization_type", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="time_commitment">Time Commitment</Label>
          <Select 
            value={formData.time_commitment} 
            onValueChange={(value) => handleChange("time_commitment", value)}
          >
            <SelectTrigger id="time_commitment">
              <SelectValue placeholder="Select time commitment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-start space-x-2 pt-4">
          <Checkbox
            id="open_to_recruiters"
            checked={formData.open_to_recruiters}
            onCheckedChange={(checked) => handleChange("open_to_recruiters", !!checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="open_to_recruiters"
              className="text-sm font-medium leading-none"
            >
              Open to Recruiters
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow recruiters to find your business and contact you
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="marketing_consent"
            checked={formData.marketing_consent}
            onCheckedChange={(checked) => handleChange("marketing_consent", !!checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="marketing_consent"
              className="text-sm font-medium leading-none"
            >
              Marketing Communications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive updates, newsletters, and relevant marketing materials
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="terms_accepted"
            checked={formData.terms_accepted}
            onCheckedChange={(checked) => handleChange("terms_accepted", !!checked)}
            required
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="terms_accepted"
              className="text-sm font-medium leading-none"
            >
              Terms and Conditions
            </Label>
            <p className="text-sm text-muted-foreground">
              I agree to the terms and conditions of using this platform
            </p>
          </div>
        </div>
        
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
