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
      
      if (userType === 'business') {
        // Fetch business ID from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (profileError || !profileData) {
          toast.error("No business profile found to delete");
          return;
        }

        const businessId = profileData.id;

        // Fetch business data
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('business_id', businessId)
          .single();
        
        if (businessError || !businessData) {
          toast.error("No business data found to delete");
          return;
        }
        
        // Save data to gdpr_deleted_data
        const { error: insertError } = await supabase
          .from('gdpr_deleted_data')
          .insert({
            user_id: userId,
            user_type: userType,
            data: { profile: profileData, business: businessData },
            deleted_at: new Date().toISOString()
          });
        
        if (insertError) {
          toast.error("Error backing up profile data: " + insertError.message);
          return;
        }
        
        // Anonymize business data
        const { error: updateError } = await supabase
          .from('businesses')
          .update({
            company_name: 'Deleted Account',
            contact_email: null,
            contact_phone: null,
            is_anonymized: true
          })
          .eq('business_id', businessId);
        
        if (updateError) {
          toast.error("Failed to anonymize business profile: " + updateError.message);
          return;
        }
      } else {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError || !profileData) {
          toast.error("No job seeker profile found to delete");
          return;
        }
        
        // Save data to gdpr_deleted_data
        const { error: insertError } = await supabase
          .from('gdpr_deleted_data')
          .insert({
            user_id: userId,
            user_type: userType,
            data: profileData,
            deleted_at: new Date().toISOString()
          });
        
        if (insertError) {
          toast.error("Error backing up profile data: " + insertError.message);
          return;
        }
        
        // Anonymize profile data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: 'Deleted',
            last_name: 'Account',
            email: null,
            skills: null,
            is_anonymized: true
          })
          .eq('id', userId);
        
        if (updateError) {
          toast.error("Failed to anonymize profile: " + updateError.message);
          return;
        }
      }
      
      toast.success("Profile deleted successfully");
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to home page
      navigate('/');
      
    } catch (error: any) {
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
          <Button variant="outline" onClick={handleDeleteProfile} disabled={isDeleting} >
            {isDeleting ? "Deleting..." : "Delete Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
