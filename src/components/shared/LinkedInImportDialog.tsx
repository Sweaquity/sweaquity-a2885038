
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
import { Linkedin } from "lucide-react";
import { Skill } from "@/types/jobSeeker";

interface LinkedInImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinkedInImportDialog = ({ isOpen, onClose }: LinkedInImportDialogProps) => {
  const [isImporting, setIsImporting] = useState(false);

  const importLinkedInSkills = async () => {
    try {
      setIsImporting(true);
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("No active session found");
        return;
      }
      
      // Call the LinkedIn API endpoint function to get skills
      const { data, error } = await supabase.functions.invoke('linkedin-skills-import', {
        body: { user_id: session.user.id }
      });
      
      if (error) throw error;
      
      if (!data || !data.skills || data.skills.length === 0) {
        toast.info("No skills found in your LinkedIn profile");
        return;
      }
      
      // Format the skills in the required format
      const formattedSkills: Skill[] = data.skills.map((skill: string) => ({
        skill,
        level: "Intermediate" // Default level as LinkedIn doesn't provide skill levels
      }));
      
      // Get existing skills
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('skills')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Merge existing skills with new ones, avoiding duplicates
      let existingSkills: Skill[] = [];
      if (profileData.skills) {
        try {
          existingSkills = typeof profileData.skills === 'string' 
            ? JSON.parse(profileData.skills) 
            : profileData.skills;
        } catch (e) {
          console.error("Error parsing existing skills:", e);
        }
      }
      
      // Create a map of existing skills to check for duplicates
      const existingSkillsMap = new Map(
        existingSkills.map(skill => [skill.skill.toLowerCase(), skill])
      );
      
      // Add only new skills
      formattedSkills.forEach(skill => {
        if (!existingSkillsMap.has(skill.skill.toLowerCase())) {
          existingSkills.push(skill);
        }
      });
      
      // Update the profile with the merged skills
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          skills: existingSkills,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
        
      if (updateError) throw updateError;
      
      toast.success(`Successfully imported ${formattedSkills.length} skills from LinkedIn`);
      onClose();
      
      // Reload the page to reflect changes
      window.location.reload();
      
    } catch (error) {
      console.error("Error importing LinkedIn skills:", error);
      toast.error("Failed to import skills from LinkedIn");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Skills from LinkedIn</DialogTitle>
          <DialogDescription>
            Import your professional skills from your LinkedIn profile
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <p className="mb-4">
            This will import your skills from LinkedIn and add them to your profile. 
            Any skills that already exist in your profile will not be duplicated.
          </p>
          
          <div className="flex justify-center">
            <Button 
              onClick={importLinkedInSkills}
              disabled={isImporting}
              className="flex items-center gap-2"
            >
              <Linkedin className="h-4 w-4" />
              {isImporting ? "Importing..." : "Import Skills from LinkedIn"}
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
