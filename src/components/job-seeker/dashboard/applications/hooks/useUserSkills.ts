
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
    // First check if business_roles and skills_required exist
    if (!application.business_roles || !application.business_roles.skills_required) {
      return [];
    }
    
    // Get user skills from the state
    const skillNames = userSkills.map(skill => 
      typeof skill === 'string' ? skill.toLowerCase() : skill.skill.toLowerCase()
    );
    
    // Convert skills_required to an array we can work with
    let requiredSkills: any[] = [];
    
    if (Array.isArray(application.business_roles.skills_required)) {
      requiredSkills = application.business_roles.skills_required;
    }
    
    // Find the intersection of user skills and required skills
    return requiredSkills.filter(skillRequired => {
      // Handle string skills
      if (typeof skillRequired === 'string') {
        return skillNames.includes(skillRequired.toLowerCase());
      } 
      // Handle object skills with a 'skill' property
      else if (skillRequired && typeof skillRequired === 'object' && 'skill' in skillRequired) {
        const skillName = String(skillRequired.skill).toLowerCase();
        return skillNames.includes(skillName);
      }
      return false;
    }).map(skill => typeof skill === 'string' ? skill : skill.skill);
  };

  return { userSkills, getMatchedSkills };
};
