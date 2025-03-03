
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Skill } from '@/types/jobSeeker';

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserSkills = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('No user session found');
        }

        // Try to get skills from the profile first
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('skills')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileData?.skills) {
          let parsedSkills: Skill[] = [];
          
          if (typeof profileData.skills === 'string') {
            try {
              parsedSkills = JSON.parse(profileData.skills);
            } catch (e) {
              console.error("Error parsing skills string:", e);
            }
          } else if (Array.isArray(profileData.skills)) {
            parsedSkills = profileData.skills;
          } else if (typeof profileData.skills === 'object') {
            // Handle object-like skills
            parsedSkills = Object.values(profileData.skills);
          }
          
          // Normalize skills for consistent format
          parsedSkills = parsedSkills.map(skill => {
            if (typeof skill === 'string') {
              return { skill, level: 'Intermediate' };
            }
            if (typeof skill === 'object' && skill !== null && 'skill' in skill) {
              return {
                skill: String(skill.skill),
                level: 'level' in skill && typeof skill.level === 'string' 
                  ? skill.level 
                  : 'Intermediate'
              };
            }
            return { skill: 'Unknown Skill', level: 'Intermediate' };
          });
          
          setUserSkills(parsedSkills);
        } else {
          // Fallback to CV parsed data if profile skills are not available
          const { data: cvData, error: cvError } = await supabase
            .from('cv_parsed_data')
            .select('skills')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (cvError) throw cvError;

          if (cvData?.skills) {
            const formattedSkills = cvData.skills.map((skill: string) => ({
              skill,
              level: 'Intermediate'
            }));
            setUserSkills(formattedSkills);
          }
        }
      } catch (error) {
        console.error('Error fetching user skills:', error);
        setUserSkills([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSkills();
  }, []);

  // Function to get skills as lowercase strings for comparison
  const getSkillsLowerCase = (): string[] => {
    return userSkills.map(skillItem => {
      if (typeof skillItem === 'string') {
        return skillItem.toLowerCase();
      }
      
      if (typeof skillItem === 'object' && skillItem !== null) {
        if ('skill' in skillItem && typeof skillItem.skill === 'string') {
          return skillItem.skill.toLowerCase();
        }
      }
      
      return '';
    }).filter(s => s !== '');
  };

  // Function to check if the user has a specific skill
  const hasSkill = (requiredSkill: string | { skill: string; level?: string }): boolean => {
    const userSkillsLower = getSkillsLowerCase();
    
    if (typeof requiredSkill === 'string') {
      return userSkillsLower.includes(requiredSkill.toLowerCase());
    }
    
    if (typeof requiredSkill === 'object' && requiredSkill !== null) {
      if ('skill' in requiredSkill && typeof requiredSkill.skill === 'string') {
        return userSkillsLower.includes(requiredSkill.skill.toLowerCase());
      }
    }
    
    return false;
  };
  
  // Get matched skills from a list of required skills
  const getMatchedSkills = (requiredSkills: Array<string | { skill: string; level?: string }>): string[] => {
    if (!requiredSkills || requiredSkills.length === 0) return [];
    
    const userSkillsLower = getSkillsLowerCase();
    
    return requiredSkills
      .filter(requiredSkill => {
        if (typeof requiredSkill === 'string') {
          return userSkillsLower.includes(requiredSkill.toLowerCase());
        }
        
        if (typeof requiredSkill === 'object' && requiredSkill !== null) {
          if ('skill' in requiredSkill && typeof requiredSkill.skill === 'string') {
            return userSkillsLower.includes(requiredSkill.skill.toLowerCase());
          }
        }
        
        return false;
      })
      .map(skill => {
        if (typeof skill === 'string') return skill;
        if (typeof skill === 'object' && skill !== null && 'skill' in skill) {
          return String(skill.skill);
        }
        return '';
      })
      .filter(s => s !== '');
  };

  return { 
    userSkills, 
    isLoading, 
    hasSkill,
    getMatchedSkills
  };
};
