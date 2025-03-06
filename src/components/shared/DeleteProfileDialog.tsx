
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
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("No active session found");
        return;
      }
      
      // Call the appropriate table based on user type
      const table = userType === 'business' ? 'businesses' : 'profiles';
      const idField = userType === 'business' ? 'businesses_id' : 'id';
      
      // First, fetch the user data
      const { data: userData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq(idField, session.user.id)
        .single();
        
      if (fetchError) {
        console.error("Error fetching user data:", fetchError);
        throw fetchError;
      }
      
      // Save the data to the gdpr_deleted_data table
      const { error: insertError } = await supabase
        .from('gdpr_deleted_data')
        .insert({
          user_id: session.user.id,
          user_type: userType,
          data: userData,
          deleted_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error("Error saving deleted data:", insertError);
        throw insertError;
      }
      
      // Now delete/anonymize the data in the original table
      if (userType === 'business') {
        const { error: deleteError } = await supabase
          .from('businesses')
          .update({
            company_name: 'Deleted Account',
            contact_email: null,
            contact_phone: null,
            is_anonymized: true
          })
          .eq('businesses_id', session.user.id);
          
        if (deleteError) throw deleteError;
      } else {
        const { error: deleteError } = await supabase
          .from('profiles')
          .update({
            first_name: 'Deleted',
            last_name: 'Account',
            email: null,
            skills: null,
            is_anonymized: true
          })
          .eq('id', session.user.id);
          
        if (deleteError) throw deleteError;
      }
      
      toast.success("Profile deleted successfully");
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to home page
      navigate('/');
      
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("Failed to delete profile");
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Profile</DialogTitle>
          <DialogDescription>
            This will permanently delete your profile. All your data will be removed and cannot be recovered.
          </DialogDescription>
        </DialogHeader>
        <p className="text-destructive">
          Are you sure you want to delete your profile? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
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
