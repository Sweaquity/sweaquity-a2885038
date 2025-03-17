
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { PercentIcon, AlertCircle, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

interface ProjectSubTask {
  task_id: string;
  title: string;
  description: string;
  timeframe: string;
  equity_allocation: number;
  completion_percentage: number;
  status: string;
  project_id: string;
}

interface BusinessProject {
  project_id: string;
  title: string;
  equity_allocation: number;
  equity_allocated: number;
}

interface UserProfile {
  first_name: string;
  last_name: string;
}

interface AcceptedJob {
  job_app_id: string;
  date_accepted: string;
  equity_agreed: number;
}

interface TicketWithDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string;
  estimated_hours: number;
  completion_percentage: number;
  task_id: string;
  project_id: string;
  assigned_to: string;
  reporter: string;
  created_at: string;
  project: BusinessProject;
  task: ProjectSubTask;
  user: UserProfile;
  accepted_job: AcceptedJob;
  total_hours_logged: number;
}

export function TimeTracker({ ticketId, userId }: TimeTrackerProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ticketDetails, setTicketDetails] = useState<TicketWithDetails | null>(null);
  const [ticketExists, setTicketExists] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (ticketId) {
      checkTicketExists();
      fetchTicketDetails();
      fetchTimeEntries();
    } else {
      setLoading(false);
    }
  }, [ticketId]);

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
      
      setTicketExists(false);
      
    } catch (error) {
      console.error('Error checking ticket existence:', error);
      setTicketExists(false);
    }
  };

  const fetchTicketDetails = async () => {
    if (!ticketId) return;
    
    try {
      // Fetch ticket with related data
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          project:project_id(
            project_id, 
            title, 
            equity_allocation,
            equity_allocated
          ),
          task:task_id(
            task_id,
            title,
            description,
            timeframe,
            equity_allocation,
            completion_percentage,
            status,
            project_id
          )
        `)
        .eq('id', ticketId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching ticket details:', error);
        return;
      }
      
      if (!data) {
        console.log('No ticket found with id:', ticketId);
        return;
      }
      
      // Set completion percentage from ticket
      if (data && data.completion_percentage !== null) {
        setCompletionPercentage(data.completion_percentage || 0);
      }
      
      // Fetch user profile if assigned_to exists
      let userProfile = null;
      if (data.assigned_to) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', data.assigned_to)
          .maybeSingle();
          
        if (!userError && userData) {
          userProfile = userData;
        }
      }
      
      // Fetch accepted job if task_id exists
      let acceptedJob = null;
      if (data.task_id) {
        const { data: jobData, error: jobError } = await supabase
          .from('accepted_jobs')
          .select('*')
          .eq('task_id', data.task_id)
          .maybeSingle();
          
        if (!jobError && jobData) {
          acceptedJob = jobData;
        }
      }
      
      // Calculate total hours logged
      const { data: hoursData, error: hoursError } = await supabase
        .from('time_entries')
        .select('hours_logged')
        .eq('ticket_id', ticketId);
        
      const totalHoursLogged = hoursData?.reduce((sum, entry) => sum + (entry.hours_logged || 0), 0) || 0;
      
      // Combine all data
      const ticketWithDetails: TicketWithDetails = {
        ...data,
        user: userProfile,
        accepted_job: acceptedJob,
        total_hours_logged: totalHoursLogged
      };
      
      setTicketDetails(ticketWithDetails);
    } catch (error) {
      console.error('Error in fetchTicketDetails:', error);
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
      if (!ticketDetails) return;
      
      // Update ticket completion percentage
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ completion_percentage: completionPercentage })
        .eq('id', ticketId);
        
      if (ticketError) throw ticketError;

      // If the ticket has a task_id, also update the task's completion percentage
      if (ticketDetails.task_id) {
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({ completion_percentage: completionPercentage })
          .eq('task_id', ticketDetails.task_id);
          
        if (taskError) throw taskError;
      }

      toast.success(`Completion percentage updated to ${completionPercentage}%`);
      
      // Refresh ticket details
      fetchTicketDetails();
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

  if (!ticketDetails) return <div className="text-center p-8">Failed to load ticket details.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{ticketDetails.title || 'Untitled Ticket'}</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                {ticketDetails.description || 'No description'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {ticketDetails.status && (
                <Badge variant={ticketDetails.status === 'done' ? 'default' : ticketDetails.status === 'todo' ? 'outline' : 'secondary'}>
                  <span className="flex items-center">
                    {getStatusIcon(ticketDetails.status)}
                    <span className="ml-1 capitalize">{ticketDetails.status}</span>
                  </span>
                </Badge>
              )}
              {ticketDetails.priority && (
                <Badge variant="outline" className={
                  ticketDetails.priority === 'high' ? 'border-red-500 text-red-500' : 
                  ticketDetails.priority === 'medium' ? 'border-amber-500 text-amber-500' : 
                  'border-blue-500 text-blue-500'
                }>
                  {ticketDetails.priority}
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
        <CardContent className="space-y-6">
          {/* Project and Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Project Details</h3>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Project:</span>
                  <span>{ticketDetails.project?.title || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Equity:</span>
                  <span>{ticketDetails.project?.equity_allocation || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Allocated Equity:</span>
                  <span>{ticketDetails.project?.equity_allocated || 0}%</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Task Details</h3>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Task:</span>
                  <span>{ticketDetails.task?.title || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Timeframe:</span>
                  <span>{ticketDetails.task?.timeframe || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Equity:</span>
                  <span>{ticketDetails.task?.equity_allocation || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="capitalize">{ticketDetails.task?.status || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Assignment Details</h3>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Assigned To:</span>
                  <span>
                    {ticketDetails.user ? 
                      `${ticketDetails.user.first_name} ${ticketDetails.user.last_name}` : 
                      'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date Accepted:</span>
                  <span>
                    {ticketDetails.accepted_job?.date_accepted ? 
                      formatDate(ticketDetails.accepted_job.date_accepted) : 
                      'Not yet accepted'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Equity Agreed:</span>
                  <span>{ticketDetails.accepted_job?.equity_agreed || 0}%</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Time & Progress</h3>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Estimated Hours:</span>
                  <span>{ticketDetails.estimated_hours || 'Not estimated'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Hours Logged:</span>
                  <span className="font-bold text-blue-600">{totalHours.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Completion:</span>
                  <span>{completionPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Tracking Section */}
          <div className="border-b pb-4">
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
          
          {/* Time Entries Section */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium">Time Entries</h3>
              <p className="text-muted-foreground text-sm">
                View recorded time entries for this ticket. Total: <span className="font-bold">{totalHours.toFixed(2)} hours</span>
              </p>
            </div>
            
            {timeEntries.length > 0 ? (
              <div className="space-y-2">
                <Accordion type="single" collapsible className="w-full">
                  {timeEntries.map((entry, index) => (
                    <AccordionItem key={entry.id} value={entry.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex justify-between w-full pr-4">
                          <div className="font-medium">
                            {entry.description || `Time Entry #${index + 1}`}
                          </div>
                          <div className="font-semibold text-primary">
                            {entry.hours_logged ? `${entry.hours_logged.toFixed(2)} hours` : 'In progress'}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="px-4 py-2 bg-secondary/20 rounded-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <span className="text-sm font-medium">Started:</span>
                              <span className="ml-2 text-sm">
                                {entry.start_time && formatDate(entry.start_time)}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Ended:</span>
                              <span className="ml-2 text-sm">
                                {entry.end_time ? formatDate(entry.end_time) : 'Not completed'}
                              </span>
                            </div>
                            {entry.description && (
                              <div className="col-span-2">
                                <span className="text-sm font-medium">Description:</span>
                                <p className="text-sm mt-1">{entry.description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No time entries recorded for this ticket.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
