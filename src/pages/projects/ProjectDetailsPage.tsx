
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const ProjectDetailsPage = () => {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) {
        setError("No project ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('business_projects')
          .select(`
            *,
            project_sub_tasks (
              *,
              skill_requirements
            )
          `)
          .eq('project_id', projectId)
          .single();

        if (error) throw error;

        if (!data) {
          setError("Project not found");
          setIsLoading(false);
          return;
        }

        setProject(data);
        setTasks(data.project_sub_tasks || []);
      } catch (error) {
        console.error("Error fetching project details:", error);
        setError("Failed to load project details");
        toast.error("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading project details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Project Not Found</h2>
            <p>The project you're looking for doesn't exist or has been removed.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{project.title}</h2>
        <p>{project.description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Status:</span>
            <Badge variant={project.status === 'active' ? 'success' : 'secondary'}>
              {project.status}
            </Badge>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Equity Allocation:</span>
            <Badge variant="outline">{project.equity_allocation}%</Badge>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Timeframe:</span>
            <Badge variant="outline">{project.project_timeframe}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-sm font-medium mb-4">Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground">No tasks available for this project.</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.task_id} className="border rounded-md p-4">
                <h4 className="text-md font-medium">{task.title}</h4>
                <p className="mt-1 text-sm">{task.description}</p>
                <div className="mt-2">
                  <h3 className="text-sm font-medium">Skills Required</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {task.skill_requirements?.map((skill, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {typeof skill === 'string' ? skill : `${skill.skill} (${skill.level})`}
                      </Badge>
                    ))}
                    {(!task.skill_requirements || task.skill_requirements.length === 0) && (
                      <p className="text-xs text-muted-foreground">No specific skills required</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <Badge variant="outline">{task.equity_allocation}% equity</Badge>
                    <Badge variant="outline">{task.timeframe}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsPage;
