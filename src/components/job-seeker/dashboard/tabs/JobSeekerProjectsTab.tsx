import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Ticket } from "@/types/types";

interface JobSeekerProjectsTabProps {
  userId: string;
  userData: any;
}

export const JobSeekerProjectsTab = ({ userId, userData }: JobSeekerProjectsTabProps) => {
  const [activeTab, setActiveTab] = useState("active");
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [completedTickets, setCompletedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [userId]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Failed to load tickets");
        setLoading(false);
        return;
      }

      const active = data.filter(ticket => ticket.status !== 'done' && ticket.status !== 'closed');
      const completed = data.filter(ticket => ticket.status === 'done' || ticket.status === 'closed');

      setActiveTickets(active);
      setCompletedTickets(completed);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any): Promise<void> => {
    try {
      let updateData: any = {};

      switch (action) {
        case 'updateStatus':
          updateData = { status: data };
          break;
        case 'updatePriority':
          updateData = { priority: data };
          break;
        case 'updateDueDate':
          updateData = { due_date: data };
          break;
        case 'updateCompletionPercentage':
          updateData = { completion_percentage: data };
          break;
        case 'updateEstimatedHours':
          updateData = { estimated_hours: data };
          break;
        case 'addNote':
          // Fetch existing notes, add the new note, and then update
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

          let notes = ticketData?.notes || [];
          const newNote = {
            user: userData.name || 'Unknown User',
            timestamp: new Date().toISOString(),
            comment: data
          };
          notes = [...notes, newNote];
          updateData = { notes: notes };
          break;
        default:
          console.warn(`Unknown action: ${action}`);
          return;
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) {
        console.error("Error updating ticket:", error);
        toast.error("Failed to update ticket");
        return;
      }

      toast.success("Ticket updated successfully");
      loadProjects(); // Refresh data
    } catch (error) {
      console.error("Error in handleTicketAction:", error);
      toast.error("Failed to perform action");
    }
  };

  const handleLogTime = async (ticketId: string, hours: number, description: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to log time");
        return;
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
      loadProjects();
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">Your Projects</h2>
        <p className="text-muted-foreground">
          Here's a list of projects you're currently working on.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="completed">Completed Projects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {activeTickets.length === 0 ? (
            <div className="text-center py-8">
              <p>No active projects found.</p>
            </div>
          ) : (
            <TicketDashboard 
              initialTickets={activeTickets}
              onRefresh={loadProjects}
              onTicketAction={handleTicketAction}
              showTimeTracking={true}
              userId={userId}
              onLogTime={handleLogTime}
              userCanEditStatus={true}
              userCanEditDates={true}
            />
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {completedTickets.length === 0 ? (
            <div className="text-center py-8">
              <p>No completed projects found.</p>
            </div>
          ) : (
            <TicketDashboard 
              initialTickets={completedTickets}
              onRefresh={loadProjects}
              onTicketAction={handleTicketAction}
              showTimeTracking={true}
              userId={userId}
              onLogTime={handleLogTime}
              userCanEditStatus={true}
              userCanEditDates={true}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
