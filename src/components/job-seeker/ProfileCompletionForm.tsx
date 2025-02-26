
import { useState, useEffect } from "react";
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
  source?: string;
}

const AVAILABILITY_OPTIONS = [
  'Immediately available',
  '2 weeks notice',
  'Part time',
  'Ad hoc',
  'Outside of usual business hours',
  'Curious to which projects require my skills'
] as const;

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
    project_updates_consent: false,
  });

  // Load user email on component mount
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

  // Attempt to get referral source from cookie
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terms_accepted) {
      toast.error("You must accept the terms and conditions");
      return;
    }

    if (!formData.availability) {
      toast.error("Please select your availability");
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
              disabled
              className="bg-muted"
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
            <Label htmlFor="availability">Availability *</Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABILITY_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={formData.availability === option ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    availability: option
                  }))}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employment_preference">Sweaquity options or Employment too? *</Label>
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
                <SelectItem value="equity">Sweaquity options only</SelectItem>
                <SelectItem value="both">Both Sweaquity and Employment</SelectItem>
                <SelectItem value="full_time">Employment only</SelectItem>
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
                I accept the <a 
                  href="/terms" 
                  target="_blank" 
                  className="text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    // Detect user's location and open appropriate terms page
                    // For now, we'll just open a generic terms page
                    window.open('/terms', '_blank');
                  }}
                >terms and conditions</a>, and agree to having my data collected *
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
        </div>
      </form>
    </div>
  );
};
