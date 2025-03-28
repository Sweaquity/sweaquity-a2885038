
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Logs time for a ticket
 */
export const handleLogTime = async (ticketId: string, hours: number, description: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in to log time");
      return false;
    }
    
    // First, create the time entry
    const { error: timeEntryError } = await supabase
      .from('time_entries')
      .insert({
        ticket_id: ticketId,
        user_id: session.user.id,
        description: description,
        hours_logged: hours,
        start_time: new Date().toISOString(),
        end_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString()
      });
      
    if (timeEntryError) throw timeEntryError;
    
    // Then, update the ticket's hours_logged field
    const { data: ticketData, error: ticketFetchError } = await supabase
      .from('tickets')
      .select('hours_logged')
      .eq('id', ticketId)
      .single();
      
    if (ticketFetchError) throw ticketFetchError;
    
    const currentHours = ticketData.hours_logged || 0;
    const newHours = currentHours + hours;
    
    const { error: ticketUpdateError } = await supabase
      .from('tickets')
      .update({ hours_logged: newHours })
      .eq('id', ticketId);
      
    if (ticketUpdateError) throw ticketUpdateError;
    
    toast.success("Time logged successfully");
    return true;
  } catch (error) {
    console.error("Error logging time:", error);
    toast.error("Failed to log time");
    return false;
  }
};
