
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Skill } from "@/types/jobSeeker";

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserSkills = async () => {
      try {
        setIsLoading(true);
        
        // Get current user's ID
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return;
        }
        
        // Fetch user's skills from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('skills')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error("Error fetching user skills:", error);
          return;
        }
        
        // If skills are found, format them
        if (data && data.skills) {
          let formattedSkills: Skill[] = [];
          
          // Handle different formats of skills data
          if (Array.isArray(data.skills)) {
            formattedSkills = data.skills.map((skill: any) => {
              if (typeof skill === 'string') {
                return { skill, level: 'Intermediate' } as Skill;
              } else if (typeof skill === 'object' && skill.skill) {
                return {
                  skill: skill.skill,
                  level: skill.level || 'Intermediate'
                } as Skill;
              }
              return null;
            }).filter(Boolean) as Skill[];
          } else if (typeof data.skills === 'object') {
            // Handle object format (unlikely but possible)
            const skills = data.skills as Record<string, any>;
            formattedSkills = Object.keys(skills).map(key => ({
              skill: key,
              level: skills[key] || 'Intermediate'
            } as Skill));
          }
          
          setUserSkills(formattedSkills);
        }
      } catch (error) {
        console.error("Error in useUserSkills:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserSkills();
  }, []);
  
  // Helper function to normalize skill name for comparison
  const normalizeSkill = (skill: string): string => {
    if (typeof skill === 'string') {
      return skill.toLowerCase().trim();
    }
    return '';
  };
  
  // Check if the user has a specific skill
  const hasSkill = (skillName: string): boolean => {
    if (!skillName) return false;
    
    const normalizedName = normalizeSkill(skillName);
    return userSkills.some(userSkill => {
      const normalizedUserSkill = typeof userSkill === 'string' 
        ? normalizeSkill(userSkill)
        : normalizeSkill(userSkill.skill);
      return normalizedUserSkill === normalizedName;
    });
  };

  return {
    userSkills,
    isLoading,
    hasSkill
  };
};
