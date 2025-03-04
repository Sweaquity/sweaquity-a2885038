import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JobApplication, Skill, SkillRequirement } from "@/types/jobSeeker";

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadUserSkills = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('skills')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error("Error loading user skills:", error);
          return;
        }
        
        let skills: Skill[] = [];
        if (data?.skills) {
          if (typeof data.skills === 'string') {
            try {
              skills = JSON.parse(data.skills);
            } catch (e) {
              console.error("Error parsing skills:", e);
            }
          } else {
            skills = data.skills;
          }
        }
        
        setUserSkills(skills || []);
      } catch (error) {
        console.error("Error in useUserSkills:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserSkills();
  }, []);
  
  const hasSkill = (skillName: string): boolean => {
    if (!userSkills || userSkills.length === 0) return false;
    
    return userSkills.some((skill: string | { skill: string }) => {
      if (typeof skill === 'string') {
        return skill.toLowerCase() === skillName.toLowerCase();
      }
      return typeof skill.skill === 'string' && skill.skill.toLowerCase() === skillName.toLowerCase();
    });
  };
  
  const getMatchedSkills = (application?: JobApplication): (string | SkillRequirement)[] => {
    if (!application || !application.business_roles || !application.business_roles.skill_requirements) {
      return [];
    }
    
    const requiredSkills = application.business_roles.skill_requirements;
    
    return userSkills.filter(userSkill => {
      const userSkillName = typeof userSkill === 'string' ? userSkill : userSkill.skill;
      
      return requiredSkills.some(reqSkill => {
        let reqSkillName: string = '';
        
        if (typeof reqSkill === 'string') {
          reqSkillName = reqSkill;
        } else if (reqSkill && typeof reqSkill === 'object' && 'skill' in reqSkill) {
          reqSkillName = reqSkill.skill || '';
        }
        
        if (typeof userSkillName === 'string' && reqSkillName) {
          return userSkillName.toLowerCase() === reqSkillName.toLowerCase();
        }
        return false;
      });
    }).map(skill => typeof skill === 'string' ? skill : { skill: skill.skill, level: skill.level });
  };
  
  return {
    userSkills,
    isLoading,
    hasSkill,
    getMatchedSkills
  };
};
