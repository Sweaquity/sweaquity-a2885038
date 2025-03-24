
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useTaskCompletionData = (businessId: string) => {
  const [pendingReviewTasks, setPendingReviewTasks] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessProjects, setBusinessProjects] = useState<any[]>([]);
  const [projectEquity, setProjectEquity] = useState<Record<string, number>>({});
  const [allocatedEquity, setAllocatedEquity] = useState<Record<string, number>>({});

  useEffect(() => {
    loadTasksForReview();
  }, [businessId]);

  const loadTasksForReview = async () => {
    setLoading(true);
    try {
      // Get all projects for this business
      const { data: projects, error: projectsError } = await supabase
        .from('business_projects')
        .select('project_id, title, equity_allocation, equity_allocated')
        .eq('business_id', businessId);
        
      if (projectsError) throw projectsError;
      
      setBusinessProjects(projects || []);
      
      // Build a map of project equity allocations
      const equityMap: Record<string, number> = {};
      const allocatedMap: Record<string, number> = {};
      
      (projects || []).forEach(project => {
        equityMap[project.project_id] = project.equity_allocation || 0;
        allocatedMap[project.project_id] = project.equity_allocated || 0;
      });
      
      setProjectEquity(equityMap);
      setAllocatedEquity(allocatedMap);
      
      if (!projects || projects.length === 0) {
        setLoading(false);
        return;
      }
      
      const projectIds = projects.map(p => p.project_id);
      
      // Get all tasks pending review
      const { data: pendingTasks, error: pendingError } = await supabase
        .from('project_sub_tasks')
        .select(`
          *,
          business_projects!inner (
            project_id,
            title,
            business_id
          ),
          tickets!left (
            id,
            title,
            status,
            job_app_id,
            reporter,
            assigned_to,
            equity_points
          )
        `)
        .in('project_id', projectIds)
        .eq('task_status', 'pending_review');
        
      if (pendingError) throw pendingError;
      
      // Get all completed tasks
      const { data: completedTasksData, error: completedError } = await supabase
        .from('project_sub_tasks')
        .select(`
          *,
          business_projects!inner (
            project_id,
            title,
            business_id
          ),
          tickets!left (
            id,
            title,
            status,
            job_app_id,
            reporter,
            assigned_to,
            equity_points
          )
        `)
        .in('project_id', projectIds)
        .eq('task_status', 'completed');
        
      if (completedError) throw completedError;
      
      // Get the user information for each task's assigned user
      const pendingTasksWithUser = await Promise.all((pendingTasks || []).map(async (task) => {
        const ticket = task.tickets && task.tickets.length > 0 ? task.tickets[0] : null;
        
        if (ticket && ticket.job_app_id) {
          const { data: jobApp, error: jobAppError } = await supabase
            .from('job_applications')
            .select('user_id')
            .eq('job_app_id', ticket.job_app_id)
            .maybeSingle();
            
          if (!jobAppError && jobApp) {
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', jobApp.user_id)
              .single();
              
            if (!userError && userData) {
              return {
                ...task,
                assignedUser: `${userData.first_name} ${userData.last_name}`,
                userId: jobApp.user_id
              };
            }
          }
        }
        
        return task;
      }));
      
      // Get the user information for completed tasks
      const completedTasksWithUser = await Promise.all((completedTasksData || []).map(async (task) => {
        const ticket = task.tickets && task.tickets.length > 0 ? task.tickets[0] : null;
        
        if (ticket && ticket.job_app_id) {
          const { data: jobApp, error: jobAppError } = await supabase
            .from('job_applications')
            .select('user_id')
            .eq('job_app_id', ticket.job_app_id)
            .maybeSingle();
            
          if (!jobAppError && jobApp) {
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', jobApp.user_id)
              .single();
              
            if (!userError && userData) {
              return {
                ...task,
                assignedUser: `${userData.first_name} ${userData.last_name}`,
                userId: jobApp.user_id
              };
            }
          }
        }
        
        return task;
      }));
      
      setPendingReviewTasks(pendingTasksWithUser);
      setCompletedTasks(completedTasksWithUser);
    } catch (error) {
      console.error("Error loading tasks for review:", error);
      toast.error("Failed to load tasks for review");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTask = async (task: any) => {
    try {
      // Update the task status to completed
      const { error: taskError } = await supabase
        .from('project_sub_tasks')
        .update({ 
          task_status: 'completed',
          completion_percentage: 100,
          last_activity_at: new Date().toISOString()
        })
        .eq('task_id', task.task_id);
        
      if (taskError) throw taskError;
      
      // Get the ticket associated with this task
      const ticket = task.tickets && task.tickets.length > 0 ? task.tickets[0] : null;
      
      if (ticket && ticket.job_app_id) {
        // Get the accepted job to find the equity allocation
        const { data: acceptedJob, error: jobError } = await supabase
          .from('accepted_jobs')
          .select('equity_agreed')
          .eq('job_app_id', ticket.job_app_id)
          .maybeSingle();
          
        if (jobError) throw jobError;
        
        if (acceptedJob) {
          // Update the ticket to show full equity points
          const { error: ticketError } = await supabase
            .from('tickets')
            .update({ 
              equity_points: acceptedJob.equity_agreed,
              status: 'done',
              updated_at: new Date().toISOString()
            })
            .eq('id', ticket.id);
            
          if (ticketError) throw ticketError;
          
          // Update the project's allocated equity
          const projectId = task.project_id;
          const currentAllocated = allocatedEquity[projectId] || 0;
          const newAllocated = currentAllocated + acceptedJob.equity_agreed;
          
          const { error: projectError } = await supabase
            .from('business_projects')
            .update({ 
              equity_allocated: newAllocated
            })
            .eq('project_id', projectId);
            
          if (projectError) throw projectError;
          
          // Update local state
          setAllocatedEquity({
            ...allocatedEquity,
            [projectId]: newAllocated
          });
        }
      }
      
      toast.success("Task approved and equity allocated");
      loadTasksForReview();
    } catch (error) {
      console.error("Error approving task:", error);
      toast.error("Failed to approve task");
    }
  };

  return {
    loading,
    pendingReviewTasks,
    completedTasks,
    businessProjects,
    projectEquity,
    allocatedEquity,
    handleApproveTask,
    loadTasksForReview
  };
};
