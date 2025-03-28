import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { EquityProject } from "@/types/equity";
import { Skill } from "@/types/profile";

export const useOpportunitiesLoader = () => {
  const loadOpportunities = useCallback(async (userId: string, userSkills?: any[]) => {
    try {
      const { data: userApplications, error: applicationsError } = await supabase
        .from('job_applications')
        .select('task_id, status')
        .eq('user_id', userId);

      if (applicationsError) throw applicationsError;

      const unavailableTaskIds = new Set(
        userApplications
          ?.filter(app => ['pending', 'in review', 'negotiation', 'accepted'].includes(app.status))
          .map(app => app.task_id) || []
      );

      // Create an array of just skill names for easier matching
      const userSkillStrings = (userSkills || []).map(skill => {
        if (typeof skill === 'string') return skill.toLowerCase();
        if (skill && typeof skill === 'object') {
          return ('skill' in skill && skill.skill) 
            ? skill.skill.toLowerCase() 
            : ('name' in skill && skill.name)
              ? skill.name.toLowerCase()
              : '';
        }
        return '';
      }).filter(Boolean);
      
      const formattedUserSkills = Array.isArray(userSkills) 
        ? userSkills.map(s => {
            if (typeof s === 'string') return s.toLowerCase();
            return typeof s === 'object' && s !== null && 'skill' in s && typeof s.skill === 'string' 
              ? s.skill.toLowerCase() 
              : '';
          }).filter(Boolean)
        : [];
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select(`
          *,
          business_projects!inner (
            project_id,
            title,
            business_id,
            businesses (
              company_name
            )
          )
        `)
        .eq('status', 'open');

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        throw tasksError;
      }

      if (!tasksData || tasksData.length === 0) {
        console.log("No tasks found");
        return [];
      }
      
      const opportunities = tasksData
        .filter(task => {
          if (unavailableTaskIds.has(task.task_id)) return false;
          
          if (formattedUserSkills.length === 0) return true;
          
          if (!task.skill_requirements || !Array.isArray(task.skill_requirements)) return false;
          
          const taskSkills = task.skill_requirements.map(s => {
            if (typeof s === 'string') return s.toLowerCase();
            return typeof s === 'object' && s !== null && 'skill' in s && typeof s.skill === 'string' 
              ? s.skill.toLowerCase() 
              : '';
          }).filter(Boolean);
          
          if (taskSkills.length === 0 || formattedUserSkills.length === 0) return true;
          
          const hasMatchingSkill = formattedUserSkills.some(skill => 
            taskSkills.includes(skill)
          );
          
          return hasMatchingSkill;
        })
        .map(task => {
          if (!task.skill_requirements || !Array.isArray(task.skill_requirements)) {
            task.skill_requirements = [];
          }
          
          // Safely convert skill requirements to string array for comparisons
          const taskSkills = task.skill_requirements.map(s => {
            if (typeof s === 'string') return s.toLowerCase();
            return typeof s === 'object' && s !== null && 'skill' in s && typeof s.skill === 'string'
              ? s.skill.toLowerCase()
              : '';
          }).filter(Boolean);
          
          // Only compare strings with strings for safety
          const matchingSkills = formattedUserSkills.filter(skill => 
            typeof skill === 'string' && taskSkills.includes(skill)
          );
          
          const matchPercentage = taskSkills.length > 0 
            ? Math.round((matchingSkills.length / taskSkills.length) * 100) 
            : 0;

          let companyName = "Unknown Company";
          let projectTitle = "Untitled Project";
          
          if (task.business_projects) {
            projectTitle = task.business_projects.title || "Untitled Project";
            
            if (task.business_projects.businesses) {
              if (Array.isArray(task.business_projects.businesses)) {
                companyName = task.business_projects.businesses[0]?.company_name || "Unknown Company";
              } else {
                companyName = task.business_projects.businesses.company_name || "Unknown Company";
              }
            }
          }
          
          return {
            id: task.task_id,
            project_id: task.project_id,
            equity_amount: task.equity_allocation,
            time_allocated: task.timeframe,
            status: task.status,
            start_date: task.created_at,
            effort_logs: [],
            total_hours_logged: 0,
            title: projectTitle,
            created_by: task.created_by,
            updated_at: task.updated_at,  // Add updated_at for filtering new opportunities
            skill_match: matchPercentage,
            sub_tasks: [{
              id: task.task_id,
              task_id: task.task_id,
              project_id: task.project_id,
              title: task.title,
              description: task.description,
              timeframe: task.timeframe,
              status: task.status,
              equity_allocation: task.equity_allocation,
              skill_requirements: task.skill_requirements || [],
              task_status: task.task_status,
              completion_percentage: task.completion_percentage
            }],
            business_roles: {
              title: task.title,
              description: task.description,
              project_title: projectTitle,
              company_name: companyName,
              skill_requirements: task.skill_requirements || []
            }
          };
        });

      return opportunities;
    } catch (error) {
      console.error("Error loading opportunities:", error);
      return [];
    }
  }, []);

  return { loadOpportunities };
};
