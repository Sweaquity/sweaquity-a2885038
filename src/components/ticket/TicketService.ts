
import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/types";
import { toast } from "sonner";

export class TicketService {
  // Method to check if a ticket can be deleted
  static async canDeleteTicket(ticketId: string): Promise<boolean> {
    try {
      // Check for time entries
      const { data: timeEntries, error: timeError } = await supabase
        .from("time_entries")
        .select("id")
        .eq("ticket_id", ticketId)
        .limit(1);

      if (timeError) {
        throw timeError;
      }

      // If there are any time entries, ticket cannot be deleted
      if (timeEntries && timeEntries.length > 0) {
        toast.error("Cannot delete ticket with logged time entries");
        return false;
      }

      // Check ticket completion percentage
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .select("completion_percentage")
        .eq("id", ticketId)
        .single();

      if (ticketError) {
        throw ticketError;
      }

      // If completion percentage is greater than 0, ticket cannot be deleted
      if (ticket && ticket.completion_percentage > 0) {
        toast.error("Cannot delete ticket with completion progress");
        return false;
      }

      return true;
    } catch (error: any) {
      console.error("Error checking if ticket can be deleted:", error);
      toast.error("Error checking if ticket can be deleted");
      return false;
    }
  }

  // Method to delete a ticket
  static async deleteTicket(ticketId: string, userId: string): Promise<boolean> {
    try {
      // First check if the ticket can be deleted
      const canDelete = await this.canDeleteTicket(ticketId);
      if (!canDelete) {
        return false;
      }

      // Use the database function for soft deletion
      const { data, error } = await supabase.rpc("soft_delete_ticket", {
        ticket_id: ticketId,
        user_id: userId,
      });

      if (error) {
        console.error("Error in soft_delete_ticket:", error);
        // Create a user-friendly error message
        let errorMessage = "Failed to delete ticket";
        if (error.message.includes("time entries")) {
          errorMessage = "Cannot delete ticket with logged time entries";
        } else if (error.message.includes("completion progress")) {
          errorMessage = "Cannot delete ticket with completion progress";
        }
        
        throw new Error(errorMessage);
      }

      return true;
    } catch (error: any) {
      console.error("Error deleting ticket:", error);
      // Don't show toast here, let the calling component handle it
      throw error;
    }
  }

  // Method to get a single ticket by ID
  static async getTicketById(ticketId: string): Promise<Ticket> {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (error) {
        throw error;
      }

      return data as Ticket;
    } catch (error: any) {
      console.error("Error fetching ticket:", error);
      toast.error("Failed to fetch ticket details");
      throw error;
    }
  }
}
