
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Skill, JobApplication, SkillRequirement } from "@/types/jobSeeker";

export const useUserSkills = (initialSkills?: Skill[]) => {
  const [userSkills, setUserSkills] = useState<Skill[]>(initialSkills || []);

  useEffect(() => {
    if (initialSkills && initialSkills.length > 0) {
      setUserSkills(initialSkills);
      return;
    }

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

        if (data?.skills) {
          let parsedSkills: Skill[] = [];
          
          if (typeof data.skills === 'string') {
            try {
              parsedSkills = JSON.parse(data.skills);
            } catch (e) {
              console.error("Error parsing skills:", e);
            }
          } else if (Array.isArray(data.skills)) {
            parsedSkills = data.skills.map(skill => 
              typeof skill === 'string' ? { skill, level: 'Intermediate' } : skill
            );
          }
          
          setUserSkills(parsedSkills);
        }
      } catch (error) {
        console.error("Error fetching user skills:", error);
      }
    };
    
    fetchUserSkills();
  }, [initialSkills]);

  // Get matched skills from application requirements
  const getMatchedSkills = (application: JobApplication): string[] => {
    // Check if business_roles exists and has skill_requirements
    if (application.business_roles && application.business_roles.skill_requirements) {
      // Get user skills from the state as lowercase strings for comparison
      const userSkillNames = userSkills.map(skill => {
        return typeof skill === 'string' 
          ? skill.toLowerCase() 
          : (skill && typeof skill.skill === 'string' ? skill.skill.toLowerCase() : '');
      }).filter(Boolean); // Filter out empty strings
      
      // Safely handle the skill_requirements array
      const skillRequirements = Array.isArray(application.business_roles.skill_requirements) 
        ? application.business_roles.skill_requirements 
        : [];
      
      // Find matching skills
      return skillRequirements
        .map(req => {
          if (typeof req === 'string') {
            return userSkillNames.includes(req.toLowerCase()) ? req : null;
          } else if (req && typeof req === 'object' && 'skill' in req && typeof req.skill === 'string') {
            return userSkillNames.includes(req.skill.toLowerCase()) ? req.skill : null;
          }
          return null;
        })
        .filter((skill): skill is string => skill !== null);
    }
    
    return []; // Return empty array if no business_roles or skill_requirements
  };

  return { userSkills, getMatchedSkills };
};
