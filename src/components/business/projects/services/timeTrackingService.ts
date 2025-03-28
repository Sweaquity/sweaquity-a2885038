
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
    
    const { error } = await supabase
      .from('time_entries')
      .insert({
        ticket_id: ticketId,
        user_id: session.user.id,
        description: description,
        hours_logged: hours,
        start_time: new Date().toISOString(),
        end_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString()
      });
      
    if (error) throw error;
    
    toast.success("Time logged successfully");
    return true;
  } catch (error) {
    console.error("Error logging time:", error);
    toast.error("Failed to log time");
    return false;
  }
};
