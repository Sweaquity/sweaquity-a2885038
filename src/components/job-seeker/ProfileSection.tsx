
import { useEffect, useState } from "react";
import { CVUploadCard } from "./cv/CVUploadCard";
import { SkillsCard } from "./skills/SkillsCard";
import { CareerHistoryCard } from "./career/CareerHistoryCard";
import { ProfileEditor } from "./profile/ProfileEditor";
import { Profile, Skill } from "@/types/jobSeeker";
import { CVFile, useCVData } from "@/hooks/job-seeker/useCVData";
import { supabase } from "@/lib/supabase";

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
  
  useEffect(() => {
    // Load user's CVs if profile exists
    const loadUserCVs = async () => {
      if (profile) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: cvData } = await supabase.storage
              .from('cvs')
              .list(session.user.id);
              
            if (cvData) {
              const filesWithDefault = cvData.map(file => ({
                ...file,
                isDefault: cvUrl ? cvUrl.includes(file.name) : false
              }));
              
              setUserCVs(filesWithDefault);
            }
          }
        } catch (error) {
          console.error("Error loading user CVs:", error);
        }
      }
    };
    
    loadUserCVs();
  }, [profile, cvUrl]);
  
  const handleCvListUpdated = async () => {
    if (profile) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: cvData } = await supabase.storage
            .from('cvs')
            .list(session.user.id);
            
          if (cvData) {
            // Get the updated CV URL
            const { data: profileData } = await supabase
              .from('profiles')
              .select('cv_url')
              .eq('id', session.user.id)
              .maybeSingle();
              
            const updatedCvUrl = profileData?.cv_url || null;
            
            const filesWithDefault = cvData.map(file => ({
              ...file,
              isDefault: updatedCvUrl ? updatedCvUrl.includes(file.name) : false
            }));
            
            setUserCVs(filesWithDefault);
          }
        }
      } catch (error) {
        console.error("Error updating user CVs list:", error);
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
