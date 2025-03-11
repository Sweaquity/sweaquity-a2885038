
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Save } from "lucide-react";

interface BusinessProfile {
  businesses_id: string;
  company_name: string;
  industry: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  location: string;
  project_stage: string;
  organization_type: string;
  terms_accepted: boolean;
  marketing_consent: boolean;
  project_updates_consent: boolean;
  banking_details?: {
    account_name: string | null;
    account_number: string | null;
    sort_code: string | null;
    bank_name: string | null;
  };
}

interface BusinessProfileEditorProps {
  businessProfile: BusinessProfile | null;
  onProfileUpdate?: () => void;
}

export const BusinessProfileEditor = ({ 
  businessProfile, 
  onProfileUpdate = () => {} 
}: BusinessProfileEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<BusinessProfile>({
    businesses_id: "",
    company_name: "",
    industry: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    location: "",
    project_stage: "",
    organization_type: "",
    terms_accepted: false,
    marketing_consent: false,
    project_updates_consent: false,
    banking_details: {
      account_name: null,
      account_number: null,
      sort_code: null,
      bank_name: null
    }
  });

  useEffect(() => {
    if (businessProfile) {
      setFormData(businessProfile);
    } else {
      loadBusinessProfile();
    }
  }, [businessProfile]);

  const loadBusinessProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('businesses_id', session.user.id)
        .single();
        
      if (error) throw error;
      
      setFormData({
        businesses_id: data.businesses_id,
        company_name: data.company_name || "",
        industry: data.industry || "",
        contact_email: data.contact_email || "",
        contact_phone: data.contact_phone || "",
        website: data.website || "",
        location: data.location || "",
        project_stage: data.project_stage || "",
        organization_type: data.organization_type || "",
        terms_accepted: !!data.terms_accepted,
        marketing_consent: !!data.marketing_consent,
        project_updates_consent: !!data.project_updates_consent,
        banking_details: data.banking_details || {
          account_name: null,
          account_number: null,
          sort_code: null,
          bank_name: null
        }
      });
    } catch (error) {
      console.error('Error loading business profile:', error);
      toast.error("Failed to load business profile");
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBankingDetailsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      banking_details: {
        ...prev.banking_details!,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terms_accepted) {
      toast.error("You must accept the terms and conditions");
      return;
    }

    if (!formData.company_name || !formData.industry) {
      toast.error("Company name and industry are required");
      return;
    }

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No authenticated session");
      }

      const { error } = await supabase
        .from('businesses')
        .update({
          company_name: formData.company_name,
          industry: formData.industry,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          website: formData.website,
          location: formData.location,
          project_stage: formData.project_stage,
          organization_type: formData.organization_type,
          terms_accepted: formData.terms_accepted,
          marketing_consent: formData.marketing_consent,
          project_updates_consent: formData.project_updates_consent,
          banking_details: formData.banking_details,
          updated_at: new Date().toISOString()
        })
        .eq('businesses_id', session.user.id);

      if (error) throw error;

      toast.success("Business profile updated successfully");
      setIsEditing(false);
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error('Error updating business profile:', error);
      toast.error("Failed to update business profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (businessProfile) {
      setFormData(businessProfile);
    } else {
      loadBusinessProfile();
    }
  };

  if (!formData.businesses_id) {
    return <div>Loading business profile...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Business Information</CardTitle>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project_stage">Project Stage</Label>
                  <Select
                    value={formData.project_stage}
                    onValueChange={(value) => handleInputChange('project_stage', value)}
                  >
                    <SelectTrigger id="project_stage">
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
                  <Label htmlFor="organization_type">Organisation Type</Label>
                  <Select
                    value={formData.organization_type}
                    onValueChange={(value) => handleInputChange('organization_type', value)}
                  >
                    <SelectTrigger id="organization_type">
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
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Banking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_name">Account Name</Label>
                    <Input
                      id="account_name"
                      value={formData.banking_details?.account_name || ""}
                      onChange={(e) => handleBankingDetailsChange('account_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={formData.banking_details?.account_number || ""}
                      onChange={(e) => handleBankingDetailsChange('account_number', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sort_code">Sort Code</Label>
                    <Input
                      id="sort_code"
                      value={formData.banking_details?.sort_code || ""}
                      onChange={(e) => handleBankingDetailsChange('sort_code', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={formData.banking_details?.bank_name || ""}
                      onChange={(e) => handleBankingDetailsChange('bank_name', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Consents</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms_accepted" 
                      checked={formData.terms_accepted}
                      onCheckedChange={(checked) => 
                        handleInputChange('terms_accepted', checked === true)
                      }
                    />
                    <Label htmlFor="terms_accepted">I accept the terms and conditions *</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="marketing_consent" 
                      checked={formData.marketing_consent}
                      onCheckedChange={(checked) => 
                        handleInputChange('marketing_consent', checked === true)
                      }
                    />
                    <Label htmlFor="marketing_consent">I want to receive marketing communications</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="project_updates_consent" 
                      checked={formData.project_updates_consent}
                      onCheckedChange={(checked) => 
                        handleInputChange('project_updates_consent', checked === true)
                      }
                    />
                    <Label htmlFor="project_updates_consent">I want to receive project updates</Label>
                  </div>
                </div>
              </div>

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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Company Name</Label>
                  <p className="font-medium">{formData.company_name || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Industry</Label>
                  <p className="font-medium">{formData.industry || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Email</Label>
                  <p className="font-medium">{formData.contact_email || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Phone</Label>
                  <p className="font-medium">{formData.contact_phone || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Website</Label>
                  <p className="font-medium">{formData.website || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{formData.location || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Project Stage</Label>
                  <p className="font-medium">{formData.project_stage || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organization Type</Label>
                  <p className="font-medium">{formData.organization_type || "Not specified"}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Banking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Account Name</Label>
                    <p className="font-medium">{formData.banking_details?.account_name || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Account Number</Label>
                    <p className="font-medium">{formData.banking_details?.account_number || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Sort Code</Label>
                    <p className="font-medium">{formData.banking_details?.sort_code || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Bank Name</Label>
                    <p className="font-medium">{formData.banking_details?.bank_name || "Not specified"}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Consents</h3>
                <div className="grid grid-cols-3 gap-2">
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
