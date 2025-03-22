import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket } from '@/types/types';
import { KanbanBoard } from '@/components/ticket/KanbanBoard';
import TicketDashboard from '@/components/ticket/TicketDashboard';
import ProjectsOverview from '@/components/job-seeker/ProjectsOverview';
import { toast } from 'sonner';

interface BetaTestingTabProps {
  userType: 'job_seeker' | 'business' | 'admin';
  userId?: string;
  includeProjectTickets?: boolean;
}

export const BetaTestingTab: React.FC<BetaTestingTabProps> = ({ 
  userType, 
  userId,
  includeProjectTickets = false
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'basic' | 'full'>('basic');
  const [showKanban, setShowKanban] = useState(true);

  const loadTickets = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('tickets')
        .select('*');

      if (userType === 'job_seeker') {
        query = query.or(`reporter.eq.${userId},assigned_to.eq.${userId}`);
      } else if (userType === 'business') {
        if (includeProjectTickets) {
          const { data: projectIds } = await supabase
            .from('business_projects')
            .select('project_id')
            .eq('business_id', userId);
            
          if (projectIds && projectIds.length > 0) {
            const ids = projectIds.map(p => p.project_id);
            query = query.or(`reporter.eq.${userId},assigned_to.eq.${userId},project_id.in.(${ids.join(',')})`);
          } else {
            query = query.or(`reporter.eq.${userId},assigned_to.eq.${userId}`);
          }
        } else {
          query = query.or(`reporter.eq.${userId},assigned_to.eq.${userId}`);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tickets:', error);
        toast.error('Failed to load tickets');
        return;
      }
      
      if (data) {
        const formattedTickets: Ticket[] = data.map(ticket => ({
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          health: ticket.health,
          reporter: ticket.reporter,
          assigned_to: ticket.assigned_to,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          due_date: ticket.due_date,
          notes: ticket.notes || [],
          created_by: ticket.created_by,
          task_id: ticket.task_id,
          project_id: ticket.project_id,
          job_app_id: ticket.job_app_id
        }));
        
        setTickets(formattedTickets);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error('Error in loadTickets:', err);
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType, includeProjectTickets]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [userProjectTickets, setUserProjectTickets] = useState<any[]>([]);
  
  const loadActiveProjects = useCallback(async () => {
    if (!userId || userType !== 'job_seeker') return;
    
    try {
      const { data, error } = await supabase
        .from('jobseeker_active_projects')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching active projects:', error);
        return;
      }
      
      setActiveProjects(data || []);
      
      if (data && data.length > 0) {
        const ticketIds = data
          .filter(project => project.ticket_id)
          .map(project => project.ticket_id);
          
        if (ticketIds.length > 0) {
          const { data: ticketData, error: ticketError } = await supabase
            .from('tickets')
            .select('*')
            .in('id', ticketIds);
            
          if (ticketError) {
            console.error('Error fetching project tickets:', ticketError);
            return;
          }
          
          setUserProjectTickets(ticketData || []);
        }
      }
    } catch (err) {
      console.error('Error loading active projects:', err);
    }
  }, [userId, userType]);

  useEffect(() => {
    if (userType === 'job_seeker') {
      loadActiveProjects();
    }
  }, [loadActiveProjects, userType]);

  const handleTicketAction = async (ticketId: string, action: string, data?: any) => {
    try {
      if (action === 'log-time') {
        if (!data || !data.hours || isNaN(parseFloat(data.hours))) {
          toast.error('Please enter valid hours');
          return;
        }
        
        const { data: userData } = await supabase.auth.getUser();
        
        const timeEntry = {
          ticket_id: ticketId,
          user_id: userData.user?.id,
          hours_logged: parseFloat(data.hours),
          description: data.description || '',
          start_time: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('time_entries')
          .insert(timeEntry);
          
        if (error) {
          console.error('Error logging time:', error);
          toast.error('Failed to log time');
          return;
        }
        
        toast.success('Time logged successfully');
        loadActiveProjects();
      }
    } catch (error) {
      console.error('Error in handleTicketAction:', error);
      toast.error('Failed to perform action');
    }
  };

  const refreshData = () => {
    loadTickets();
    if (userType === 'job_seeker') {
      loadActiveProjects();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Live Projects</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setViewMode(viewMode === 'basic' ? 'full' : 'basic')}
          >
            {viewMode === 'basic' ? 'Show Full Dashboard' : 'Show Basic View'}
          </Button>
          
          {viewMode === 'basic' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowKanban(!showKanban)}
            >
              {showKanban ? 'Hide Kanban Board' : 'Show Kanban Board'}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshData}
          >
            Refresh Data
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'full' ? (
            <TicketDashboard initialTickets={tickets} onRefresh={refreshData} />
          ) : (
            userType === 'job_seeker' ? (
              <ProjectsOverview 
                currentProjects={activeProjects}
                pastProjects={[]}
                onDocumentAction={(id, action) => {}}
                userTickets={userProjectTickets}
                onTicketAction={handleTicketAction}
                refreshTickets={refreshData}
              />
            ) : (
              <Tabs defaultValue="active-tickets">
                <TabsList>
                  <TabsTrigger value="active-tickets">Active Tickets</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active-tickets">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tickets.length === 0 ? (
                        <div className="text-center p-6">
                          <p className="text-muted-foreground">No active tickets found</p>
                        </div>
                      ) : (
                        <>
                          {showKanban ? (
                            <KanbanBoard 
                              items={tickets}
                              onItemClick={(ticket) => {
                                // Handle click
                              }}
                            />
                          ) : (
                            <div className="space-y-4">
                              {tickets.map(ticket => (
                                <div 
                                  key={ticket.id}
                                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                  <div className="flex justify-between">
                                    <h3 className="font-medium">{ticket.title}</h3>
                                    <Badge 
                                      variant="outline" 
                                      className={ticket.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                        ticket.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}
                                    >
                                      {ticket.priority}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                                  <div className="flex justify-between mt-2">
                                    <Badge>{ticket.status}</Badge>
                                    <span className="text-xs text-gray-500">
                                      {ticket.due_date ? `Due: ${new Date(ticket.due_date).toLocaleDateString()}` : 'No due date'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )
          )}
        </>
      )}
    </div>
  );
};

export default BetaTestingTab;
