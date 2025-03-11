
import { CVUploadCard } from "./cv/CVUploadCard";
import { SkillsCard } from "./skills/SkillsCard";
import { CareerHistoryDisplay } from "./career/CareerHistoryDisplay";
import { ProfileEditor } from "./profile/ProfileEditor";
import { CurrentPositionCard } from "./career/CurrentPositionCard";
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
  // Extract current position with better validation
  const currentPosition = parsedCvData?.career_history && 
                         Array.isArray(parsedCvData.career_history) && 
                         parsedCvData.career_history.length > 0 && 
                         typeof parsedCvData.career_history[0] === 'object'
                           ? parsedCvData.career_history[0] 
                           : null;

  return (
    <div className="space-y-6">
      {profile && (
        <ProfileEditor 
          profileData={profile} 
          onProfileUpdate={() => {}} 
        />
      )}
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
      {parsedCvData?.career_history && parsedCvData.career_history.length > 0 && (
        <CareerHistoryDisplay
          careerHistory={parsedCvData.career_history}
          skills={skills}
          education={parsedCvData?.education || []}
        />
      )}
    </div>
  );
};
