
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Ticket } from "@/types/types";

/**
 * Handles various ticket actions like updating status, priority, etc.
 */
export const handleTicketAction = async (
  ticketId: string, 
  action: string, 
  data: any, 
  businessId: string,
  tickets: Ticket[], 
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>
) => {
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
          .from('businesses')
          .select('company_name')
          .eq('businesses_id', businessId)
          .single();
        
        const userName = profileData ? profileData.company_name : 'Business';
        
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
      
      default:
        console.warn("Unknown action:", action);
    }
  } catch (error) {
    console.error("Error handling ticket action:", error);
    toast.error("Failed to update ticket");
  }
};
