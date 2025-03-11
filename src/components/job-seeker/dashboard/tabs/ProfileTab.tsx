
import { ProfileSection } from "@/components/job-seeker/ProfileSection";
import { Profile, Skill } from "@/types/jobSeeker";
import { CVFile } from "@/hooks/job-seeker/useCVData";
import { AccountSettingsCard } from "@/components/shared/AccountSettingsCard";

interface ProfileTabProps {
  profile: Profile | null;
  cvUrl: string | null;
  skills: Skill[] | null;
  parsedCvData: any;
  onSkillsUpdate: (updatedSkills: Skill[]) => Promise<void>;
  userCVs?: CVFile[];
  onCvListUpdated?: () => void;
}

export const ProfileTab = ({
  profile,
  cvUrl,
  skills,
  parsedCvData,
  onSkillsUpdate,
  userCVs = [],
  onCvListUpdated = () => {},
}: ProfileTabProps) => {
  return (
    <div className="space-y-6">
      <ProfileSection
        profile={profile}
        cvUrl={cvUrl}
        skills={skills}
        parsedCvData={parsedCvData}
        onSkillsUpdate={onSkillsUpdate}
        setCvUrl={() => {}}
        setParsedCvData={() => {}}
        userCVs={userCVs}
        onCvListUpdated={onCvListUpdated}
      />
      
      {/* Add account settings card at the bottom of the profile tab */}
      <AccountSettingsCard userType="job_seeker" />
    </div>
  );
};
