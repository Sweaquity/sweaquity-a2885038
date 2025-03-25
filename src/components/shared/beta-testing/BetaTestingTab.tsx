
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Ticket } from "@/types/types";

interface BetaTestingTabProps {
  userType: 'business' | 'job_seeker';
  userId?: string;
  includeProjectTickets?: boolean;
}

export const BetaTestingTab = ({ 
  userType, 
  userId, 
  includeProjectTickets = false 
}: BetaTestingTabProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tickets");
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (userId) {
      loadTickets(userId);
    }
  }, [userId, userType]);

  const loadTickets = async (userId: string) => {
    try {
      setLoading(true);
      
      // Find the right field to filter based on user type
      const userField = userType === 'business' ? 'reporter' : 'assigned_to';
      
      // Query tickets
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq(userField, userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const processedTickets = (data || []).map(ticket => ({
        ...ticket,
        expanded: !!expandedTickets[ticket.id]
      }));
      
      setTickets(processedTickets);
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
        case 'updateStatus':
          await supabase
            .from('tickets')
            .update({ status: data })
            .eq('id', ticketId);
          
          toast.success("Status updated");
          break;
        
        case 'updatePriority':
          await supabase
            .from('tickets')
            .update({ priority: data })
            .eq('id', ticketId);
          
          toast.success("Priority updated");
          break;
        
        case 'updateDueDate':
          await supabase
            .from('tickets')
            .update({ due_date: data })
            .eq('id', ticketId);
          
          toast.success("Due date updated");
          break;
        
        case 'addNote':
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
          
          toast.success("Note added");
          break;
        
        default:
          console.warn("Unknown action:", action);
      }
      
      // Reload tickets to get updated data
      if (userId) {
        await loadTickets(userId);
      }
    } catch (error) {
      console.error("Error handling ticket action:", error);
      toast.error("Failed to update ticket");
    }
  };

  const handleRefresh = () => {
    if (userId) {
      loadTickets(userId);
    }
  };

  const handleToggleTicket = (ticketId: string, isExpanded: boolean) => {
    console.log("Toggle ticket:", ticketId, "expanded:", isExpanded);
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: isExpanded
    }));
    
    // Also update the tickets array
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, expanded: isExpanded } : ticket
      )
    );
  };

  if (!userId) {
    return <div>Please log in to view tickets.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Beta Testing Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="tickets">All Tickets</TabsTrigger>
              {includeProjectTickets && (
                <>
                  <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
                  <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
                </>
              )}
            </TabsList>
            
            <TabsContent value="tickets">
              <TicketDashboard 
                initialTickets={tickets}
                onRefresh={handleRefresh}
                onTicketAction={handleTicketAction}
                onToggleTicket={handleToggleTicket}
                showTimeTracking={userType === 'job_seeker'}
                userId={userId}
              />
            </TabsContent>
            
            {includeProjectTickets && (
              <>
                <TabsContent value="project-tasks">
                  <TicketDashboard 
                    initialTickets={tickets.filter(t => t.task_id)}
                    onRefresh={handleRefresh}
                    onTicketAction={handleTicketAction}
                    onToggleTicket={handleToggleTicket}
                    showTimeTracking={userType === 'job_seeker'}
                    userId={userId}
                  />
                </TabsContent>
                
                <TabsContent value="project-tickets">
                  <TicketDashboard 
                    initialTickets={tickets.filter(t => t.project_id && !t.task_id)}
                    onRefresh={handleRefresh}
                    onTicketAction={handleTicketAction}
                    onToggleTicket={handleToggleTicket}
                    showTimeTracking={userType === 'job_seeker'}
                    userId={userId}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
