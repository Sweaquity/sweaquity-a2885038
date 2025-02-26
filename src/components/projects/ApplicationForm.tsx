
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ApplicationFormProps {
  projectId: string;
  taskId?: string;  // Made optional since we might apply to project or task
  hasStoredCV: boolean;
  storedCVUrl: string | null;
  onApplicationSubmitted: () => void;
}

export const ApplicationForm = ({
  projectId,
  taskId,
  hasStoredCV,
  storedCVUrl,
  onApplicationSubmitted,
}: ApplicationFormProps) => {
  const [applicationMessage, setApplicationMessage] = useState("");
  const [newCV, setNewCV] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useStoredCV, setUseStoredCV] = useState(hasStoredCV);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size should be less than 10MB");
        return;
      }
      setNewCV(file);
    }
  };

  const handleApply = async () => {
    if (!applicationMessage.trim()) {
      toast.error("Please provide an application message");
      return;
    }

    if (!useStoredCV && !newCV) {
      toast.error("Please attach a CV");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("Please sign in to apply");
        return;
      }

      let cvUrl = useStoredCV ? storedCVUrl : null;

      if (newCV) {
        const fileName = `${session.user.id}/${Date.now()}-${newCV.name}`;
        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(fileName, newCV);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cvs')
          .getPublicUrl(fileName);

        cvUrl = publicUrl;
      }

      // Create project-level application if no taskId
      const applicationData = {
        user_id: session.user.id,
        project_id: projectId,
        task_id: taskId || null,
        message: applicationMessage,
        cv_url: cvUrl,
        status: 'pending'
      };

      const { error: applicationError } = await supabase
        .from('job_applications')
        .insert(applicationData);

      if (applicationError) throw applicationError;

      toast.success("Application submitted successfully");
      onApplicationSubmitted();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>CV Upload</Label>
        <div className="space-y-4">
          {hasStoredCV && (
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="stored-cv"
                name="cv-choice"
                checked={useStoredCV}
                onChange={() => {
                  setUseStoredCV(true);
                  setNewCV(null);
                }}
              />
              <Label htmlFor="stored-cv">Use stored CV</Label>
            </div>
          )}
          <div className="flex items-start gap-2">
            <input
              type="radio"
              id="new-cv"
              name="cv-choice"
              checked={!useStoredCV}
              onChange={() => setUseStoredCV(false)}
            />
            <div className="space-y-2">
              <Label htmlFor="new-cv">Upload new CV</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Application Message</Label>
        <Textarea
          placeholder="Tell us why you're interested in this opportunity and how your skills match the requirements..."
          value={applicationMessage}
          onChange={(e) => setApplicationMessage(e.target.value)}
          className="min-h-[200px]"
          disabled={isSubmitting}
        />
      </div>

      <Button 
        onClick={handleApply}
        disabled={isSubmitting || (!useStoredCV && !newCV) || !applicationMessage.trim()}
      >
        {isSubmitting ? "Submitting..." : "Submit Application"}
      </Button>
    </div>
  );
};
