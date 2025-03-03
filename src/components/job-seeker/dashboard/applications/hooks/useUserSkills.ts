
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Skill, JobApplication } from '@/types/jobSeeker';

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadUserSkills = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('User not authenticated');
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('skills')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error('Error loading user skills:', error);
          return;
        }
        
        if (data && data.skills) {
          let parsedSkills: Skill[] = [];
          
          if (typeof data.skills === 'string') {
            try {
              parsedSkills = JSON.parse(data.skills);
            } catch (e) {
              console.error('Error parsing skills:', e);
            }
          } else if (Array.isArray(data.skills)) {
            parsedSkills = data.skills;
          }
          
          setUserSkills(parsedSkills.map(skill => {
            if (typeof skill === 'string') {
              return { skill, level: 'Intermediate' };
            }
            return skill;
          }));
        }
      } catch (error) {
        console.error('Error in loadUserSkills:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserSkills();
  }, []);
  
  const hasSkill = (skillName: string): boolean => {
    if (!userSkills || userSkills.length === 0) return false;
    
    const lowerSkillName = skillName.toLowerCase();
    return userSkills.some(skill => {
      const skillToCheck = typeof skill === 'string' 
        ? skill.toLowerCase()
        : skill.skill.toLowerCase();
      return skillToCheck === lowerSkillName;
    });
  };
  
  const getMatchedSkills = (application: JobApplication): string[] => {
    if (!application.business_roles?.skill_requirements || !userSkills || userSkills.length === 0) {
      return [];
    }
    
    const userSkillNames = userSkills.map(skill => {
      return typeof skill === 'string' ? skill.toLowerCase() : skill.skill.toLowerCase();
    });
    
    const matchedSkills: string[] = [];
    
    application.business_roles.skill_requirements.forEach(requirement => {
      let skillName = '';
      
      if (typeof requirement === 'string') {
        skillName = requirement.toLowerCase();
      } else if (requirement && typeof requirement === 'object' && 'skill' in requirement) {
        skillName = requirement.skill.toLowerCase();
      }
      
      if (skillName && userSkillNames.includes(skillName)) {
        matchedSkills.push(skillName);
      }
    });
    
    return matchedSkills;
  };
  
  return { userSkills, isLoading, hasSkill, getMatchedSkills };
};
