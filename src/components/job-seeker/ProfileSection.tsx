
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
  skills?: Skill[];
  userCVs?: CVFile[];
  onSkillsUpdate?: (skills: Skill[]) => void;
  onCvListUpdated?: () => void;
}

export const ProfileSection = ({
  profile,
  cvUrl = null,
  parsedCvData = {},
  skills = [],
  userCVs = [],
  onSkillsUpdate = () => {},
  onCvListUpdated = () => {}
}: ProfileSectionProps) => {
  return (
    <div className="space-y-6">
      <ProfileEditor profile={profile} />
      <CVUploadCard 
        cvUrl={cvUrl}
        parsedCvData={parsedCvData}
        userCVs={userCVs}
        onCvListUpdated={onCvListUpdated}
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
