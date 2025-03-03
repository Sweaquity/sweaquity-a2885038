
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Skill, JobApplication } from "@/types/jobSeeker";

export const useUserSkills = () => {
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserSkills = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("No session found");
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("skills")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        if (data && data.skills) {
          // Handle different formats of skills data
          if (typeof data.skills === 'string') {
            try {
              const parsedSkills = JSON.parse(data.skills);
              if (Array.isArray(parsedSkills)) {
                setUserSkills(parsedSkills.map(s => 
                  typeof s === 'string' ? { skill: s, level: "Intermediate" } : s
                ));
              }
            } catch (e) {
              console.error("Error parsing skills:", e);
              setUserSkills([]);
            }
          } else if (Array.isArray(data.skills)) {
            setUserSkills(data.skills.map(s => 
              typeof s === 'string' ? { skill: s, level: "Intermediate" } : s
            ));
          }
        }
      } catch (err) {
        console.error("Error fetching user skills:", err);
        setError("Failed to load skills");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSkills();
  }, []);

  const getMatchedSkills = (application: JobApplication) => {
    if (!application.business_roles?.skill_requirements || userSkills.length === 0) {
      return [];
    }

    const requiredSkills = application.business_roles.skill_requirements;
    const matchedSkills: (string | { skill: string; level: string })[] = [];

    requiredSkills.forEach(requirement => {
      // Extract the skill name regardless of type
      let requirementName = "";
      if (typeof requirement === 'string') {
        requirementName = requirement;
      } else if (requirement && typeof requirement === 'object' && 'skill' in requirement) {
        requirementName = requirement.skill;
      }

      // Only proceed if we have a valid skill name
      if (requirementName) {
        const reqNameLower = requirementName.toLowerCase();
        
        // Find matching user skill
        const matchingUserSkill = userSkills.find(userSkill => {
          if (typeof userSkill === 'string') {
            return userSkill.toLowerCase() === reqNameLower;
          } else if (userSkill && typeof userSkill === 'object' && 'skill' in userSkill) {
            // Add a type check to ensure skill is a string before using toLowerCase
            return typeof userSkill.skill === 'string' && userSkill.skill.toLowerCase() === reqNameLower;
          }
          return false;
        });

        if (matchingUserSkill) {
          matchedSkills.push(matchingUserSkill);
        }
      }
    });

    return matchedSkills;
  };

  return { userSkills, isLoading, error, getMatchedSkills };
};
