
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Ticket } from "@/types/types";
import { DropResult } from "react-beautiful-dnd";

export const useProjectsTabs = (userId?: string) => {
  const [activeTab, setActiveTab] = useState("all-tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [taskStats, setTaskStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    highPriority: 0
  });
  const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showGantt, setShowGantt] = useState(false);
  const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProjects();
      loadTickets();
    }
  }, [userId]);
  
  useEffect(() => {
    if (userId) {
      loadTickets();
    }
  }, [userId, selectedProject]);

  const fetchProjects = async () => {
    if (!userId) return;
    
    try {
      const { data: projectsData, error } = await supabase
        .from('jobseeker_active_projects')
        .select('project_id, project_title')
        .eq('user_id', userId)
        .order('project_title', { ascending: true });
      
      if (error) throw error;
      
      const uniqueProjects = Array.from(
        new Map(projectsData.map(item => [item.project_id, item])).values()
      );
      
      setProjects(uniqueProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const loadTickets = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('tickets')
        .select(`
          *,
          accepted_jobs:job_app_id(
            equity_agreed,
            jobs_equity_allocated
          )
        `)
        .or(`assigned_to.eq.${userId},reporter.eq.${userId}`);
      
      if (selectedProject && selectedProject !== "all") {
        query = query.eq('project_id', selectedProject);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const filteredTickets = (data || []).filter(ticket => {
        if (ticket.accepted_jobs && 
            ticket.accepted_jobs.equity_agreed > 0 && 
            ticket.accepted_jobs.jobs_equity_allocated >= ticket.accepted_jobs.equity_agreed) {
          return false;
        }
        return true;
      });
      
      const processedTickets = filteredTickets.map(ticket => ({
        ...ticket,
        ticket_type: ticket.ticket_type || "",
        description: ticket.description || "",
        equity_agreed: ticket.accepted_jobs?.equity_agreed || 0,
        equity_allocated: ticket.accepted_jobs?.jobs_equity_allocated || 0
      }));
      
      setTickets(processedTickets);
      
      const stats = {
        total: processedTickets.length,
        open: processedTickets.filter(t => t.status !== 'done' && t.status !== 'closed').length,
        closed: processedTickets.filter(t => t.status === 'done' || t.status === 'closed').length,
        highPriority: processedTickets.filter(t => t.priority === 'high').length
      };
      
      setTaskStats(stats);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      switch (action) {
        case 'updateStatus': {
          const { error } = await supabase
            .from('tickets')
            .update({ status: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, status: data } : t)
          );
          
          toast.success("Status updated");
          break;
        }
        
        case 'updatePriority': {
          const { error } = await supabase
            .from('tickets')
            .update({ priority: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, priority: data } : t)
          );
          
          toast.success("Priority updated");
          break;
        }
        
        case 'updateDueDate': {
          const { error } = await supabase
            .from('tickets')
            .update({ due_date: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, due_date: data } : t)
          );
          
          toast.success("Due date updated");
          break;
        }
        
        case 'updateCompletionPercentage': {
          const { error } = await supabase
            .from('tickets')
            .update({ completion_percentage: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, completion_percentage: data } : t)
          );
          
          toast.success("Completion percentage updated");
          break;
        }
        
        case 'updateEstimatedHours': {
          const { error } = await supabase
            .from('tickets')
            .update({ estimated_hours: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, estimated_hours: data } : t)
          );
          
          toast.success("Estimated hours updated");
          break;
        }
        
        case 'addNote': {
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('notes')
            .eq('id', ticketId)
            .single();
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();
          
          const userName = profileData ? 
            `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : 
            'User';
          
          const newNote = {
            id: Date.now().toString(),
            user: userName,
            timestamp: new Date().toISOString(),
            comment: data
          };
          
          const currentNotes = ticketData?.notes || [];
          const updatedNotes = [...currentNotes, newNote];
          
          await supabase
            .from('tickets')
            .update({ notes: updatedNotes })
            .eq('id', ticketId);
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, notes: updatedNotes } : t)
          );
          
          toast.success("Note added");
          break;
        }
        
        case 'refreshTicket': {
          const { data: refreshedTicket, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', ticketId)
            .single();
            
          if (error) throw error;
          
          if (refreshedTicket) {
            setTickets(prevTickets => 
              prevTickets.map(t => t.id === ticketId ? refreshedTicket : t)
            );
          }
          
          break;
        }
        
        case 'deleteTicket': {
          const { error } = await supabase
            .from('tickets')
            .delete()
            .eq('id', ticketId);
            
          if (error) throw error;
          
          setTickets(prevTickets => 
            prevTickets.filter(t => t.id !== ticketId)
          );
          
          toast.success("Ticket deleted successfully");
          break;
        }
        
        default:
          console.warn("Unknown action:", action);
      }
    } catch (error) {
      console.error("Error handling ticket action:", error);
      toast.error("Failed to update ticket");
    }
  };

  const confirmTicketDeletion = (ticket: Ticket) => {
    setTicketToDelete(ticket);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    
    try {
      await handleTicketAction(ticketToDelete.id, 'deleteTicket', null);
      setIsDeleteDialogOpen(false);
      setTicketToDelete(null);
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  };
  
  const handleLogTime = (ticketId: string) => {
    if (!userId) {
      toast.error("User ID not found");
      return;
    }
    
    setSelectedTicketId(ticketId);
    setIsTimeLogDialogOpen(true);
  };

  const handleTimeLogged = () => {
    loadTickets();
  };

  const handleRefresh = () => {
    loadTickets();
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleCreateTicket = () => {
    setIsCreateTicketDialogOpen(true);
  };

  const handleTicketCreated = async (ticketData: any): Promise<void> => {
    try {
      if (!userId) {
        toast.error("User ID not found");
        return;
      }
      
      const ticketToCreate = {
        ...ticketData,
        reporter: userId,
        created_at: new Date().toISOString(),
        ticket_type: ticketData.ticket_type || "task",
        status: "todo",
        priority: ticketData.priority || "medium",
        health: ticketData.health || "good"
      };
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketToCreate)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Ticket created successfully");
      if (data) {
        setTickets([data, ...tickets]);
      }
      setIsCreateTicketDialogOpen(false);
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    }
  };

  const getActiveTickets = () => {
    switch (activeTab) {
      case "project-tasks":
        return tickets.filter(t => t.ticket_type === "task");
      case "project-tickets":
        return tickets.filter(t => t.ticket_type === "ticket");
      case "beta-testing":
        return tickets.filter(t => 
          t.ticket_type === "beta_testing" || 
          t.ticket_type === "beta-test" || 
          t.ticket_type === "beta-testing"
        );
      default:
        return tickets;
    }
  };

  const toggleKanbanView = () => {
    setShowKanban(!showKanban);
    if (showKanban) {
      setShowGantt(false);
    }
  };

  const toggleGanttView = () => {
    setShowGantt(!showGantt);
    if (showGantt) {
      setShowKanban(false);
    }
  };

  const toggleTicketExpansion = (ticketId: string) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) {
      return;
    }
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    const newStatus = destination.droppableId;
    handleTicketAction(draggableId, 'updateStatus', newStatus);
  };

  return {
    activeTab,
    setActiveTab,
    tickets,
    loading,
    projects,
    selectedProject,
    taskStats,
    isCreateTicketDialogOpen,
    setIsCreateTicketDialogOpen,
    showKanban,
    showGantt,
    isTimeLogDialogOpen,
    setIsTimeLogDialogOpen,
    selectedTicketId,
    expandedTickets,
    ticketToDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleTicketAction,
    confirmTicketDeletion,
    handleDeleteTicket,
    handleLogTime,
    handleTimeLogged,
    handleRefresh,
    handleProjectChange,
    handleCreateTicket,
    handleTicketCreated,
    getActiveTickets,
    toggleKanbanView,
    toggleGanttView,
    toggleTicketExpansion,
    handleDragEnd
  };
};
