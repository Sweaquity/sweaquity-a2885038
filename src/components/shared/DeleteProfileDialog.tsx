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

interface DeleteProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'business' | 'job_seeker';
}

export const DeleteProfileDialog = ({ isOpen, onClose, userType }: DeleteProfileDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDeleteProfile = async () => {
    try {
      setIsDeleting(true);
      
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
      
      // Determine which table and ID field to use
      const table = userType === 'business' ? 'businesses' : 'profiles';
      const idField = userType === 'business' ? 'businesses_id' : 'id';
      
      // First, check if the user exists in the table
      const { data: userData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq(idField, userId)
        .single();
        
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          toast.error(`No ${userType} profile found for this account`);
        } else {
          toast.error(`Error fetching profile: ${fetchError.message}`);
        }
        console.error("Error fetching user data:", fetchError);
        return;
      }
      
      if (!userData) {
        toast.error(`No ${userType} profile found to delete`);
        return;
      }
      
      // Save the data to the gdpr_deleted_data table
      const { error: insertError } = await supabase
        .from('gdpr_deleted_data')
        .insert({
          user_id: userId,
          user_type: userType,
          data: userData,
          deleted_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error("Error saving deleted data:", insertError);
        toast.error(`Error backing up profile data: ${insertError.message}`);
        return;
      }
      
      // Now anonymize the data in the original table
      let updateError;
      
      if (userType === 'business') {
        const { error } = await supabase
          .from('businesses')
          .update({
            company_name: 'Deleted Account',
            contact_email: null,
            contact_phone: null,
            is_anonymized: true
          })
          .eq('businesses_id', userId);
          
        updateError = error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: 'Deleted',
            last_name: 'Account',
            email: null,
            skills: null,
            is_anonymized: true
          })
          .eq('id', userId);
          
        updateError = error;
      }
      
      if (updateError) {
        console.error("Error anonymizing profile:", updateError);
        toast.error(`Failed to anonymize profile: ${updateError.message}`);
        return;
      }
      
      toast.success("Profile deleted successfully");
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to home page
      navigate('/');
      
    } catch (error: any) {
      console.error("Error in delete profile process:", error);
      toast.error(`Failed to delete profile: ${error?.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isDeleting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Profile</DialogTitle>
          <DialogDescription>
            This will permanently delete your {userType === 'business' ? 'business' : 'job seeker'} profile. Your data will be anonymized and personal information removed.
          </DialogDescription>
        </DialogHeader>
        <p className="text-destructive font-medium">
          Are you sure you want to delete your profile? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteProfile}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
