import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setIsLoading(true);
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

        setProject(data);
        setTasks(data.project_sub_tasks || []);
      } catch (error) {
        console.error("Error fetching project details:", error);
        toast.error("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!project) {
    return <div>No project found.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{project.title}</h2>
        <p>{project.description}</p>
      </CardHeader>
      <CardContent>
        <h3 className="text-sm font-medium">Tasks</h3>
        {tasks.length === 0 ? (
          <p>No tasks available for this project.</p>
        ) : (
          tasks.map((task) => (
            <div key={task.task_id} className="mt-4">
              <h4 className="text-md font-medium">{task.title}</h4>
              <p>{task.description}</p>
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
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsPage;
