
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JobApplication, Skill, SkillRequirement } from "@/types/jobSeeker";

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserSkills = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('skills')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (data?.skills && Array.isArray(data.skills)) {
          setUserSkills(data.skills);
        }
      } catch (error) {
        console.error('Error fetching user skills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSkills();
  }, []);

  const getMatchedSkills = (application: JobApplication): string[] => {
    if (!application.business_roles?.skill_requirements || 
        !Array.isArray(application.business_roles.skill_requirements) || 
        !userSkills || !Array.isArray(userSkills)) {
      return [];
    }

    const requiredSkills = application.business_roles.skill_requirements;
    
    return userSkills.map(skill => {
      // Ensure skill is an object with a skill property
      if (typeof skill === 'object' && skill !== null && 'skill' in skill) {
        return String(skill.skill).toLowerCase();
      }
      return '';
    }).filter(Boolean)
    .filter(userSkill => 
      requiredSkills.some(reqSkill => {
        if (typeof reqSkill === 'string') {
          return reqSkill.toLowerCase() === userSkill;
        }
        if (typeof reqSkill === 'object' && reqSkill !== null && 'skill' in reqSkill) {
          return String(reqSkill.skill).toLowerCase() === userSkill;
        }
        return false;
      })
    );
  };

  return { userSkills, loading, getMatchedSkills };
};
