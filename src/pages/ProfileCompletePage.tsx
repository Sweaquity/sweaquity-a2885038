
import { ProfileCompletionForm } from "@/components/job-seeker/ProfileCompletionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const ProfileCompletePage = () => {
  const navigate = useNavigate();

  const handleBackClick = async () => {
    // Sign out the user
    await supabase.auth.signOut();
    // Navigate to the login page
    navigate('/');
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
