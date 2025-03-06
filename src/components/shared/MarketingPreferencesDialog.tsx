
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface MarketingPreferencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'business' | 'job_seeker';
}

export const MarketingPreferencesDialog = ({ isOpen, onClose, userType }: MarketingPreferencesDialogProps) => {
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [projectUpdatesConsent, setProjectUpdatesConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadConsents = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const table = userType === 'business' ? 'businesses' : 'profiles';
        const idField = userType === 'business' ? 'businesses_id' : 'id';
        
        const { data, error } = await supabase
          .from(table)
          .select('marketing_consent, project_updates_consent')
          .eq(idField, session.user.id)
          .single();
        
        if (error) throw error;
        
        setMarketingConsent(data.marketing_consent || false);
        setProjectUpdatesConsent(data.project_updates_consent || false);
      } catch (error) {
        console.error("Error loading marketing preferences:", error);
        toast.error("Failed to load marketing preferences");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen) {
      loadConsents();
    }
  }, [isOpen, userType]);

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("No active session found");
        return;
      }
      
      const table = userType === 'business' ? 'businesses' : 'profiles';
      const idField = userType === 'business' ? 'businesses_id' : 'id';
      
      const { error } = await supabase
        .from(table)
        .update({
          marketing_consent: marketingConsent,
          project_updates_consent: projectUpdatesConsent,
          updated_at: new Date().toISOString()
        })
        .eq(idField, session.user.id);
      
      if (error) throw error;
      
      toast.success("Marketing preferences updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating marketing preferences:", error);
      toast.error("Failed to update marketing preferences");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleOptOutAll = async () => {
    try {
      setIsSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("No active session found");
        return;
      }
      
      const table = userType === 'business' ? 'businesses' : 'profiles';
      const idField = userType === 'business' ? 'businesses_id' : 'id';
      
      const { error } = await supabase
        .from(table)
        .update({
          marketing_consent: false,
          project_updates_consent: false,
          updated_at: new Date().toISOString()
        })
        .eq(idField, session.user.id);
      
      if (error) throw error;
      
      // Update local state
      setMarketingConsent(false);
      setProjectUpdatesConsent(false);
      
      toast.success("Successfully opted out of all marketing communications");
    } catch (error) {
      console.error("Error opting out of marketing:", error);
      toast.error("Failed to update marketing preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marketing Preferences</DialogTitle>
          <DialogDescription>
            Control how we communicate with you. You can opt out at any time.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-6">Loading your preferences...</div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing-emails">Marketing emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails about new features and offers
                </p>
              </div>
              <Switch 
                id="marketing-emails"
                checked={marketingConsent}
                onCheckedChange={setMarketingConsent}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="project-updates">Project updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about project updates and opportunities
                </p>
              </div>
              <Switch 
                id="project-updates"
                checked={projectUpdatesConsent}
                onCheckedChange={setProjectUpdatesConsent}
              />
            </div>
            
            <div className="pt-2">
              <Button 
                variant="destructive" 
                onClick={handleOptOutAll}
                disabled={isSaving || (!marketingConsent && !projectUpdatesConsent)}
                className="w-full"
              >
                Opt out of all marketing communications
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSavePreferences}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
