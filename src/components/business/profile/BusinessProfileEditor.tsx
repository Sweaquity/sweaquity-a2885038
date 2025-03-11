
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    industry: businessProfile?.industry || "",
    location: businessProfile?.location || "",
    website: businessProfile?.website || "",
    contact_phone: businessProfile?.contact_phone || "",
    project_stage: businessProfile?.project_stage || "",
    organization_type: businessProfile?.organization_type || ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('businesses')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('businesses_id', businessProfile.businesses_id);
      
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
      company_name: businessProfile?.company_name || "",
      industry: businessProfile?.industry || "",
      location: businessProfile?.location || "",
      website: businessProfile?.website || "",
      contact_phone: businessProfile?.contact_phone || "",
      project_stage: businessProfile?.project_stage || "",
      organization_type: businessProfile?.organization_type || ""
    });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Business Profile</h3>
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
            <Label className="text-muted-foreground text-sm">Industry</Label>
            <p className="font-medium">{businessProfile?.industry || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Location</Label>
            <p className="font-medium">{businessProfile?.location || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Website</Label>
            <p className="font-medium">{businessProfile?.website || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Contact Phone</Label>
            <p className="font-medium">{businessProfile?.contact_phone || "Not specified"}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Project Stage</Label>
            <p className="font-medium">
              {businessProfile?.project_stage === "idea" && "Idea Stage"}
              {businessProfile?.project_stage === "mvp" && "MVP"}
              {businessProfile?.project_stage === "early" && "Early Stage"}
              {businessProfile?.project_stage === "growth" && "Growth"}
              {!businessProfile?.project_stage && "Not specified"}
            </p>
          </div>
          
          <div>
            <Label className="text-muted-foreground text-sm">Organization Type</Label>
            <p className="font-medium">
              {businessProfile?.organization_type === "startup" && "Start Up"}
              {businessProfile?.organization_type === "scaleup" && "Scale Up"}
              {businessProfile?.organization_type === "enterprise" && "Enterprise"}
              {businessProfile?.organization_type === "non_profit" && "Non-Profit"}
              {businessProfile?.organization_type === "public_sector" && "Public Sector"}
              {!businessProfile?.organization_type && "Not specified"}
            </p>
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
              value={formData.company_name}
              onChange={(e) => handleChange("company_name", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => handleChange("industry", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange("website", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => handleChange("contact_phone", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project_stage">Project Stage</Label>
            <Select
              value={formData.project_stage}
              onValueChange={(value) => handleChange("project_stage", value)}
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
            <Label htmlFor="organization_type">Organization Type</Label>
            <Select
              value={formData.organization_type}
              onValueChange={(value) => handleChange("organization_type", value)}
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
