
import { EquityProject, SubTask } from "@/types/jobSeeker";
import { ProjectCard } from "./ProjectCard";

interface ProjectsListProps {
  projects: EquityProject[];
  userSkillStrings: string[];
  onApply: (project: EquityProject, task: SubTask) => void;
}

export const ProjectsList = ({ projects, userSkillStrings, onApply }: ProjectsListProps) => {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          userSkillStrings={userSkillStrings}
          onApply={onApply}
        />
      ))}
    </div>
  );
};
