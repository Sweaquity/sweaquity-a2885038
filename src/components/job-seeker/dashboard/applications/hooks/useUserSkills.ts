
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { JobApplication, Skill } from "@/types/jobSeeker";

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUserSkills = async () => {
    try {
      setIsLoading(true);

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

      if (!data.skills) {
        setUserSkills([]);
        return;
      }

      // Parse skills if they're in JSON string format
      let parsedSkills: Skill[] = [];
      try {
        if (typeof data.skills === 'string') {
          parsedSkills = JSON.parse(data.skills);
        } else {
          parsedSkills = data.skills;
        }
      } catch (e) {
        console.error("Error parsing skills:", e);
        parsedSkills = [];
      }

      setUserSkills(parsedSkills);
    } catch (error) {
      console.error("Error loading skills:", error);
      toast.error("Failed to load your skills");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserSkills();
  }, []);

  // Function to identify matching skills between user and application
  const getMatchedSkills = (application: JobApplication): string[] => {
    if (!userSkills || userSkills.length === 0) return [];
    if (!application.business_roles?.skill_requirements) return [];

    const userSkillNames = userSkills.map(skill => {
      // Ensure we handle both string and object skills
      if (typeof skill === 'string') {
        return skill.toLowerCase();
      }
      // Make sure skill is an object with the 'skill' property before accessing
      if (skill && typeof skill === 'object' && 'skill' in skill && typeof skill.skill === 'string') {
        return skill.skill.toLowerCase();
      }
      return '';
    }).filter(Boolean); // Remove empty strings
    
    const matchedSkills: string[] = [];
    
    application.business_roles.skill_requirements.forEach(skillReq => {
      // Handle skill requirement that could be string or object
      let skillName = '';
      if (typeof skillReq === 'string') {
        skillName = skillReq.toLowerCase();
      } else if (skillReq && typeof skillReq === 'object' && 'skill' in skillReq && typeof skillReq.skill === 'string') {
        skillName = skillReq.skill.toLowerCase();
      }
      
      if (skillName && userSkillNames.includes(skillName)) {
        matchedSkills.push(skillName);
      }
    });
    
    return matchedSkills;
  };

  return {
    userSkills,
    isLoading,
    getMatchedSkills
  };
};
