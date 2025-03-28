
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Creates a new ticket
 */
export const createTicket = async (ticketData: any, businessId: string) => {
  try {
    const ticketToCreate = {
      ...ticketData,
      reporter: businessId,
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
    return data;
  } catch (error) {
    console.error("Error creating ticket:", error);
    toast.error("Failed to create ticket");
    return null;
  }
};
