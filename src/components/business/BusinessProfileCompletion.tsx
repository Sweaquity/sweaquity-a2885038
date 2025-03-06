import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TermsAndConditionsLink } from "@/components/shared/TermsAndConditionsLink";

export const BusinessProfileCompletion = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("No active session found");
        return;
      }

      const { error } = await supabase
        .from('businesses')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('businesses_id', session.user.id);

      if (error) throw error;
      
      toast.success("Profile updated successfully");
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <h2 className="text-2xl font-bold">Complete Your Business Profile</h2>
          <p className="text-muted-foreground">Please provide your business details to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="scaling_up">Scaling Up</SelectItem>
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
            
            <Button type="submit" className="w-full">Complete Profile</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
