
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
      
      // Before attempting the delete, log some database information to help debug
      if (userType === 'business') {
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('businesses_id', userId)
          .single();
        
        console.log("Business profile check:", businessData);
      } else {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        console.log("Job seeker profile check:", profileData);
      }
      
      // Call the delete_user_profile function with the correct parameter names
      // The column name that's failing is likely in the Supabase function, not directly in our code
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
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
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
              <li>You will no longer be able to log in with these credentials</li>
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
              Your login credentials will be permanently deleted and you will not be able to log in again.
            </p>
            <p className="font-medium">
              Important: This deletes both your {getProfileTypeLabel()} profile data and your login credentials. If you have multiple account types, they will all be affected.
            </p>
          </div>
        </div>
        
        <p className="text-destructive font-medium">
          Are you sure you want to proceed? This action cannot be undone.
        </p>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button 
            variant="ouline"  
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
