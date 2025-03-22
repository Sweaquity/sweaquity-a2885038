import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface BetaTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  reporter_email?: string;
  reporter?: string;
  expanded?: boolean;
  newNote?: string;
  notes?: Array<{
    action: string;
    user: string;
    timestamp: string;
    comment?: string;
  }> | null;
  system_info?: {
    url: string;
    userAgent: string;
    timestamp: string;
    viewportSize: string;
    referrer: string;
  };
  reported_url?: string;
  attachments?: string[];
  reproduction_steps?: string;
}

export interface StatisticsData {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
  byStatus: { [key: string]: number };
  byPriority: { [key: string]: number };
}

export class TicketService {
  /**
   * Fetches beta tickets from the database
   * @returns Array of BetaTicket objects
   */
  static async fetchBetaTickets(): Promise<BetaTicket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or('title.ilike.%Beta%,description.ilike.%Beta%,title.ilike.%Testing%')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching beta tickets:", error);
        toast.error("Failed to load beta tickets");
        return [];
      }

      const processedTickets: BetaTicket[] = await Promise.all(
        data.map(async (ticket: any) => {
          let reporterEmail = null;
          
          if (ticket.reporter) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', ticket.reporter)
              .maybeSingle();
              
            reporterEmail = profileData?.email;
          }
          
          return {
            ...ticket,
            reporter_email: reporterEmail,
            expanded: false,
            newNote: ''
          };
        })
      );

      return processedTickets;
    } catch (err) {
      console.error("Error in fetchBetaTickets:", err);
      toast.error("Failed to load beta tickets data");
      return [];
    }
  }

  /**
   * Calculates statistics for a set of tickets
   * @param tickets Array of tickets to analyze
   * @returns Statistics object
   */
  static calculateTicketStatistics(tickets: BetaTicket[]): StatisticsData {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(ticket => ticket.status !== 'done' && ticket.status !== 'closed').length;
    const closedTickets = totalTickets - openTickets;
    const highPriorityTickets = tickets.filter(ticket => ticket.priority === 'high').length;

    const byStatus: { [key: string]: number } = {};
    const byPriority: { [key: string]: number } = {};

    tickets.forEach(ticket => {
      byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1;
      byPriority[ticket.priority] = (byPriority[ticket.priority] || 0) + 1;
    });

    return {
      totalTickets,
      openTickets,
      closedTickets,
      highPriorityTickets,
      byStatus,
      byPriority,
    };
  }

  /**
   * Updates a ticket's status
   * @param ticketId Ticket ID
   * @param newStatus New status value
   * @returns Success boolean
   */
  static async updateTicketStatus(ticketId: string, newStatus: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) {
        console.error("Error updating ticket status:", error);
        toast.error("Failed to update ticket status");
        return false;
      }

      toast.success("Ticket status updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
      return false;
    }
  }

  /**
   * Updates a ticket's priority
   * @param ticketId Ticket ID
   * @param newPriority New priority value
   * @returns Success boolean
   */
  static async updateTicketPriority(ticketId: string, newPriority: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
        .eq('id', ticketId);

      if (error) {
        console.error("Error updating ticket priority:", error);
        toast.error("Failed to update ticket priority");
        return false;
      }

      toast.success("Ticket priority updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      toast.error("Failed to update ticket priority");
      return false;
    }
  }

  /**
   * Sets a due date for a ticket
   * @param ticketId Ticket ID
   * @param newDueDate New due date
   * @returns Success boolean
   */
  static async setDueDate(ticketId: string, newDueDate: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ due_date: newDueDate })
        .eq('id', ticketId);

      if (error) {
        console.error("Error setting due date:", error);
        toast.error("Failed to set due date");
        return false;
      }

      toast.success("Due date updated successfully");
      return true;
    } catch (error) {
      console.error("Error setting due date:", error);
      toast.error("Failed to set due date");
      return false;
    }
  }

  /**
   * Adds a note to a ticket
   * @param ticketId Ticket ID
   * @param note Note content
   * @returns Success boolean
   */
  static async addTicketNote(ticketId: string, note: string): Promise<boolean> {
    if (!note.trim()) return false;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to add notes");
        return false;
      }
      
      const { data: userData } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', user.id)
        .single();
        
      const userName = userData?.first_name 
        ? `${userData.first_name} ${userData.last_name || ''}`
        : userData?.email || user.email || 'Unknown User';
      
      const { data: ticketData, error: fetchError } = await supabase
        .from('tickets')
        .select('notes')
        .eq('id', ticketId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching ticket:", fetchError);
        toast.error("Failed to add note");
        return false;
      }
      
      let notes = ticketData.notes || [];
      
      notes.push({
        action: 'Note added',
        user: userName,
        timestamp: new Date().toISOString(),
        comment: note
      });
      
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
        
      if (updateError) {
        console.error("Error updating ticket:", updateError);
        toast.error("Failed to add note");
        return false;
      }
      
      toast.success("Note added successfully");
      return true;
      
    } catch (err) {
      console.error("Error in addTicketNote:", err);
      toast.error("Failed to add note");
      return false;
    }
  }

  /**
   * Sends a reply to the reporter of a ticket
   * @param ticketId Ticket ID
   * @param replyMessage Reply content
   * @param ticket Ticket object
   * @returns Success boolean
   */
  static async sendReplyToReporter(ticketId: string, replyMessage: string, ticket: BetaTicket): Promise<boolean> {
    if (!ticketId || !replyMessage.trim()) return false;
    
    try {
      if (!ticket || !ticket.reporter) {
        toast.error("Cannot find reporter information");
        return false;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to reply");
        return false;
      }
      
      const { data: userData } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', user.id)
        .single();
        
      const userName = userData?.first_name 
        ? `${userData.first_name} ${userData.last_name || ''}`
        : userData?.email || user.email || 'Unknown User';
      
      // Create the user_messages table if it doesn't exist
      const { error: tableCheckError } = await supabase
        .from('user_messages')
        .select('id', { count: 'exact', head: true });
      
      if (tableCheckError) {
        // Create the user_messages table if it doesn't exist
        const { error: createTableError } = await supabase.rpc('create_messages_table_if_not_exists');
        if (createTableError) {
          console.error("Error creating messages table:", createTableError);
          toast.error("Failed to send reply: messaging system not available");
          return false;
        }
      }
      
      // Send a message to the reporter
      const { error: messageError } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user.id,
          recipient_id: ticket.reporter,
          subject: `Re: ${ticket.title}`,
          message: replyMessage,
          related_ticket: ticketId,
          read: false
        });
        
      if (messageError) {
        console.error("Error sending message:", messageError);
        toast.error("Failed to send reply to user dashboard, but message recorded in ticket notes");
      } else {
        toast.success("Reply sent to reporter's dashboard");
      }
      
      // Also update the ticket notes for history tracking
      const { data: ticketData, error: fetchError } = await supabase
        .from('tickets')
        .select('notes')
        .eq('id', ticketId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching ticket:", fetchError);
        toast.error("Failed to update ticket notes");
        return false;
      }
      
      let notes = ticketData.notes || [];
      
      notes.push({
        action: 'Reply sent to reporter',
        user: userName,
        timestamp: new Date().toISOString(),
        comment: replyMessage
      });
      
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
        
      if (updateError) {
        console.error("Error updating ticket notes:", updateError);
        toast.error("Failed to record reply in ticket history");
        return false;
      }
      
      toast.success("Reply recorded in ticket history");
      return true;
      
    } catch (err) {
      console.error("Error in sendReplyToReporter:", err);
      toast.error("Failed to send reply");
      return false;
    }
  }

  /**
   * Organizes tickets into Kanban columns
   * @param tickets Array of tickets
   * @returns Object with columns and tickets
   */
  static getKanbanTickets(tickets: BetaTicket[]) {
    const columns = {
      'new': { id: 'new', title: 'New', ticketIds: [] as string[] },
      'in-progress': { id: 'in-progress', title: 'In Progress', ticketIds: [] as string[] },
      'blocked': { id: 'blocked', title: 'Blocked', ticketIds: [] as string[] },
      'review': { id: 'review', title: 'Review', ticketIds: [] as string[] },
      'done': { id: 'done', title: 'Done', ticketIds: [] as string[] },
      'closed': { id: 'closed', title: 'Closed', ticketIds: [] as string[] }
    };
    
    const ticketMap: Record<string, BetaTicket> = {};
    
    tickets.forEach(ticket => {
      ticketMap[ticket.id] = ticket;
      const status = ticket.status || 'new';
      if (columns[status as keyof typeof columns]) {
        columns[status as keyof typeof columns].ticketIds.push(ticket.id);
      } else {
        columns['new'].ticketIds.push(ticket.id);
      }
    });
    
    return { columns, tickets: ticketMap };
  }

  /**
   * Formats tickets for Gantt chart view
   * @param tickets Array of tickets
   * @returns Array of task objects for Gantt chart
   */
  static getGanttTasks(tickets: BetaTicket[]) {
    return tickets.map((ticket) => {
      const startDate = new Date(ticket.created_at);
      let endDate = ticket.due_date ? new Date(ticket.due_date) : new Date();
      
      if (!ticket.due_date || endDate < new Date()) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
      }
      
      return {
        id: ticket.id,
        name: ticket.title,
        start: startDate,
        end: endDate,
        type: 'task' as const,
        progress: ticket.status === 'done' || ticket.status === 'closed' ? 100 : 
                 ticket.status === 'in-progress' ? 50 : 
                 ticket.status === 'review' ? 75 : 25,
        isDisabled: false,
        styles: { 
          progressColor: 
            ticket.priority === 'high' ? '#ef4444' : 
            ticket.priority === 'medium' ? '#f59e0b' : '#3b82f6'
        }
      };
    });
  }

  /**
   * Formats a date string
   * @param dateString Date string to format
   * @returns Formatted date string
   */
  static formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }
}
