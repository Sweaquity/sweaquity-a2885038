
import { useEffect, useState } from "react";
import { CVUploadCard } from "./cv/CVUploadCard";
import { SkillsCard } from "./skills/SkillsCard";
import { CareerHistoryCard } from "./career/CareerHistoryCard";
import { ProfileEditor } from "./profile/ProfileEditor";
import { Profile, Skill } from "@/types/jobSeeker";
import { CVFile, useCVData } from "@/hooks/job-seeker/useCVData";

interface ProfileSectionProps {
  profile?: Profile;
  cvUrl?: string | null;
  parsedCvData?: any;
  skills?: Skill[];
  onSkillsUpdate?: (skills: Skill[]) => void;
}

export const ProfileSection = ({
  profile,
  cvUrl = null,
  parsedCvData = {},
  skills = [],
  onSkillsUpdate = () => {}
}: ProfileSectionProps) => {
  const [userCVs, setUserCVs] = useState<CVFile[]>([]);
  const { loadCVData, userCVs: hookUserCVs } = useCVData();
  
  useEffect(() => {
    // Load user's CVs if profile exists
    const loadData = async () => {
      if (profile) {
        try {
          await loadCVData(profile.id);
          
          // If hook has CVs, use them
          if (hookUserCVs.length > 0) {
            setUserCVs(hookUserCVs);
          }
        } catch (error) {
          console.error("Error loading CV data:", error);
        }
      }
    };
    
    loadData();
  }, [profile, loadCVData, hookUserCVs]);
  
  // Set hook's userCVs if they change
  useEffect(() => {
    if (hookUserCVs.length > 0) {
      setUserCVs(hookUserCVs);
    }
  }, [hookUserCVs]);
  
  const handleCvListUpdated = async () => {
    if (profile) {
      try {
        await loadCVData(profile.id);
      } catch (error) {
        console.error("Error updating CV list:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <ProfileEditor profile={profile} />
      <CVUploadCard 
        cvUrl={cvUrl}
        parsedCvData={parsedCvData}
        userCVs={userCVs}
        onCvListUpdated={handleCvListUpdated}
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
