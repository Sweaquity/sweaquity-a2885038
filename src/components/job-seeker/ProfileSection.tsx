
import { CVUploadCard } from "./cv/CVUploadCard";
import { SkillsCard } from "./skills/SkillsCard";
import { CareerHistoryCard } from "./career/CareerHistoryCard";
import { ProfileEditor } from "./profile/ProfileEditor";
import { Profile, Skill } from "@/types/jobSeeker";
import { CVFile } from "@/hooks/job-seeker/useCVData";

interface ProfileSectionProps {
  profile?: Profile;
  cvUrl?: string | null;
  parsedCvData?: any;
  setCvUrl?: (url: string | null) => void;
  setParsedCvData?: (data: any) => void;
  skills?: Skill[];
  onSkillsUpdate?: (skills: Skill[]) => void;
  userCVs?: CVFile[];
  onCvListUpdated?: () => void;
  preserveUserSkills?: boolean;
}

export const ProfileSection = ({
  profile,
  cvUrl = null,
  parsedCvData = {},
  setCvUrl = () => {},
  setParsedCvData = () => {},
  skills = [],
  onSkillsUpdate = () => {},
  userCVs = [],
  onCvListUpdated = () => {},
  preserveUserSkills = true // Default to preserving skills
}: ProfileSectionProps) => {
  return (
    <div className="space-y-6">
      <ProfileEditor profile={profile} />
      <CVUploadCard 
        cvUrl={cvUrl}
        parsedCvData={parsedCvData}
        userCVs={userCVs}
        onCvListUpdated={onCvListUpdated}
        preserveUserSkills={preserveUserSkills}
      />
      <SkillsCard 
        skills={skills}
        onSkillsUpdate={onSkillsUpdate}
      />
      <CareerHistoryCard 
        careerHistory={parsedCvData?.career_history || []}
      />
    </div>
  );
};
