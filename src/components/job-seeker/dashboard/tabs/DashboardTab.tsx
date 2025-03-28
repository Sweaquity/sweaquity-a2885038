import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Ticket } from "@/types/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface DashboardTabProps {
  userId?: string;
}

export const DashboardTab = ({ userId }: DashboardTabProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      console.warn("User ID is not available yet.");
      return;
    }

    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('reporter', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        // Ensure all required properties are present
        const enhancedTickets = data.map(ticket => enhanceTicket(ticket));
        setTickets(enhancedTickets);
      } catch (err: any) {
        setError(err.message);
        toast.error("Failed to load tickets");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [userId]);

  // Fix the Ticket type conversion to ensure required properties are set
  const enhanceTicket = (ticket: any): Ticket => {
    return {
      id: ticket.id || '',
      title: ticket.title || '',
      description: ticket.description || '', // Ensure description is never undefined
      status: ticket.status || '',
      priority: ticket.priority || '',
      health: ticket.health || '',
      // Add other required fields with defaults
      expanded: false,
      newNote: '',
      system_info: '',
      reproduction_steps: '',
      replies: [],
      equity_points: 0,
      estimated_hours: 0,
      ticket_type: '',
      created_at: '',
      updated_at: '',
      created_by: '',
      assigned_to: '',
      project_id: '',
      task_id: '',
      due_date: '',
      notes: [],
    };
  };

  if (isLoading) {
    return <p>Loading tickets...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Your Tickets</h2>
      </CardHeader>
      <CardContent>
        {tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border p-4 rounded-lg">
                <h3 className="font-medium">{ticket.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Status: {ticket.status}
                </p>
                <Link to={`/tickets/${ticket.id}`}>
                  View Details
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No tickets found.</p>
        )}
      </CardContent>
    </Card>
  );
};
