
import { ProfileSection } from "@/components/job-seeker/ProfileSection";
import { Profile, Skill } from "@/types/jobSeeker";

interface ProfileTabProps {
  profile: Profile | null;
  cvUrl: string | null;
  skills: Skill[] | null;
  parsedCvData: any;
  onSkillsUpdate: (updatedSkills: Skill[]) => Promise<void>;
}

export const ProfileTab = ({
  profile,
  cvUrl,
  skills,
  parsedCvData,
  onSkillsUpdate,
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
      />
    </div>
  );
};
