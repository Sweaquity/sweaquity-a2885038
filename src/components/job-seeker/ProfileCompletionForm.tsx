
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ProfileFormData {
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  location: string;
  availability: string;
  employment_preference: 'full_time' | 'equity' | 'both';
  terms_accepted: boolean;
  marketing_consent: boolean;
  project_updates_consent: boolean;
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
    availability: '',
    employment_preference: 'both',
    terms_accepted: false,
    marketing_consent: false,
    project_updates_consent: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terms_accepted) {
      toast.error("You must accept the terms and conditions");
      return;
    }

    setIsLoading(true);

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
      navigate("/seeker/dashboard");
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                required
                value={formData.first_name}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  first_name: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                required
                value={formData.last_name}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  last_name: e.target.value
                }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Professional Title *</Label>
            <Input
              id="title"
              required
              placeholder="e.g., Senior Software Engineer"
              value={formData.title}
              onChange={e => setFormData(prev => ({
                ...prev,
                title: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData(prev => ({
                ...prev,
                email: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              required
              placeholder="e.g., London, UK"
              value={formData.location}
              onChange={e => setFormData(prev => ({
                ...prev,
                location: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Textarea
              id="availability"
              placeholder="e.g., Available immediately, 2 weeks notice required, etc."
              value={formData.availability}
              onChange={e => setFormData(prev => ({
                ...prev,
                availability: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employment_preference">Employment Preference *</Label>
            <Select
              value={formData.employment_preference}
              onValueChange={(value: 'full_time' | 'equity' | 'both') => 
                setFormData(prev => ({
                  ...prev,
                  employment_preference: value
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full Time Employment</SelectItem>
                <SelectItem value="equity">Equity Projects Only</SelectItem>
                <SelectItem value="both">Both Options</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.terms_accepted}
                onCheckedChange={(checked: boolean) => setFormData(prev => ({
                  ...prev,
                  terms_accepted: checked
                }))}
              />
              <Label htmlFor="terms" className="text-sm">
                I accept the terms and conditions *
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketing"
                checked={formData.marketing_consent}
                onCheckedChange={(checked: boolean) => setFormData(prev => ({
                  ...prev,
                  marketing_consent: checked
                }))}
              />
              <Label htmlFor="marketing" className="text-sm">
                I agree to receive marketing communications
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="updates"
                checked={formData.project_updates_consent}
                onCheckedChange={(checked: boolean) => setFormData(prev => ({
                  ...prev,
                  project_updates_consent: checked
                }))}
              />
              <Label htmlFor="updates" className="text-sm">
                I want to receive project updates
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
};
