
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { PercentIcon, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TimeTrackerProps {
  ticketId: string;
  userId: string;
}

interface TimeEntry {
  id: string;
  ticket_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  hours_logged?: number;
  description: string;
}

export function TimeTracker({ ticketId, userId }: TimeTrackerProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [ticketExists, setTicketExists] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('timeTracking');

  useEffect(() => {
    if (ticketId) {
      checkTicketExists();
      fetchTicketDetails();
      fetchTimeEntries();
      fetchTaskDetails();
    } else {
      setLoading(false);
    }
  }, [ticketId]);

  const fetchTaskDetails = async () => {
    if (!ticketId) return;
    
    try {
      // First get the ticket to find the task_id
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('task_id, completion_percentage, title, description, status, priority, health')
        .eq('id', ticketId)
        .maybeSingle();
        
      if (ticketError) {
        console.error('Error fetching ticket details:', ticketError);
        return;
      }
      
      // Set completion percentage from ticket
      if (ticketData && ticketData.completion_percentage !== null) {
        setCompletionPercentage(ticketData.completion_percentage || 0);
      }

      // Store ticket data
      if (ticketData) {
        setTicket(ticketData);
      }
      
      // Then get the task details if task_id exists
      if (ticketData && ticketData.task_id) {
        const { data: taskData, error: taskError } = await supabase
          .from('project_sub_tasks')
          .select('*')
          .eq('task_id', ticketData.task_id)
          .maybeSingle();
          
        if (taskError) {
          console.error('Error fetching task details:', taskError);
          return;
        }
        
        setTaskDetails(taskData);
      }
    } catch (error) {
      console.error('Error in fetchTaskDetails:', error);
    }
  };

  const checkTicketExists = async () => {
    if (!ticketId) return;
    
    try {
      // First check if it exists in tickets table
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('id')
        .eq('id', ticketId)
        .maybeSingle();
        
      if (!ticketsError && ticketsData) {
        console.log('Ticket found in tickets table');
        setTicketExists(true);
        return;
      }
      
      // If not found in tickets table, check project_sub_tasks
      const { data: subTaskData, error: subTaskError } = await supabase
        .from('project_sub_tasks')
        .select('task_id')
        .eq('task_id', ticketId)
        .maybeSingle();
        
      if (!subTaskError && subTaskData) {
        console.log('Ticket found in project_sub_tasks table');
        setTicketExists(true);
        return;
      }
      
      console.warn('Ticket not found in either tickets or project_sub_tasks tables');
      setTicketExists(false);
      
    } catch (error) {
      console.error('Error checking ticket existence:', error);
      setTicketExists(false);
    }
  };

  const fetchTicketDetails = async () => {
    if (!ticketId) return;
    
    try {
      // First try to get from tickets table
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .maybeSingle();
        
      if (!ticketsError && ticketsData) {
        setTicket(ticketsData);
        return;
      }
      
      // If not found, try project_sub_tasks
      const { data: subTaskData, error: subTaskError } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('task_id', ticketId)
        .maybeSingle();
        
      if (!subTaskError && subTaskData) {
        setTicket(subTaskData);
        return;
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const fetchTimeEntries = async () => {
    if (!ticketId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      setTimeEntries(data || []);
      
      // Calculate total hours
      const total = data?.reduce((sum, entry) => {
        return sum + (entry.hours_logged || 0);
      }, 0) || 0;
      
      setTotalHours(total);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error("Failed to load time entries");
    } finally {
      setLoading(false);
    }
  };

  const updateCompletionPercentage = async () => {
    try {
      // Update ticket completion percentage
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ completion_percentage: completionPercentage })
        .eq('id', ticketId);
        
      if (ticketError) throw ticketError;

      // If the ticket has a task_id, also update the task's completion percentage
      if (ticket?.task_id) {
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({ completion_percentage: completionPercentage })
          .eq('task_id', ticket.task_id);
          
        if (taskError) throw taskError;
      }

      toast.success(`Completion percentage updated to ${completionPercentage}%`);
      
      // Refresh task details
      fetchTaskDetails();
    } catch (error) {
      console.error('Error updating completion percentage:', error);
      toast.error("Failed to update completion percentage");
    }
  };

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="text-green-500" />;
      case 'todo':
        return <Clock className="text-blue-500" />;
      default:
        return <AlertCircle className="text-amber-500" />;
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading time tracking data...</div>;

  if (!ticketId) return <div className="text-center p-8">Please select a ticket to track time.</div>;
  
  if (!ticketExists) return <div className="text-center p-8 text-red-500">This ticket doesn't exist in the database.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{ticket?.title || 'Untitled Ticket'}</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                {ticket?.description || 'No description'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {ticket?.status && (
                <Badge variant={ticket.status === 'done' ? 'default' : ticket.status === 'todo' ? 'outline' : 'secondary'}>
                  <span className="flex items-center">
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1 capitalize">{ticket.status}</span>
                  </span>
                </Badge>
              )}
              {ticket?.priority && (
                <Badge variant="outline" className={
                  ticket.priority === 'high' ? 'border-red-500 text-red-500' : 
                  ticket.priority === 'medium' ? 'border-amber-500 text-amber-500' : 
                  'border-blue-500 text-blue-500'
                }>
                  {ticket.priority}
                </Badge>
              )}
            </div>
          </div>
          {completionPercentage > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="timeTracking">Time Tracking</TabsTrigger>
              <TabsTrigger value="progressTracking">Progress Tracking</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeTracking">
              <div className="mb-4">
                <p className="text-lg font-semibold">
                  Total time logged: <span className="text-blue-600">{totalHours.toFixed(2)} hours</span>
                </p>
              </div>
              
              {timeEntries.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Time Entries</h3>
                  <div className="space-y-2">
                    {timeEntries.map(entry => (
                      <div key={entry.id} className="border p-4 rounded-lg">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{entry.description || "No description"}</div>
                            <div className="text-sm text-gray-500">
                              {entry.start_time && formatDate(entry.start_time)}
                              {entry.end_time && ` to ${formatDate(entry.end_time)}`}
                            </div>
                          </div>
                          <div className="font-semibold text-primary">
                            {entry.hours_logged ? `${entry.hours_logged.toFixed(2)} hours` : 'In progress'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No time entries recorded for this ticket.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="progressTracking">
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-medium mb-2 block">Task Completion Progress</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update the completion percentage for this task. Task equity will be allocated based on this value.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label>Completion Percentage:</Label>
                      <span className="font-semibold text-lg">{completionPercentage}%</span>
                    </div>
                    
                    <Slider
                      value={[completionPercentage]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(value) => setCompletionPercentage(value[0])}
                      className="mb-4"
                    />
                    
                    <Button 
                      onClick={updateCompletionPercentage}
                      className="w-full"
                    >
                      <PercentIcon className="mr-2 h-4 w-4" />
                      Update Progress
                    </Button>
                  </div>
                </div>
                
                {taskDetails && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-medium mb-2">Task Details</h3>
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Title:</span>
                        <span>{taskDetails.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Description:</span>
                        <span>{taskDetails.description || 'No description'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Timeframe:</span>
                        <span>{taskDetails.timeframe}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Equity Allocation:</span>
                        <span>{taskDetails.equity_allocation}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Completion:</span>
                        <span>{taskDetails.completion_percentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <span>{taskDetails.status}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
