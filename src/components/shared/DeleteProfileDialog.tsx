
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
      
      // Begin transaction by backing up data before deletion
      if (userType === 'business') {
        console.log("Deleting business profile for user:", userId);
        
        // Fetch business profile
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('businesses_id', userId)
          .single();
        
        if (businessError) {
          console.error("Error fetching business data:", businessError);
          toast.error("Failed to fetch business profile");
          return;
        }

        // Fetch user profile (if exists)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        // Save both profiles to gdpr_deleted_data
        const { error: insertError } = await supabase
          .from('gdpr_deleted_data')
          .insert({
            user_id: userId,
            user_type: userType,
            data: { 
              business: businessData,
              profile: profileError ? null : profileData 
            }
          });
        
        if (insertError) {
          console.error("Error saving deleted data:", insertError);
          toast.error("Error backing up profile data: " + insertError.message);
          return;
        }
        
        // Anonymize business data
        const { error: updateBusinessError } = await supabase
          .from('businesses')
          .update({
            company_name: 'Deleted Account',
            contact_email: null,
            contact_phone: null,
            is_anonymized: true
          })
          .eq('businesses_id', userId);
        
        if (updateBusinessError) {
          console.error("Error anonymizing business:", updateBusinessError);
          toast.error("Failed to anonymize business profile");
          return;
        }
        
        // If user also has a job seeker profile, anonymize it
        if (!profileError && profileData) {
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({
              first_name: 'Deleted',
              last_name: 'Account',
              email: null,
              skills: null,
              is_anonymized: true
            })
            .eq('id', userId);
          
          if (updateProfileError) {
            console.error("Error anonymizing profile:", updateProfileError);
            toast.error("Failed to anonymize user profile");
            return;
          }
        }
      } else {
        // Job seeker profile deletion
        console.log("Deleting job seeker profile for user:", userId);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile data:", profileError);
          toast.error("Failed to fetch user profile");
          return;
        }
        
        // Check if user also has a business profile
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('businesses_id', userId)
          .single();
        
        // Save data to gdpr_deleted_data
        const { error: insertError } = await supabase
          .from('gdpr_deleted_data')
          .insert({
            user_id: userId,
            user_type: userType,
            data: { 
              profile: profileData,
              business: businessError ? null : businessData 
            }
          });
        
        if (insertError) {
          console.error("Error saving deleted data:", insertError);
          toast.error("Error backing up profile data: " + insertError.message);
          return;
        }
        
        // Anonymize profile data
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({
            first_name: 'Deleted',
            last_name: 'Account',
            email: null,
            skills: null,
            is_anonymized: true
          })
          .eq('id', userId);
        
        if (updateProfileError) {
          console.error("Error anonymizing profile:", updateProfileError);
          toast.error("Failed to anonymize profile");
          return;
        }
        
        // If user also has a business profile, anonymize it
        if (!businessError && businessData) {
          const { error: updateBusinessError } = await supabase
            .from('businesses')
            .update({
              company_name: 'Deleted Account',
              contact_email: null,
              contact_phone: null,
              is_anonymized: true
            })
            .eq('businesses_id', userId);
          
          if (updateBusinessError) {
            console.error("Error anonymizing business:", updateBusinessError);
            toast.error("Failed to anonymize business profile");
            return;
          }
        }
      }
      
      toast.success("Profile deleted successfully");
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to home page
      navigate('/');
      
    } catch (error: any) {
      console.error("Delete profile error:", error);
      toast.error(`Failed to delete profile: ${error?.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isDeleting && !open && onClose()}>
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
