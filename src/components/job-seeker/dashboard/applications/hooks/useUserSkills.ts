
import { useState, useEffect } from "react";
import { Skill, JobApplication } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const fetchUserSkills = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('skills')
        .eq('id', session.user.id)
        .single();

      if (error || !data) {
        console.error("Error fetching skills:", error);
        return;
      }

      if (data.skills) {
        let parsedSkills: Skill[] = [];
        
        try {
          if (typeof data.skills === 'string') {
            parsedSkills = JSON.parse(data.skills);
          } else {
            parsedSkills = data.skills;
          }
          
          setUserSkills(parsedSkills);
        } catch (e) {
          console.error("Error parsing skills:", e);
        }
      }
    };

    fetchUserSkills();
  }, []);

  const getMatchedSkills = (application: JobApplication): string[] => {
    if (!application.business_roles?.skill_requirements || 
        !Array.isArray(application.business_roles.skill_requirements) || 
        userSkills.length === 0) {
      return [];
    }

    // Normalize user skills to lowercase strings for comparison
    const userSkillNames = userSkills.map(skill => {
      if (typeof skill === 'string') {
        return skill.toLowerCase();
      }
      
      if (typeof skill === 'object' && skill !== null) {
        if ('skill' in skill && typeof skill.skill === 'string') {
          return skill.skill.toLowerCase();
        }
      }
      
      return '';
    }).filter(Boolean);

    // Normalize role skills to lowercase strings
    const roleSkills = application.business_roles.skill_requirements.map(skill => {
      if (typeof skill === 'string') {
        return skill.toLowerCase();
      }
      
      if (typeof skill === 'object' && skill !== null) {
        if ('skill' in skill && typeof skill.skill === 'string') {
          return skill.skill.toLowerCase();
        }
      }
      
      return '';
    }).filter(Boolean);

    // Get matching skills
    const matchedSkills = roleSkills.filter(roleSkill => 
      userSkillNames.includes(roleSkill)
    );

    return matchedSkills;
  };

  return {
    userSkills,
    getMatchedSkills
  };
};
