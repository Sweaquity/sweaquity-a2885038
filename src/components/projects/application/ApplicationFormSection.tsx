
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ApplicationForm } from "@/components/projects/ApplicationForm";
import { ProfileSummary } from "./ProfileSummary";
import { SkillsManager } from "./SkillsManager";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skill } from "@/types/jobSeeker";

interface JobSeekerProfile {
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  location: string | null;
  employment_preference: string | null;
  skills: Skill[];
}

interface SubTask {
  id: string;
  title: string;
  skills_required: string[];
  matchScore?: number;
  matchedSkills?: string[];
}

interface ApplicationFormSectionProps {
  projectId: string;
  selectedTaskId: string | null;
  projectTitle: string;
  selectedTask: SubTask | null;
  jobSeekerProfile: JobSeekerProfile | null;
  userSkills: Skill[];
  setUserSkills: (skills: Skill[]) => void;
  updateTasksWithNewSkills: (updatedSkills: Skill[]) => void;
}

export const ApplicationFormSection = ({
  projectId,
  selectedTaskId,
  projectTitle,
  selectedTask,
  jobSeekerProfile,
  userSkills,
  setUserSkills,
  updateTasksWithNewSkills
}: ApplicationFormSectionProps) => {
  const navigate = useNavigate();

  if (!selectedTask) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-xl font-semibold">Submit Application</h3>
      </CardHeader>
      <CardContent>
        {jobSeekerProfile && (
          <>
            <ProfileSummary profile={jobSeekerProfile} />
            <SkillsManager 
              userSkills={userSkills} 
              setUserSkills={setUserSkills}
              selectedTask={selectedTask}
              updateTasksWithNewSkills={updateTasksWithNewSkills}
            />
          </>
        )}
        <ApplicationForm
          projectId={projectId || ''}
          taskId={selectedTaskId || ''}
          projectTitle={projectTitle}
          taskTitle={selectedTask?.title}
          onApplicationSubmitted={() => {
            toast.success("Application submitted successfully");
            navigate("/seeker/dashboard?tab=applications");
          }}
        />
      </CardContent>
    </Card>
  );
};
