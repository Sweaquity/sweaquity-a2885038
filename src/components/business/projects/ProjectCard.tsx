
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { TaskList } from "./TaskList";
import { Link } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  hours_logged: number;
  equity_earned: number;
  equity_allocation: number;
  timeframe: string;
  skills_required: string[];
  skill_requirements: any[];
  dependencies: string[];
}

interface Project {
  project_id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  skills_required: string[];
  project_timeframe: string;
  tasks: Task[];
}

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export const ProjectCard = ({ project, onEdit, onDelete }: ProjectCardProps) => {
  const handleTaskDeleted = (taskId: string) => {
    // This will be handled by the parent's onProjectUpdated
    const updatedTasks = project.tasks.filter(task => task.id !== taskId);
    onEdit({ ...project, tasks: updatedTasks });
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    const updatedTasks = project.tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    onEdit({ ...project, tasks: updatedTasks });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium">
              <Link 
                to={`/projects/${project.project_id}`}
                className="text-blue-600 hover:underline hover:text-blue-800"
              >
                {project.title}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(project.project_id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Equity: {project.equity_allocation}%</span>
            <span className="text-sm text-muted-foreground">Timeframe: {project.project_timeframe}</span>
          </div>
          <div className="mt-2">
            <p className="text-sm font-medium">Required Skills:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {project.skills_required.map(skill => (
                <span key={skill} className="px-2 py-1 bg-secondary rounded-full text-xs">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TaskList 
          projectId={project.project_id}
          tasks={project.tasks}
          onTaskDeleted={handleTaskDeleted}
          onTaskUpdated={handleTaskUpdated}
          availableSkills={project.skills_required}
          totalEquity={project.equity_allocation}
        />
      </CardContent>
    </Card>
  );
};
