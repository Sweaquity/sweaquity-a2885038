
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, PauseCircle, PlayCircle, User } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";

export const TimeTracker = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [description, setDescription] = useState("");
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
      setSelectedTask(null);
      setSelectedTicket(null);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedTask) {
      fetchTickets(selectedTask);
      setSelectedTicket(null);
    }
  }, [selectedTask]);

  useEffect(() => {
    if (selectedTicket) {
      setTicketId(selectedTicket);
      fetchTimeEntries(selectedTicket);
    }
  }, [selectedTicket]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('business_projects')
        .select(`
          *,
          businesses (company_name)
        `)
        .eq('business_id', session.user.id);

      if (error) throw error;
      
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].project_id);
        setProjectId(data[0].project_id);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchTasks = async (projectId: string) => {
    setLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      
      setTasks(data || []);
      if (data && data.length > 0) {
        setSelectedTask(data[0].task_id);
        setTaskId(data[0].task_id);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchTickets = async (taskId: string) => {
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('task_id', taskId);

      if (error) throw error;
      
      setTickets(data || []);
      if (data && data.length > 0) {
        setSelectedTicket(data[0].id);
        setTicketId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchTimeEntries = async (ticketId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTimeEntries(data || []);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      toast.error("Failed to load time entries");
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async () => {
    if (!selectedTicket) {
      toast.error("Please select a ticket first");
      return;
    }
    
    const now = new Date();
    setStartTime(now);
    setIsTracking(true);
    
    // Create time entry
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to track time");
        return;
      }
      
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: selectedTicket,
          user_id: session.user.id,
          start_time: now.toISOString(),
          description: description
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Start timer interval
      const intervalId = setInterval(() => {
        const currentTime = new Date();
        const diff = currentTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
      
      setTimerInterval(intervalId);
      toast.success("Time tracking started");
    } catch (error) {
      console.error("Error starting time tracking:", error);
      toast.error("Failed to start time tracking");
      setIsTracking(false);
      setStartTime(null);
    }
  };

  const stopTimer = async () => {
    if (!startTime || !timerInterval) return;
    
    clearInterval(timerInterval);
    setTimerInterval(null);
    
    const endTime = new Date();
    const hoursLogged = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    try {
      // Update the latest time entry
      const { data: latestEntry, error: fetchError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('ticket_id', selectedTicket)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();
        
      if (fetchError) throw fetchError;
      
      const { error: updateError } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          hours_logged: hoursLogged,
          description: description
        })
        .eq('id', latestEntry.id);
        
      if (updateError) throw updateError;
      
      // Update ticket hours logged
      const { data: ticket, error: ticketFetchError } = await supabase
        .from('tickets')
        .select('hours_logged')
        .eq('id', selectedTicket)
        .single();
        
      if (ticketFetchError && ticketFetchError.code !== 'PGRST116') throw ticketFetchError;
      
      const currentHours = ticket?.hours_logged || 0;
      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({
          hours_logged: currentHours + hoursLogged
        })
        .eq('id', selectedTicket);
        
      if (ticketUpdateError) throw ticketUpdateError;
      
      setIsTracking(false);
      setStartTime(null);
      setElapsedTime("00:00:00");
      setDescription("");
      fetchTimeEntries(selectedTicket);
      toast.success("Time entry saved successfully");
    } catch (error) {
      console.error("Error stopping time tracking:", error);
      toast.error("Failed to save time entry");
    }
  };

  const updateTaskProgress = async (taskId: string, value: number) => {
    try {
      const { error } = await supabase
        .from('project_sub_tasks')
        .update({ completion_percentage: value })
        .eq('task_id', taskId);
        
      if (error) throw error;
      
      // Refresh tasks
      if (selectedProject) {
        fetchTasks(selectedProject);
      }
      
      toast.success("Task progress updated");
    } catch (error) {
      console.error("Error updating task progress:", error);
      toast.error("Failed to update task progress");
    }
  };

  const formatDuration = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Time & Progress Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Project</label>
              <Select 
                value={selectedProject || ''} 
                onValueChange={setSelectedProject}
                disabled={loadingProjects || projects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.project_id} value={project.project_id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Task</label>
              <Select 
                value={selectedTask || ''} 
                onValueChange={setSelectedTask}
                disabled={loadingTasks || tasks.length === 0 || !selectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map(task => (
                    <SelectItem key={task.task_id} value={task.task_id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Ticket</label>
              <Select 
                value={selectedTicket || ''} 
                onValueChange={setSelectedTicket}
                disabled={loadingTickets || tickets.length === 0 || !selectedTask}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a ticket" />
                </SelectTrigger>
                <SelectContent>
                  {tickets.map(ticket => (
                    <SelectItem key={ticket.id} value={ticket.id}>
                      {ticket.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tickets.length === 0 && selectedTask && !loadingTickets && (
                <p className="text-sm text-muted-foreground mt-1">
                  No tickets found for this task. Create a ticket first.
                </p>
              )}
            </div>
          </div>
          
          {selectedTicket && (
            <>
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Task Progress</h3>
                  {selectedTask && tasks.find(t => t.task_id === selectedTask) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {tasks.find(t => t.task_id === selectedTask)?.title}
                        </span>
                        <span className="text-sm">
                          {tasks.find(t => t.task_id === selectedTask)?.completion_percentage || 0}%
                        </span>
                      </div>
                      <Slider
                        defaultValue={[tasks.find(t => t.task_id === selectedTask)?.completion_percentage || 0]}
                        max={100}
                        step={5}
                        className="w-full"
                        onValueCommit={(value) => {
                          if (selectedTask) {
                            updateTaskProgress(selectedTask, value[0]);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Time Tracker</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="text-center text-4xl font-mono mb-4">
                          {isTracking ? elapsedTime : "00:00:00"}
                        </div>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="What are you working on?"
                          className="mb-4"
                          disabled={isTracking}
                        />
                        {isTracking ? (
                          <Button 
                            variant="destructive" 
                            className="w-full" 
                            onClick={stopTimer}
                          >
                            <PauseCircle className="mr-2 h-4 w-4" />
                            Stop Timer
                          </Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            onClick={startTimer}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Start Timer
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="rounded-lg border">
                        <div className="p-4 font-medium flex justify-between items-center">
                          <h4>Recent Time Entries</h4>
                          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {!loading && timeEntries.length === 0 ? (
                            <p className="p-4 text-center text-muted-foreground">No time entries found</p>
                          ) : (
                            <Accordion type="single" collapsible className="w-full">
                              {timeEntries.map((entry, index) => (
                                <AccordionItem key={entry.id} value={entry.id}>
                                  <AccordionTrigger className="px-4 py-2 hover:no-underline">
                                    <div className="flex justify-between items-center w-full">
                                      <div className="flex items-center">
                                        <Clock className="mr-2 h-4 w-4" />
                                        <span>
                                          {entry.hours_logged ? formatDuration(entry.hours_logged) : 'In progress'}
                                        </span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(entry.start_time), 'MMM d, yyyy')}
                                      </span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-4 pb-3 pt-0">
                                    <div className="text-sm space-y-2">
                                      <div className="flex justify-between">
                                        <span className="font-medium">Start:</span>
                                        <span>{format(new Date(entry.start_time), 'MMM d, yyyy h:mm a')}</span>
                                      </div>
                                      {entry.end_time && (
                                        <div className="flex justify-between">
                                          <span className="font-medium">End:</span>
                                          <span>{format(new Date(entry.end_time), 'MMM d, yyyy h:mm a')}</span>
                                        </div>
                                      )}
                                      {entry.description && (
                                        <div className="pt-2">
                                          <span className="font-medium">Description:</span>
                                          <p className="mt-1">{entry.description}</p>
                                        </div>
                                      )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
