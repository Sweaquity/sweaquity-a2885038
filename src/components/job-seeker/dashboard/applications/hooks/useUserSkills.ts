
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Skill, JobApplication } from "@/types/jobSeeker";

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

  // Get matched skills from application and task requirements
  const getMatchedSkills = (application: JobApplication): string[] => {
    // First check if business_roles and skill_requirements exist
    if (!application.business_roles || !application.business_roles.skill_requirements) {
      return [];
    }
    
    // Get user skills from the state
    const skillNames = userSkills.map(skill => 
      typeof skill === 'string' ? skill.toLowerCase() : skill.skill.toLowerCase()
    );
    
    // Safely handle the skill_requirements array
    const skillRequirements = Array.isArray(application.business_roles.skill_requirements) 
      ? application.business_roles.skill_requirements 
      : [];
    
    // Find the intersection of user skills and required skills
    return skillRequirements
      .map(req => {
        if (typeof req === 'string') {
          return skillNames.includes(req.toLowerCase()) ? req : null;
        } else if (req && typeof req === 'object' && 'skill' in req) {
          const skillName = req.skill.toLowerCase();
          return skillNames.includes(skillName) ? req.skill : null;
        }
        return null;
      })
      .filter((skill): skill is string => skill !== null);
  };

  return { userSkills, getMatchedSkills };
};
