
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Skill, JobApplication, SkillRequirement } from "@/types/jobSeeker";

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const fetchUserSkills = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user skills:", error);
        return;
      }

      if (!data.skills) return;

      try {
        let parsedSkills: Skill[] = [];
        
        if (typeof data.skills === 'string') {
          const parsed = JSON.parse(data.skills);
          if (Array.isArray(parsed)) {
            parsedSkills = parsed.map((skill: any) => {
              if (typeof skill === 'string') {
                return { skill, level: "Intermediate" as const };
              }
              return skill as Skill;
            });
          }
        } else if (Array.isArray(data.skills)) {
          parsedSkills = data.skills.map((skill: any) => {
            if (typeof skill === 'string') {
              return { skill, level: "Intermediate" as const };
            }
            return skill as Skill;
          });
        }
        
        setUserSkills(parsedSkills);
      } catch (err) {
        console.error("Error parsing skills:", err);
      }
    };

    fetchUserSkills();
  }, []);

  const getMatchedSkills = (application: JobApplication): (string | SkillRequirement)[] => {
    if (!application.business_roles || !userSkills.length) return [];

    const requiredSkills = application.business_roles.skill_requirements || [];
    
    // Map all user skills to lowercase for case-insensitive comparison
    const userSkillsLower = userSkills.map(s => {
      if (typeof s === 'string') {
        return s.toLowerCase();
      }
      if (typeof s === 'object' && s !== null && 'skill' in s && typeof s.skill === 'string') {
        return s.skill.toLowerCase();
      }
      return "";
    }).filter(s => s !== "");

    // Find matches between required skills and user skills
    const matches = requiredSkills.filter(req => {
      if (typeof req === 'string') {
        return userSkillsLower.includes(req.toLowerCase());
      }
      
      if (typeof req === 'object' && req !== null && 'skill' in req && typeof req.skill === 'string') {
        return userSkillsLower.includes(req.skill.toLowerCase());
      }
      
      return false;
    });

    return matches;
  };

  return { userSkills, getMatchedSkills };
};
