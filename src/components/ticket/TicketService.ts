
import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/types";

export const TicketService = {
  async getTickets(): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  },
  
  async getTicketById(id: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching ticket ${id}:`, error);
      return null;
    }
  },
  
  async updateTicketStatus(id: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error updating ticket ${id} status:`, error);
      return false;
    }
  },
  
  async createTicket(ticketData: Partial<Ticket>): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          ...ticketData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      return null;
    }
  },
  
  async logTime(ticketId: string, userId: string, hours: number, description: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          description: description,
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString(),
          hours_logged: hours
        });
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error logging time:', error);
      return false;
    }
  }
};

export default TicketService;
