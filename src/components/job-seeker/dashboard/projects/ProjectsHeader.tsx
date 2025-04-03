
import React from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, KanbanSquare, BarChart2 } from "lucide-react";

interface ProjectsHeaderProps {
  projects: any[];
  selectedProject: string;
  showKanban: boolean;
  showGantt: boolean;
  onProjectChange: (projectId: string) => void;
  onToggleKanban: () => void;
  onToggleGantt: () => void;
  onRefresh: () => void;
  onCreateTicket: () => void;
}

export const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({
  projects,
  selectedProject,
  showKanban,
  showGantt,
  onProjectChange,
  onToggleKanban,
  onToggleGantt,
  onRefresh,
  onCreateTicket
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <Select value={selectedProject} onValueChange={onProjectChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projects.length === 0 ? (
            <SelectItem value="none" disabled>No projects available</SelectItem>
          ) : (
            projects.map(project => (
              <SelectItem key={project.project_id} value={project.project_id}>
                {project.project_title}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant={showKanban ? "default" : "outline"} 
          onClick={onToggleKanban}
        >
          <KanbanSquare className="h-4 w-4 mr-1" /> 
          {showKanban ? "Hide Kanban" : "Show Kanban"}
        </Button>
        
        <Button 
          size="sm" 
          variant={showGantt ? "default" : "outline"} 
          onClick={onToggleGantt}
        >
          <BarChart2 className="h-4 w-4 mr-1" /> 
          {showGantt ? "Hide Gantt" : "Show Gantt"}
        </Button>
        
        <Button size="sm" variant="outline" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
        
        <Button size="sm" onClick={onCreateTicket}>
          Create Ticket
        </Button>
      </div>
    </div>
  );
};
