
import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { BetaTicket, Ticket } from "@/types/types";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/ticket/KanbanBoard";
import { ReplyDialog } from "@/components/ticket/ReplyDialog";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface BetaTestingTabProps {
  userType: 'business' | 'job_seeker' | 'admin';
  userId: string;
  includeProjectTickets?: boolean;
}

export const BetaTestingTab: React.FC<BetaTestingTabProps> = ({ 
  userType, 
  userId,
  includeProjectTickets = false
}) => {
  const [betaTickets, setBetaTickets] = useState<BetaTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [projects, setProjects] = useState<{id: string, title: string}[]>([]);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());

  // Toggle ticket expansion
  const toggleTicketExpansion = (ticketId: string) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    fetchTickets();
    fetchProjects();
  }, [userId, userType, includeProjectTickets, projectFilter]);

  const fetchProjects = async () => {
    try {
      let query;
      if (userType === 'business') {
        query = supabase
          .from('business_projects')
          .select('project_id, title')
          .eq('business_id', userId);
      } else {
        query = supabase
          .from('business_projects')
          .select('project_id, title');
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      setProjects(data?.map(p => ({ id: p.project_id, title: p.title })) || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .eq('ticket_type', 'beta_testing');
      
      if (userType === 'business') {
        query = includeProjectTickets
          ? query.eq('reporter', userId)
          : query.or(`reporter.eq.${userId},assigned_to.eq.${userId}`);
      } else if (userType === 'job_seeker') {
        query = query.eq('reporter', userId);
      }
      
      if (projectFilter) {
        query = query.eq('project_id', projectFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Process tickets to ensure they have the required fields
      const processedTickets: BetaTicket[] = await Promise.all(
        (data || []).map(async (ticket: any) => {
          // Get reporter email
          let reporterEmail = null;
          if (ticket.reporter) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', ticket.reporter)
              .maybeSingle();
              
            reporterEmail = userData?.email;
          }
          
          // Process attachments if they're not already valid URLs
          let attachments = ticket.attachments || [];
          if (attachments.length > 0 && !attachments[0].startsWith('http')) {
            attachments = attachments.map((path: string) => {
              const { data } = supabase.storage
                .from('ticket-attachments')
                .getPublicUrl(path);
              return data.publicUrl;
            });
          }
          
          return {
            ...ticket,
            reporter_email: reporterEmail,
            health: ticket.health || 'needs-review',
            attachments
          };
        })
      );
      
      setBetaTickets(processedTickets);
    } catch (error) {
      console.error("Error fetching beta tickets:", error);
      toast.error("Failed to load beta tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to perform this action");
        return;
      }
      
      switch (action) {
        case 'updateStatus':
          await supabase
            .from('tickets')
            .update({ status: data })
            .eq('id', ticketId);
            
          toast.success("Status updated");
          break;
          
        case 'updateHealth':
          await supabase
            .from('tickets')
            .update({ health: data })
            .eq('id', ticketId);
            
          toast.success("Health status updated");
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
            
          const { data: userData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', user.id)
            .single();
            
          const userName = userData?.first_name
            ? `${userData.first_name} ${userData.last_name || ''}`
            : userData?.email || user.email || 'Unknown User';
            
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
            .update({ 
              notes: updatedNotes,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
            
          toast.success("Note added");
          break;
          
        default:
          console.warn(`Unknown action: ${action}`);
      }
      
      // Refresh tickets after action
      await fetchTickets();
      
    } catch (error) {
      console.error(`Error in handleTicketAction (${action}):`, error);
      toast.error("Failed to update ticket");
    }
  };

  const handleReplyToReporter = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReplyDialogOpen(true);
  };

  const stats = {
    total: betaTickets.length,
    green: betaTickets.filter(t => t.health === 'green').length,
    amber: betaTickets.filter(t => t.health === 'amber').length,
    red: betaTickets.filter(t => t.health === 'red').length,
    needsReview: betaTickets.filter(t => t.health === 'needs-review').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Select value={projectFilter || ''} onValueChange={(value) => setProjectFilter(value || null)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
            <Button 
              variant={viewMode === 'kanban' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              Kanban View
            </Button>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchTickets}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs font-medium text-muted-foreground">Total</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs font-medium text-muted-foreground">Needs Review</div>
            <div className="text-xl font-bold">{stats.needsReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center bg-red-50">
            <div className="text-xs font-medium text-red-600">Red</div>
            <div className="text-xl font-bold text-red-700">{stats.red}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center bg-amber-50">
            <div className="text-xs font-medium text-amber-600">Amber</div>
            <div className="text-xl font-bold text-amber-700">{stats.amber}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center bg-green-50">
            <div className="text-xs font-medium text-green-600">Green</div>
            <div className="text-xl font-bold text-green-700">{stats.green}</div>
          </CardContent>
        </Card>
      </div>
      
      {viewMode === 'list' ? (
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="needs-review">Needs Review</TabsTrigger>
            <TabsTrigger value="red">Red</TabsTrigger>
            <TabsTrigger value="amber">Amber</TabsTrigger>
            <TabsTrigger value="green">Green</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <TicketDashboard 
              initialTickets={betaTickets}
              onRefresh={fetchTickets}
              onTicketAction={handleTicketAction}
              showTimeTracking={false}
              userId={userId}
              expandedTickets={expandedTickets}
              toggleTicketExpansion={toggleTicketExpansion}
            />
          </TabsContent>
          
          <TabsContent value="needs-review">
            <TicketDashboard 
              initialTickets={betaTickets.filter(t => t.health === 'needs-review')}
              onRefresh={fetchTickets}
              onTicketAction={handleTicketAction}
              showTimeTracking={false}
              userId={userId}
              expandedTickets={expandedTickets}
              toggleTicketExpansion={toggleTicketExpansion}
            />
          </TabsContent>
          
          <TabsContent value="red">
            <TicketDashboard 
              initialTickets={betaTickets.filter(t => t.health === 'red')}
              onRefresh={fetchTickets}
              onTicketAction={handleTicketAction}
              showTimeTracking={false}
              userId={userId}
              expandedTickets={expandedTickets}
              toggleTicketExpansion={toggleTicketExpansion}
            />
          </TabsContent>
          
          <TabsContent value="amber">
            <TicketDashboard 
              initialTickets={betaTickets.filter(t => t.health === 'amber')}
              onRefresh={fetchTickets}
              onTicketAction={handleTicketAction}
              showTimeTracking={false}
              userId={userId}
              expandedTickets={expandedTickets}
              toggleTicketExpansion={toggleTicketExpansion}
            />
          </TabsContent>
          
          <TabsContent value="green">
            <TicketDashboard 
              initialTickets={betaTickets.filter(t => t.health === 'green')}
              onRefresh={fetchTickets}
              onTicketAction={handleTicketAction}
              showTimeTracking={false}
              userId={userId}
              expandedTickets={expandedTickets}
              toggleTicketExpansion={toggleTicketExpansion}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <KanbanBoard 
          tickets={betaTickets}
          onStatusChange={(ticketId, newStatus) => 
            handleTicketAction(ticketId, 'updateStatus', newStatus)
          }
          onTicketClick={(ticket) => {
            console.log("Ticket clicked:", ticket.id);
            toggleTicketExpansion(ticket.id);
          }}
        />
      )}
      
      {/* Reply Dialog */}
      {selectedTicket && (
        <ReplyDialog 
          isOpen={replyDialogOpen}
          setIsOpen={setReplyDialogOpen}
          ticket={selectedTicket}
          onSendReply={async (message) => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              
              if (!user || !selectedTicket.reporter) {
                toast.error("Cannot send reply");
                return;
              }
              
              // Send a message to the reporter
              const { error: messageError } = await supabase
                .from('user_messages')
                .insert({
                  sender_id: user.id,
                  recipient_id: selectedTicket.reporter,
                  subject: `Re: ${selectedTicket.title}`,
                  message: message,
                  related_ticket: selectedTicket.id,
                  read: false
                });
                
              if (messageError) {
                console.error("Error sending message:", messageError);
                toast.error("Failed to send reply");
                return false;
              }
              
              // Add note to ticket history
              await handleTicketAction(selectedTicket.id, 'addNote', `Reply sent: ${message}`);
              
              toast.success("Reply sent successfully");
              return true;
            } catch (error) {
              console.error("Error sending reply:", error);
              toast.error("Failed to send reply");
              return false;
            }
          }}
        />
      )}
    </div>
  );
};
