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
import { AlertCircle } from "lucide-react";

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
      
      // Call the renamed RPC function to handle the anonymization securely
      const { data, error: rpcError } = await supabase.rpc('anonymize_user_profile', { 
        user_type: userType,
        user_id: userId
      });
      
      if (rpcError) {
        console.error("Error anonymizing profile:", rpcError);
        toast.error("Failed to remove profile data: " + rpcError.message);
        return;
      }
      
      if (!data?.success) {
        toast.error("Failed to remove profile data. Please contact support.");
        return;
      }
      
      toast.success("Your profile data has been successfully removed");
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to home page
      navigate('/');
      
    } catch (error: any) {
      console.error("Profile anonymization error:", error);
      toast.error(`Failed to remove profile data: ${error?.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Account Data</DialogTitle>
          <DialogDescription>
            This will remove your personal information from your {getProfileTypeLabel()} profile. Your account will be deactivated and your data will be anonymized in accordance with GDPR regulations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex gap-2">
          <AlertCircle className="text-amber-500 h-5 w-5" />
          <p className="text-sm text-amber-800">
            Note: This will preserve anonymized records for system integrity, but all your personal identifying information will be removed.
          </p>
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
          >
            {isProcessing ? "Processing..." : "Remove My Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
