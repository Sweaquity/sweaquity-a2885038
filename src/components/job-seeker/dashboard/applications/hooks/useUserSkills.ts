
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JobApplication, SkillRequirement } from "@/types/jobSeeker";

type Skill = string | { skill: string; level: string };

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserSkills = async () => {
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

        if (error) throw error;

        // Safely extract skills and ensure they meet the expected format
        let extractedSkills: Skill[] = [];
        
        if (data?.skills) {
          if (Array.isArray(data.skills)) {
            extractedSkills = data.skills;
          } else if (typeof data.skills === 'object') {
            // Handle case where skills might be an object with numeric keys
            extractedSkills = Object.values(data.skills);
          }
        }
        
        setUserSkills(extractedSkills);
      } catch (error) {
        console.error("Error fetching user skills:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSkills();
  }, []);

  // Function to get matching skills between user skills and job requirements
  const getMatchedSkills = (application: JobApplication): Skill[] => {
    if (!application.business_roles?.skill_requirements) return [];
    
    const requiredSkills = application.business_roles.skill_requirements;
    const matchedSkills: Skill[] = [];
    
    requiredSkills.forEach(req => {
      let reqName: string;
      let reqNameLower: string;
      
      // Handle different formats of skill requirements
      if (typeof req === 'string') {
        reqName = req;
        // Safely use toLowerCase only if reqName is a string
        reqNameLower = typeof reqName === 'string' ? reqName.toLowerCase() : '';
      } else if (req && typeof req === 'object' && 'skill' in req && typeof req.skill === 'string') {
        reqName = req.skill;
        reqNameLower = req.skill.toLowerCase();
      } else {
        return; // Skip this iteration if the skill format is unexpected
      }
      
      // Find matching user skill
      const matchingUserSkill = userSkills.find(userSkill => {
        if (typeof userSkill === 'string') {
          return typeof userSkill === 'string' && userSkill.toLowerCase() === reqNameLower;
        } else if (userSkill && typeof userSkill === 'object' && 'skill' in userSkill) {
          // Type check to ensure skill is a string before using toLowerCase
          return typeof userSkill.skill === 'string' && userSkill.skill.toLowerCase() === reqNameLower;
        }
        return false;
      });
      
      if (matchingUserSkill) {
        matchedSkills.push(matchingUserSkill);
      }
    });
    
    return matchedSkills;
  };

  return { userSkills, isLoading, getMatchedSkills };
};
