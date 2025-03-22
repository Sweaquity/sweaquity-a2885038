// types.ts - Shared types for ticket management
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health?: string;
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

export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
  byStatus: { [key: string]: number };
  byPriority: { [key: string]: number };
}

export interface KanbanData {
  columns: {
    [key: string]: {
      id: string;
      title: string;
      ticketIds: string[];
    }
  };
  tickets: Record<string, Ticket>;
}

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  type: 'task';
  progress: number;
  isDisabled: boolean;
  styles: {
    progressColor: string;
  };
}

// hooks/useTicketManagement.ts - Custom hook for ticket data and operations
import { useState, useEffect } from 'react';
import { Ticket, TicketStats } from '../types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useTicketManagement(filter?: string) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketStats, setTicketStats] = useState<TicketStats>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    byStatus: {},
    byPriority: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      
      // Build query based on filter if provided
      let query = supabase.from('tickets').select('*');
      
      if (filter) {
        query = query.or(`title.ilike.%${filter}%,description.ilike.%${filter}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Failed to load tickets");
        return;
      }

      const processedTickets: Ticket[] = await Promise.all(
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

      setTickets(processedTickets);
      calculateTicketStatistics(processedTickets);
    } catch (err) {
      console.error("Error in fetchTickets:", err);
      toast.error("Failed to load tickets data");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTicketStatistics = (ticketsData: Ticket[]) => {
    const totalTickets = ticketsData.length;
    const openTickets = ticketsData.filter(ticket => ticket.status !== 'done' && ticket.status !== 'closed').length;
    const closedTickets = totalTickets - openTickets;
    const highPriorityTickets = ticketsData.filter(ticket => ticket.priority === 'high').length;

    const byStatus: { [key: string]: number } = {};
    const byPriority: { [key: string]: number } = {};

    ticketsData.forEach(ticket => {
      byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1;
      byPriority[ticket.priority] = (byPriority[ticket.priority] || 0) + 1;
    });

    setTicketStats({
      totalTickets,
      openTickets,
      closedTickets,
      highPriorityTickets,
      byStatus,
      byPriority,
    });
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) {
        console.error("Error updating ticket status:", error);
        toast.error("Failed to update ticket status");
        return;
      }

      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
      
      toast.success("Ticket status updated successfully");
      
      // Update statistics
      calculateTicketStatistics(tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    }
  };

  const handleUpdateTicketPriority = async (ticketId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
        .eq('id', ticketId);

      if (error) {
        console.error("Error updating ticket priority:", error);
        toast.error("Failed to update ticket priority");
        return;
      }

      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
      ));
      
      toast.success("Ticket priority updated successfully");
      
      // Update statistics
      calculateTicketStatistics(tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
      ));
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      toast.error("Failed to update ticket priority");
    }
  };

  const handleAddTicketNote = async (ticketId: string, note: string) => {
    if (!note.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to add notes");
        return;
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
        return;
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
        return;
      }
      
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? {...t, newNote: ''} : t
      ));
      
      await fetchTickets();
      toast.success("Note added successfully");
      
    } catch (err) {
      console.error("Error in handleAddTicketNote:", err);
      toast.error("Failed to add note");
    }
  };

  const handleSetDueDate = async (ticketId: string, newDueDate: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ due_date: newDueDate })
        .eq('id', ticketId);

      if (error) {
        console.error("Error setting due date:", error);
        toast.error("Failed to set due date");
        return;
      }

      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, due_date: newDueDate } : ticket
      ));
      toast.success("Due date updated successfully");
    } catch (error) {
      console.error("Error setting due date:", error);
      toast.error("Failed to set due date");
    }
  };

  const handleReplyToReporter = (ticketId: string) => {
    setActiveTicketId(ticketId);
    setReplyDialogOpen(true);
  };

  const sendReplyToReporter = async () => {
    if (!activeTicketId || !replyMessage.trim()) return;
    
    try {
      const ticket = tickets.find(t => t.id === activeTicketId);
      if (!ticket || !ticket.reporter) {
        toast.error("Cannot find reporter information");
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to reply");
        return;
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
          return;
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
          related_ticket: activeTicketId,
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
        .eq('id', activeTicketId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching ticket:", fetchError);
        toast.error("Failed to update ticket notes");
        return;
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
        .eq('id', activeTicketId);
        
      if (updateError) {
        console.error("Error updating ticket notes:", updateError);
        toast.error("Failed to record reply in ticket history");
        return;
      }
      
      setReplyDialogOpen(false);
      setActiveTicketId(null);
      setReplyMessage('');
      await fetchTickets();
      toast.success("Reply recorded in ticket history");
      
    } catch (err) {
      console.error("Error in sendReplyToReporter:", err);
      toast.error("Failed to send reply");
    }
  };

  const toggleTicketExpanded = (ticketId: string) => {
    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId ? { ...ticket, expanded: !ticket.expanded } : ticket
    ));
  };

  const updateTicketNoteField = (ticketId: string, value: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? {...t, newNote: value} : t
    ));
  };

  return {
    tickets,
    ticketStats,
    isLoading,
    activeTicketId,
    replyDialogOpen,
    replyMessage,
    fetchTickets,
    handleUpdateTicketStatus,
    handleUpdateTicketPriority,
    handleAddTicketNote,
    handleSetDueDate,
    handleReplyToReporter,
    sendReplyToReporter,
    toggleTicketExpanded,
    updateTicketNoteField,
    setReplyMessage,
    setReplyDialogOpen
  };
}

// utils/ticketUtils.ts - Utility functions for ticket data transformation
import { Ticket, KanbanData, GanttTask } from '../types';

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

export const getKanbanData = (tickets: Ticket[]): KanbanData => {
  const columns = {
    'new': { id: 'new', title: 'New', ticketIds: [] },
    'in-progress': { id: 'in-progress', title: 'In Progress', ticketIds: [] },
    'blocked': { id: 'blocked', title: 'Blocked', ticketIds: [] },
    'review': { id: 'review', title: 'Review', ticketIds: [] },
    'done': { id: 'done', title: 'Done', ticketIds: [] },
    'closed': { id: 'closed', title: 'Closed', ticketIds: [] }
  };
  
  const ticketMap: Record<string, Ticket> = {};
  
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
};

export const getGanttTasks = (tickets: Ticket[]): GanttTask[] => {
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
      type: 'task',
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
};
