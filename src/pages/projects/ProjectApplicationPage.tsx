
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ApplicationForm } from "@/components/projects/ApplicationForm";

export default function ProjectApplicationPage() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState<any>(null);
  const [taskData, setTaskData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !taskId) {
        navigate("/seeker/dashboard");
        return;
      }

      setIsLoading(true);
      try {
        // Get the project details
        const { data: project, error: projectError } = await supabase
          .from("business_projects")
          .select(`
            *,
            business:businesses (company_name)
          `)
          .eq("id", projectId)
          .single();

        if (projectError) throw projectError;
        setProjectData(project);

        // Get the task details
        const { data: task, error: taskError } = await supabase
          .from("project_sub_tasks")
          .select("*")
          .eq("id", taskId)
          .single();

        if (taskError) throw taskError;
        setTaskData(task);

        // Check if user has already applied for this job
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: applications } = await supabase
            .from("job_applications")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("task_id", taskId);

          setHasApplied(applications && applications.length > 0);

          // Get user's CV URL if they have one
          const { data: profile } = await supabase
            .from("profiles")
            .select("cv_url")
            .eq("id", session.user.id)
            .single();

          if (profile && profile.cv_url) {
            setCvUrl(profile.cv_url);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId, taskId, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!projectData || !taskData) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Project or Task Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The project or task you're looking for doesn't exist or has been removed.
          </p>
          <Button className="mt-4" onClick={() => navigate("/seeker/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <ProjectHeader 
        title={projectData.title}
        companyName={projectData.business?.company_name || "Unknown Company"}
        category={projectData.category}
        deadline={projectData.deadline}
      />

      <div className="mt-8">
        <div className="max-w-3xl mx-auto">
          {hasApplied ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
              <h2 className="font-semibold text-lg text-green-800">Application Submitted</h2>
              <p className="text-green-700 mt-2">
                You have already applied for this position. You can check the status in your dashboard.
              </p>
              <Button className="mt-4" onClick={() => navigate("/seeker/dashboard")}>
                Return to Dashboard
              </Button>
            </div>
          ) : (
            <ApplicationForm 
              projectId={projectId!}
              taskId={taskId!}
              projectTitle={projectData.title}
              taskTitle={taskData.title}
              onCancel={() => navigate(-1)}
              storedCVUrl={cvUrl}
              hasStoredCV={!!cvUrl}
              onApplicationSubmitted={() => {
                setHasApplied(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
