
import { CVUploadCard } from "./cv/CVUploadCard";
import { SkillsCard } from "./skills/SkillsCard";
import { CareerHistoryCard } from "./career/CareerHistoryCard";
import { EducationCard } from "./career/EducationCard";
import { ProfileEditor } from "./profile/ProfileEditor";
import { CurrentPositionCard } from "./career/CurrentPositionCard";
import { CareerHistoryDisplay } from "./career/CareerHistoryDisplay";
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
  onCvListUpdated = () => {}
}: ProfileSectionProps) => {
  // Extract current position (first item from career history if available)
  const currentPosition = parsedCvData?.career_history && 
                         Array.isArray(parsedCvData.career_history) && 
                         parsedCvData.career_history.length > 0 
                           ? parsedCvData.career_history[0] 
                           : null;

  return (
    <div className="space-y-6">
      <ProfileEditor profile={profile} />
      <CVUploadCard 
        cvUrl={cvUrl}
        parsedCvData={parsedCvData}
        userCVs={userCVs}
        onCvListUpdated={onCvListUpdated}
      />
      {currentPosition && (
        <CurrentPositionCard currentPosition={currentPosition} />
      )}
      <SkillsCard 
        skills={skills}
        onSkillsUpdate={onSkillsUpdate}
      />
      <CareerHistoryDisplay
        careerHistory={parsedCvData?.career_history || []}
        skills={skills}
        education={parsedCvData?.education || []}
      />
    </div>
  );
};
