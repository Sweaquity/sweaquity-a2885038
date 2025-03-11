
import { ProfileCompletionForm } from "@/components/job-seeker/ProfileCompletionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const ProfileCompletePage = () => {
  const navigate = useNavigate();

  const handleBackClick = async () => {
    try {
      // Sign out the user
      await supabase.auth.signOut();
      // Navigate to the login page
      toast.success("Signed out successfully");
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="p-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackClick}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Button>
      </div>
      <ProfileCompletionForm />
    </div>
  );
};

export default ProfileCompletePage;
