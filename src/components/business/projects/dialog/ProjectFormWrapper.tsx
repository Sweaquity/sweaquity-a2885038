
import { ProjectForm } from "../ProjectForm";

interface Project {
  project_id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  skills_required: string[];
  project_timeframe: string;
  tasks: any[];
}

interface ProjectFormWrapperProps {
  project: Project;
  onProjectUpdate: (updatedData: Partial<Project>) => void;
}

export const ProjectFormWrapper = ({ 
  project, 
  onProjectUpdate 
}: ProjectFormWrapperProps) => {
  return (
    <ProjectForm
      initialData={project}
      onSubmit={onProjectUpdate}
      submitLabel="Update Project"
    />
  );
};
