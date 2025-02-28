
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
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('cv_url')
            .eq('id', userId)
            .maybeSingle();

          const defaultCvUrl = profileData?.cv_url || null;
          
          // Check if cvs bucket exists
          const { data: buckets } = await supabase.storage.listBuckets();
          const cvsBucketExists = buckets?.some(bucket => bucket.name === 'cvs');
          
          if (cvsBucketExists) {
            // List all of the user's CVs
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
          }
        } catch (error) {
          console.log("Error fetching profile data, this might be expected:", error);
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
      
      // Submit the application - now allowing null for cv_url
      const { error } = await supabase.from("job_applications").insert({
        project_id: projectId,
        task_id: taskId,
        user_id: userId,
        notes: message,
        cv_url: selectedCvUrl, // This can be null now
        message: message // Save the message for displaying later
      });
      
      if (error) {
        throw error;
      }
      
      // Update the task status to 'pending'
      await supabase
        .from("project_sub_tasks")
        .update({ 
          status: 'pending',
          task_status: 'pending'
        })
        .eq("id", taskId);
      
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
        <Label>Select CV to Attach (Optional)</Label>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading CVs...</span>
          </div>
        ) : availableCvs.length > 0 ? (
          <div className="space-y-2 border rounded-md p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox 
                id="no-cv"
                checked={selectedCvUrl === null}
                onCheckedChange={() => setSelectedCvUrl(null)}
              />
              <Label htmlFor="no-cv" className="text-sm">
                No CV (Apply without attaching a CV)
              </Label>
            </div>
            <div className="border-t pt-2">
              {availableCvs.map((cv) => (
                <div key={cv.url} className="flex items-center space-x-2 mt-2">
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
          </div>
        ) : (
          <div className="text-sm text-amber-600 border border-amber-200 bg-amber-50 p-3 rounded">
            You don't have any CVs uploaded. You can still apply without a CV, or upload one in your profile first.
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
          disabled={isSubmitting || message.trim().length === 0}
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
