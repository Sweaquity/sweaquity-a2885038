
import { supabase } from '@/lib/supabase';
import { Ticket, UserData } from '@/types/types';
import { toast } from 'sonner';

export class TicketService {
  static async createTicket(ticket: Partial<Ticket>): Promise<Ticket | null> {
    try {
      // Ensure ticket has required fields with non-empty values
      const sanitizedTicket = {
        ...ticket,
        status: ticket.status || 'new',
        priority: ticket.priority || 'medium',
        title: ticket.title || 'Untitled Ticket',
        description: ticket.description || 'No description provided'
      };
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(sanitizedTicket)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
      return null;
    }
  }
  
  static async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    try {
      // Validate status and priority to ensure they're never empty
      const sanitizedUpdates = {
        ...updates
      };
      
      if ('status' in updates && (!updates.status || updates.status.trim() === '')) {
        sanitizedUpdates.status = 'new';
      }
      
      if ('priority' in updates && (!updates.priority || updates.priority.trim() === '')) {
        sanitizedUpdates.priority = 'medium';
      }
      
      const { data, error } = await supabase
        .from('tickets')
        .update(sanitizedUpdates)
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
      return null;
    }
  }
  
  static async deleteTicket(ticketId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
      return false;
    }
  }
  
  static async addComment(ticketId: string, content: string, userId: string): Promise<boolean> {
    try {
      // Get the current ticket
      const { data: ticket, error: fetchError } = await supabase
        .from('tickets')
        .select('notes')
        .eq('id', ticketId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Create new comment
      const newComment = {
        id: crypto.randomUUID(),
        user: userId,
        timestamp: new Date().toISOString(),
        content: content,
        action: 'comment'
      };
      
      // Add to existing notes or create new array
      const updatedNotes = ticket.notes ? [...ticket.notes, newComment] : [newComment];
      
      // Update the ticket
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ notes: updatedNotes })
        .eq('id', ticketId);
        
      if (updateError) throw updateError;
      
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      return false;
    }
  }
  
  static async getUserProfile(userId: string): Promise<UserData | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      // Ensure we have safe values
      const userData: UserData = {
        first_name: data.first_name || 'Anonymous',
        last_name: data.last_name || 'User',
        company_name: data.company_name || ''
      };
      
      return userData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
  
  static async updateTaskCompletionEquity(ticketId: string, completion: number): Promise<boolean> {
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('job_app_id, task_id, project_id')
        .eq('id', ticketId)
        .single();
      
      if (ticketError) throw ticketError;
      
      if (!ticket.job_app_id) return false;
      
      // Get equity_agreed from accepted_jobs
      const { data: acceptedJob, error: acceptedJobError } = await supabase
        .from('accepted_jobs')
        .select('equity_agreed')
        .eq('job_app_id', ticket.job_app_id)
        .single();
      
      if (acceptedJobError) throw acceptedJobError;
      
      if (!acceptedJob) return false;
      
      // Calculate equity to allocate
      const equityAgreed = acceptedJob.equity_agreed || 0;
      const equityToAllocate = (equityAgreed * completion) / 100;
      
      // Update the accepted_jobs table
      const { error: updateError } = await supabase
        .from('accepted_jobs')
        .update({
          jobs_equity_allocated: equityToAllocate,
          updated_at: new Date().toISOString()
        })
        .eq('job_app_id', ticket.job_app_id);
      
      if (updateError) throw updateError;
      
      // Update project_sub_tasks
      if (ticket.task_id) {
        await supabase
          .from('project_sub_tasks')
          .update({
            completion_percentage: completion,
            task_status: completion >= 100 ? 'closed' : 'active',
            last_activity_at: new Date().toISOString()
          })
          .eq('task_id', ticket.task_id);
      }
      
      // Update business_projects
      if (ticket.project_id) {
        await this.updateProjectCompletionAndEquity(ticket.project_id);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating task completion equity:', error);
      return false;
    }
  }
  
  static async updateProjectCompletionAndEquity(projectId: string): Promise<boolean> {
    try {
      // Get all tasks for this project
      const { data: tasks, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('project_id', projectId);
        
      if (tasksError) throw tasksError;
      
      if (!tasks || tasks.length === 0) return true;
      
      // Calculate weighted completion percentage
      let totalEquity = 0;
      let totalCompletedEquity = 0;
      
      tasks.forEach(task => {
        const equity = task.equity_allocation || 0;
        totalEquity += equity;
        totalCompletedEquity += equity * (task.completion_percentage || 0) / 100;
      });
      
      const completionPercentage = totalEquity > 0 
        ? (totalCompletedEquity / totalEquity) * 100 
        : 0;
      
      // Get equity allocated from accepted_jobs
      const jobAppIds = tasks.map(t => t.job_app_id).filter(Boolean);
      
      if (jobAppIds.length > 0) {
        const { data: acceptedJobs, error: jobsError } = await supabase
          .from('accepted_jobs')
          .select('job_app_id, equity_agreed, jobs_equity_allocated')
          .in('job_app_id', jobAppIds);
          
        if (jobsError) throw jobsError;
        
        let totalEquityAllocated = 0;
        if (acceptedJobs) {
          acceptedJobs.forEach(job => {
            totalEquityAllocated += job.jobs_equity_allocated || 0;
          });
        }
        
        // Update business_projects
        const { error: updateError } = await supabase
          .from('business_projects')
          .update({
            completion_percentage: Math.round(completionPercentage),
            equity_allocated: totalEquityAllocated,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', projectId);
        
        if (updateError) throw updateError;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating project completion and equity:', error);
      return false;
    }
  }
}
