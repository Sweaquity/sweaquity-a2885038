
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Play, Square, PercentIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

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
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
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

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [ticketId]);

  const fetchTaskDetails = async () => {
    if (!ticketId) return;
    
    try {
      // First get the ticket to find the task_id
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('task_id, completion_percentage')
        .eq('id', ticketId)
        .maybeSingle();
        
      if (ticketError || !ticketData || !ticketData.task_id) {
        console.error('Error fetching ticket details or task_id not found:', ticketError);
        return;
      }
      
      // Set completion percentage from ticket
      if (ticketData.completion_percentage !== null) {
        setCompletionPercentage(ticketData.completion_percentage || 0);
      }
      
      // Then get the task details
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

  const startTracking = async () => {
    if (!ticketId || !userId) {
      toast.error("Please select a ticket first");
      return;
    }
    
    if (!ticketExists) {
      toast.error("This ticket doesn't exist in the database");
      return;
    }
    
    const now = new Date();
    setStartTime(now);
    setIsTracking(true);
    
    // Create a new time entry
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          start_time: now.toISOString(),
          description: description
        })
        .select()
        .single();

      if (error) throw error;
      
      setTimeEntryId(data.id);
      
      // Start the timer to update elapsed time
      const intervalId = window.setInterval(() => {
        const currentTime = new Date();
        const elapsed = (currentTime.getTime() - now.getTime()) / 1000; // seconds
        setElapsedTime(elapsed);
      }, 1000);
      
      setTimer(intervalId);
    } catch (error) {
      console.error('Error starting time tracking:', error);
      toast.error("Failed to start time tracking");
      setIsTracking(false);
      setStartTime(null);
    }
  };

  const stopTracking = async () => {
    if (!isTracking || !timeEntryId || !startTime) return;
    
    const endTime = new Date();
    const hoursLogged = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // Convert ms to hours
    
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          hours_logged: hoursLogged,
          description: description
        })
        .eq('id', timeEntryId);

      if (error) throw error;
      
      // Clear timer
      if (timer) clearInterval(timer);
      setTimer(null);
      
      // Reset state
      setIsTracking(false);
      setStartTime(null);
      setTimeEntryId(null);
      setDescription('');
      setElapsedTime(0);
      
      toast.success("Time entry saved successfully");
      
      // Refresh time entries
      fetchTimeEntries();
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      toast.error("Failed to stop time tracking");
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

  if (loading) return <div className="flex justify-center p-8">Loading time tracking data...</div>;

  if (!ticketId) return <div className="text-center p-8">Please select a ticket to track time.</div>;
  
  if (!ticketExists) return <div className="text-center p-8 text-red-500">This ticket doesn't exist in the database.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ticket Tracking {ticket && `- ${ticket.title}`}</CardTitle>
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
              
              <div className="mb-4">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you working on?"
                  className="w-full p-2 border rounded-md mb-2"
                  disabled={isTracking}
                />
                
                {isTracking ? (
                  <div className="mb-4 space-y-4">
                    <div className="text-4xl font-mono text-center my-4 font-semibold text-primary">
                      {formatTime(elapsedTime)}
                    </div>
                    <Button
                      onClick={stopTracking}
                      className="w-full bg-red-500 hover:bg-red-600"
                      variant="destructive"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={startTracking}
                    className="w-full"
                    variant="default"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Tracking
                  </Button>
                )}
              </div>
              
              {timeEntries.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recent Time Entries</h3>
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
                    <p><strong>Title:</strong> {taskDetails.title}</p>
                    <p><strong>Description:</strong> {taskDetails.description || 'No description'}</p>
                    <p><strong>Timeframe:</strong> {taskDetails.timeframe}</p>
                    <p><strong>Equity Allocation:</strong> {taskDetails.equity_allocation}%</p>
                    <p><strong>Completion:</strong> {taskDetails.completion_percentage}%</p>
                    <p><strong>Status:</strong> {taskDetails.status}</p>
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
