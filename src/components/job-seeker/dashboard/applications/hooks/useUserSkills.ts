
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
    
    // Convert skill_requirements to an array we can work with
    const requiredSkills: Array<string | { skill: string }> = [];
    
    if (Array.isArray(application.business_roles.skill_requirements)) {
      // Safely copy the array while ensuring proper typing
      application.business_roles.skill_requirements.forEach(skill => {
        if (typeof skill === 'string' || (typeof skill === 'object' && skill !== null && 'skill' in skill)) {
          requiredSkills.push(skill);
        }
      });
    }
    
    // Find the intersection of user skills and required skills
    return requiredSkills.filter(skillRequired => {
      if (typeof skillRequired === 'string') {
        return skillNames.includes(skillRequired.toLowerCase());
      } else if (skillRequired && typeof skillRequired === 'object' && 'skill' in skillRequired) {
        const skillName = String(skillRequired.skill).toLowerCase();
        return skillNames.includes(skillName);
      }
      return false;
    }).map(skill => {
      if (typeof skill === 'string') {
        return skill;
      } else if (skill && typeof skill === 'object' && 'skill' in skill) {
        return skill.skill;
      }
      return '';
    }).filter(skill => skill !== ''); // Remove any empty strings
  };

  return { userSkills, getMatchedSkills };
};
