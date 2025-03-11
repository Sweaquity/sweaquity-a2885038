
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
      
      console.log(`Removing ${userType} profile for user ${userId}`);
      
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
        // Continue with deletion despite GDPR storage error
      }
      
      // Call the delete_user_profile function that will handle the actual deletion
      // This is a server-side function that will delete the user profile and related data
      const { error: deletionError } = await supabase.rpc(
        'delete_user_profile',
        { 
          user_type: userType,
          user_id: userId
        }
      );
      
      if (deletionError) {
        console.error("Error deleting profile:", deletionError);
        toast.error("Failed to delete profile: " + deletionError.message);
        return;
      }
      
      toast.success("Your profile has been successfully deleted in accordance with GDPR regulations");
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to home page
      navigate('/');
      
    } catch (error: any) {
      console.error("Profile deletion error:", error);
      toast.error(`Failed to delete profile: ${error?.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Account Data</DialogTitle>
          <DialogDescription>
            This will delete your {getProfileTypeLabel()} profile data in accordance with GDPR regulations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex gap-2">
          <AlertCircle className="text-amber-500 h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">What happens to your data:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Your account and personal information will be completely deleted</li>
              <li>A backup of your data will be securely stored as required by GDPR</li>
              {userType === 'business' && (
                <li>Your job listings and project data will be removed</li>
              )}
              {userType === 'job_seeker' && (
                <li>Your job applications and skills data will be removed</li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200 flex gap-2">
          <Info className="text-blue-500 h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="mb-2">
              You will be signed out after your data is deleted. This action cannot be undone.
            </p>
            <p className="font-medium">
              Important: This only deletes your {getProfileTypeLabel()} profile data. If you have both job seeker and business accounts, you will need to delete each account type separately by logging in to each account type.
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
            {isProcessing ? "Processing..." : "Delete My Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
