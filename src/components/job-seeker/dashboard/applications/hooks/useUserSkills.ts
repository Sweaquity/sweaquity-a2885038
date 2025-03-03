import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JobApplication, Skill } from "@/types/jobSeeker";

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserSkills = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('skills')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching skills:', error);
          return;
        }

        // Check if skills exist and parse them
        if (data?.skills) {
          // If skills is a string, parse it
          if (typeof data.skills === 'string') {
            try {
              const parsed = JSON.parse(data.skills);
              setUserSkills(parsed);
            } catch (e) {
              console.error('Error parsing skills JSON:', e);
            }
          } 
          // If skills is already an array
          else if (Array.isArray(data.skills)) {
            const normalizedSkills = data.skills.map(skill => {
              // If skill is a string, convert to object with default level
              if (typeof skill === 'string') {
                return { skill, level: 'Intermediate' };
              }
              // Otherwise return as is
              return skill;
            });
            setUserSkills(normalizedSkills);
          }
        }
      } catch (error) {
        console.error('Error in fetchUserSkills:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSkills();
  }, []);

  const getMatchedSkills = (application?: JobApplication) => {
    if (!application) return [];

    // Get required skills from the application
    const requiredSkills = application.business_roles?.skill_requirements || [];
    
    // Map user skills to just the skill names for easier comparison
    const userSkillNames = userSkills.map(s => 
      typeof s === 'string' ? s.toLowerCase() : (s.skill ? s.skill.toLowerCase() : '')
    ).filter(Boolean);

    // Check which required skills the user has
    const matched = requiredSkills.filter(req => {
      // Handle case where req is a string
      if (typeof req === 'string') {
        return userSkillNames.includes(req.toLowerCase());
      } 
      // Handle case where req is an object with skill property
      else if (req && typeof req === 'object' && 'skill' in req && typeof req.skill === 'string') {
        return userSkillNames.includes(req.skill.toLowerCase());
      }
      return false;
    });

    // Return matched skills
    return matched;
  };

  return {
    userSkills,
    isLoading,
    getMatchedSkills
  };
};
