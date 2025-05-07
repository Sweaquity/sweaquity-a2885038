
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNDAIntegration } from "@/hooks/useNDAIntegration";
import { DocumentViewer } from "@/components/documents/DocumentViewer";

interface ApplicationFormProps {
  projectId: string;
  taskId: string;
  projectTitle?: string;
  taskTitle?: string;
}

export const ApplicationForm = ({
  projectId,
  taskId,
  projectTitle = "Project",
  taskTitle = "Role"
}: ApplicationFormProps) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");
  const [ndaDocumentId, setNdaDocumentId] = useState<string | null>(null);
  const [ndaDocument, setNdaDocument] = useState<any>(null);
  const [ndaStatus, setNdaStatus] = useState<string | null>(null);
  const [requiresNDA, setRequiresNDA] = useState<boolean>(false);
  const navigate = useNavigate();
  
  const { 
    isProcessingNDA,
    checkNDARequirement,
    getNDAForJobApplication,
    generateApplicationNDA 
  } = useNDAIntegration();

  // Get business ID for the project
  useEffect(() => {
    const getBusinessId = async () => {
      try {
        const { data, error } = await supabase
          .from("business_projects")
          .select("business_id")
          .eq("project_id", projectId)
          .single();

        if (error) throw error;
        if (data) setBusinessId(data.business_id);
        
        // Check if project requires NDA
        const needsNDA = await checkNDARequirement(projectId);
        setRequiresNDA(needsNDA);
      } catch (error) {
        console.error("Error fetching project business ID:", error);
      }
    };

    if (projectId) getBusinessId();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId || !taskId) {
      toast.error("Missing project or task information");
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to apply");
        return;
      }

      // Create job application
      const { data: applicationData, error: applicationError } = await supabase
        .from("job_applications")
        .insert({
          user_id: session.user.id,
          task_id: taskId,
          project_id: projectId,
          message,
          status: "pending",
          applied_at: new Date().toISOString()
        })
        .select("job_app_id")
        .single();

      if (applicationError) throw applicationError;
      
      // If project requires NDA, generate it
      if (requiresNDA && applicationData?.job_app_id && businessId) {
        await generateApplicationNDA(
          applicationData.job_app_id,
          businessId,
          session.user.id,
          projectId
        );
      }

      toast.success("Application submitted successfully");
      navigate("/seeker/dashboard?tab=applications");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-2">
          Apply to: {taskTitle}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Project: {projectTitle}
        </p>
        
        {requiresNDA && (
          <div className="mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
              <h3 className="text-sm font-medium text-amber-800 mb-1">
                Non-Disclosure Agreement Required
              </h3>
              <p className="text-sm text-amber-700">
                This project requires a Non-Disclosure Agreement (NDA). By submitting your application, an NDA will be automatically generated for you to review and sign.
              </p>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="message" className="block text-sm font-medium mb-2">
            Application Message
          </label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe why you're a good fit for this role and any relevant experience you have."
            className="min-h-[150px]"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting || isProcessingNDA}
          >
            {(isSubmitting || isProcessingNDA) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isProcessingNDA ? "Generating NDA..." : "Submitting..."}
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
