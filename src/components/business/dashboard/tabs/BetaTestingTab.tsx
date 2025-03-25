
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCompletionReview } from "../../projects/TaskCompletionReview";
import { SharedBetaTestingTab } from "@/components/shared/beta-testing/BetaTestingTab";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { toast } from "sonner";
import { Ticket } from "@/types/types";

export const BetaTestingTab = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadTickets(user.id);
      }
    };
    
    getCurrentUser();
  }, []);

  const loadTickets = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or(`reporter.eq.${userId},assigned_to.eq.${userId}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTickets(data || []);
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

  if (!userId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="tickets">All Tickets</TabsTrigger>
              <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
              <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
              <TabsTrigger value="beta-tickets">Beta Testing Tickets</TabsTrigger>
              <TabsTrigger value="task-review">Task Completion Review</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tickets">
              <TicketDashboard 
                initialTickets={tickets}
                onRefresh={handleRefresh}
                onTicketAction={handleTicketAction}
              />
            </TabsContent>
            
            <TabsContent value="project-tasks">
              <TicketDashboard 
                initialTickets={tickets.filter(t => t.task_id)}
                onRefresh={handleRefresh}
                onTicketAction={handleTicketAction}
              />
            </TabsContent>
            
            <TabsContent value="project-tickets">
              <TicketDashboard 
                initialTickets={tickets.filter(t => t.project_id && !t.task_id)}
                onRefresh={handleRefresh}
                onTicketAction={handleTicketAction}
              />
            </TabsContent>
            
            <TabsContent value="beta-tickets">
              <SharedBetaTestingTab 
                userType="business" 
                userId={userId} 
                includeProjectTickets={true} 
              />
            </TabsContent>
            
            <TabsContent value="task-review">
              <TaskCompletionReview businessId={userId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
