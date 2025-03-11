
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Info } from "lucide-react";

interface DeleteProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'business' | 'job_seeker';
}

export const DeleteProfileDialog = ({ isOpen, onClose, userType }: DeleteProfileDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const getProfileTypeLabel = () => 
    userType === 'business' ? 'business' : 'job seeker';

  const handleRemoveProfile = async () => {
    try {
      setIsProcessing(true);
      
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        toast.error("Authentication error: " + sessionError.message);
        return;
      }
      
      if (!sessionData?.session) {
        toast.error("No active session found. Please log in again.");
        navigate('/login');
        return;
      }
      
      const userId = sessionData.session.user.id;
      
      console.log(`Anonymizing ${userType} profile for user ${userId}`);
      
      // Get profile data before anonymization for GDPR backup
      const profileData = userType === 'job_seeker' 
        ? await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        : null;
        
      // Get business data before anonymization for GDPR backup
      const businessData = userType === 'business'
        ? await supabase.from('businesses').select('*').eq('businesses_id', userId).maybeSingle()
        : null;
      
      // Store in GDPR table
      const { error: gdprError } = await supabase
        .from('gdpr_deleted_data')
        .insert({
          user_id: userId,
          user_type: userType,
          data: JSON.stringify({
            profile: profileData?.data || null,
            business: businessData?.data || null
          }),
          deleted_at: new Date().toISOString()
        });
        
      if (gdprError) {
        console.error("Error storing GDPR data:", gdprError);
        // Continue with anonymization despite GDPR storage error
      }
      
      // Direct anonymization approach for the specific profile type
      if (userType === 'job_seeker') {
        // Anonymize the profile data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: 'Deleted Account',
            last_name: '',
            email: null,
            phone: null,
            address: null,
            bio: 'This account has been anonymized',
            is_anonymized: true,
            anonymized_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (profileError) {
          console.error("Error anonymizing profile:", profileError);
          toast.error("Failed to anonymize profile data: " + profileError.message);
          return;
        }
        
        // Update job applications status to withdrawn
        const { error: applicationsError } = await supabase
          .from('job_applications')
          .update({
            status: 'withdrawn',
            applicant_anonymized: true
          })
          .eq('user_id', userId);
          
        if (applicationsError && applicationsError.code !== 'PGRST116') {
          console.error("Error updating applications:", applicationsError);
        }
        
      } else if (userType === 'business') {
        // Anonymize business profile
        const { error: businessError } = await supabase
          .from('businesses')
          .update({
            company_name: 'Deleted Business',
            contact_email: null,
            contact_phone: null,
            contact_person: null,
            website: null,
            is_anonymized: true,
            anonymized_at: new Date().toISOString()
          })
          .eq('businesses_id', userId);
          
        if (businessError) {
          console.error("Error anonymizing business:", businessError);
          toast.error("Failed to anonymize business data: " + businessError.message);
          return;
        }
        
        // Mark business projects as inactive
        const { error: projectsError } = await supabase
          .from('business_projects')
          .update({
            status: 'inactive'
          })
          .eq('business_id', userId);
          
        if (projectsError && projectsError.code !== 'PGRST116') {
          console.error("Error updating projects:", projectsError);
        }
      }
      
      toast.success("Your profile has been successfully anonymized in accordance with GDPR regulations");
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to home page
      navigate('/');
      
    } catch (error: any) {
      console.error("Profile anonymization error:", error);
      toast.error(`Failed to anonymize profile data: ${error?.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anonymize Account Data</DialogTitle>
          <DialogDescription>
            This will anonymize your personal information from your {getProfileTypeLabel()} profile in accordance with GDPR regulations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex gap-2">
          <AlertCircle className="text-amber-500 h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">What happens to your data:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Personal information will be replaced with "Deleted Account"</li>
              <li>Contact details will be removed</li>
              <li>A backup of your data will be securely stored as required by GDPR</li>
              {userType === 'business' && (
                <li>Your job listings will be marked as inactive</li>
              )}
              {userType === 'job_seeker' && (
                <li>Your job applications will be marked as withdrawn</li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200 flex gap-2">
          <Info className="text-blue-500 h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="mb-2">
              You will be signed out after your data is anonymized. This action preserves system records but removes all personally identifiable information.
            </p>
            <p className="font-medium">
              Important: If you have both job seeker and business accounts, you will need to anonymize each account type separately.
            </p>
          </div>
        </div>
        
        <p className="text-destructive font-medium">
          Are you sure you want to proceed? This action cannot be undone.
        </p>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleRemoveProfile} 
            disabled={isProcessing}
            className="border border-destructive"
          >
            {isProcessing ? "Processing..." : "Anonymize My Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
