
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { listUserCVs } from "@/utils/setupStorage";

interface ApplicationFormProps {
  projectId: string;
  taskId: string;
  projectTitle?: string;
  taskTitle?: string;
  onCancel?: () => void;
  hasStoredCV?: boolean;
  storedCVUrl?: string | null;
  onApplicationSubmitted?: () => void;
}

export const ApplicationForm = ({
  projectId,
  taskId,
  projectTitle,
  taskTitle,
  onCancel,
  hasStoredCV,
  storedCVUrl,
  onApplicationSubmitted,
}: ApplicationFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [availableCvs, setAvailableCvs] = useState<Array<{name: string, url: string, isDefault: boolean}>>([]);
  const [selectedCvUrl, setSelectedCvUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserCVs = async () => {
      try {
        setIsLoading(true);
        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast.error("You must be logged in to apply");
          return;
        }

        const userId = session.user.id;

        // Get user's default CV URL
        const { data: profileData } = await supabase
          .from('profiles')
          .select('cv_url')
          .eq('id', userId)
          .maybeSingle();

        const defaultCvUrl = profileData?.cv_url || null;

        // Try to list CVs, handle gracefully if bucket doesn't exist
        try {
          const cvFiles = await listUserCVs(userId);
          
          if (cvFiles.length > 0) {
            const cvs = await Promise.all(cvFiles.map(async (file) => {
              const { data } = supabase.storage
                .from('cvs')
                .getPublicUrl(`${userId}/${file.name}`);
                
              return {
                name: file.name,
                url: data.publicUrl,
                isDefault: defaultCvUrl ? defaultCvUrl === data.publicUrl : false
              };
            }));
            
            setAvailableCvs(cvs);
            
            // Select the default CV if available
            if (defaultCvUrl) {
              setSelectedCvUrl(defaultCvUrl);
            } else if (cvs.length > 0) {
              setSelectedCvUrl(cvs[0].url);
            }
          }
        } catch (error) {
          // If we can't access CVs, just use the default CV if available
          console.error("Error accessing CV bucket:", error);
          if (defaultCvUrl) {
            setSelectedCvUrl(defaultCvUrl);
            setAvailableCvs([{
              name: defaultCvUrl.split('/').pop() || "Default CV",
              url: defaultCvUrl,
              isDefault: true
            }]);
          }
        }
      } catch (error) {
        console.error("Error loading CVs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserCVs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to apply");
        return;
      }
      
      const userId = session.user.id;
      
      // Validate IDs are not empty before submission
      if (!projectId || projectId.trim() === '') {
        throw new Error("Project ID is missing or invalid");
      }
      
      if (!taskId || taskId.trim() === '') {
        throw new Error("Task ID is missing or invalid");
      }
      
      console.log("Submitting application with:", {
        projectId,
        taskId,
        userId,
        message,
        selectedCvUrl
      });
      
      // Submit the application - using the message field instead of notes
      const { error } = await supabase.from("job_applications").insert({
        project_id: projectId,
        task_id: taskId,
        user_id: userId,
        message: message, // Use message field
        cv_url: selectedCvUrl,
        status: 'pending'
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Application submitted successfully!");
      
      if (onApplicationSubmitted) {
        onApplicationSubmitted();
      } else {
        navigate("/seeker/dashboard");
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(projectTitle || taskTitle) && (
        <div>
          <h3 className="text-lg font-medium">Apply for: {taskTitle}</h3>
          {projectTitle && <p className="text-sm text-muted-foreground mt-1">Project: {projectTitle}</p>}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="message">Message to Project Owner</Label>
        <Textarea
          id="message"
          placeholder="Introduce yourself and explain why you're a good fit for this role..."
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label>Select CV to Attach</Label>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading CVs...</span>
          </div>
        ) : availableCvs.length > 0 ? (
          <div className="space-y-2 border rounded-md p-3">
            {availableCvs.map((cv) => (
              <div key={cv.url} className="flex items-center space-x-2">
                <Checkbox 
                  id={`cv-${cv.name}`}
                  checked={selectedCvUrl === cv.url}
                  onCheckedChange={() => setSelectedCvUrl(cv.url)}
                />
                <Label htmlFor={`cv-${cv.name}`} className="text-sm">
                  {cv.name}
                  {cv.isDefault && <span className="text-xs text-muted-foreground ml-2">(Default)</span>}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-amber-600 border border-amber-200 bg-amber-50 p-3 rounded">
            You don't have any CVs uploaded. Please upload a CV in your profile before applying.
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting || !selectedCvUrl || message.trim().length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </div>
    </form>
  );
};
