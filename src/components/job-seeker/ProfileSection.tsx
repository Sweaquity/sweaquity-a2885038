
import { CVUploadCard } from "./cv/CVUploadCard";
import { SkillsCard } from "./skills/SkillsCard";
import { CareerHistoryCard } from "./career/CareerHistoryCard";

interface ProfileSectionProps {
  cvUrl: string | null;
  parsedCvData: any;
  skills: string[];
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSkillsUpdate: (skills: string[]) => void;
}

export const ProfileSection = ({
  cvUrl,
  parsedCvData,
  skills,
  handleFileUpload,
  onSkillsUpdate,
}: ProfileSectionProps) => {
  return (
    <div className="space-y-6">
      <CVUploadCard 
        cvUrl={cvUrl}
        parsedCvData={parsedCvData}
        handleFileUpload={handleFileUpload}
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
