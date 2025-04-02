
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Copy, Edit, Trash, Plus, ExternalLink, User, Mail, Building2, CheckCircle2, AlertTriangle, Clock, FileText, RefreshCw, KanbanSquare, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "@radix-ui/react-icons";
import { DateRange } from "react-day-picker";
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LinkedInImportDialog } from "@/components/shared/LinkedInImportDialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { KanbanBoard } from "@/components/ticket/KanbanBoard";
import { TimeTracker } from "@/components/business/testing/TimeTracker";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { ExpandedTicketDetails } from "@/components/ticket/ExpandedTicketDetails";
import { TicketAttachmentsList } from "@/components/ticket/TicketAttachmentsList";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email(),
  bio: z.string().max(160, {
    message: "Bio must not be longer than 160 characters.",
  }),
  notifications: z.boolean().default(true),
});

const taskSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  status: z.enum(["open", "in progress", "completed"]),
});

const ticketSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  priority: z.enum(["low", "medium", "high"]),
});

const SweaquityDashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<any>(null);
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [applicationsData, setApplicationsData] = useState<any[]>([]);
  const [tasksData, setTasksData] = useState<any[]>([]);
  const [ticketsData, setTicketsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isLinkedInDialogOpen, setIsLinkedInDialogOpen] = useState(false);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isTaskEditOpen, setIsTaskEditOpen] = useState(false);
  const [isTicketEditOpen, setIsTicketEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isKanbanView, setIsKanbanView] = useState(false);
  const [isGanttView, setIsGanttView] = useState(false);
  const [isTimeTrackingEnabled, setIsTimeTrackingEnabled] = useState(true);
  const [expandedTickets, setExpandedTickets] = useState(new Set<string>());

  const userId = session?.user?.id;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      bio: "",
      notifications: true,
    },
  });

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "open",
    },
  });

  const ticketForm = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchProfile();
      fetchProjects();
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedProject) {
      fetchApplications(selectedProject);
      fetchTasks(selectedProject);
      fetchTickets(selectedProject);
    }
  }, [selectedProject]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setProfileData(data);
      form.reset(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Failed to load profile");
    }
  };

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('business_projects')
        .select(`
          *,
          businesses!inner (
            company_name
          )
        `)
        .eq('business_id', userId);

      if (error) throw error;

      setProjectsData(data || []);

      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].project_id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchApplications = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      setApplicationsData(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error("Failed to load applications");
    }
  };

  const fetchTasks = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      setTasksData(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error("Failed to load tasks");
    }
  };

  const fetchTickets = async (projectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          project:project_id(title)
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      setTicketsData(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  const handleProfileUpdate = async (values: z.infer<typeof formSchema>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(values)
        .eq('id', userId);

      if (error) throw error;

      setProfileData(values);
      toast.success("Profile updated successfully");
      setIsProfileFormOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    }
  };

  const handleTaskCreate = async (values: z.infer<typeof taskSchema>) => {
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from('project_sub_tasks')
        .insert({
          ...values,
          project_id: selectedProject,
        });

      if (error) throw error;

      fetchTasks(selectedProject);
      toast.success("Task created successfully");
      setIsTaskDialogOpen(false);
      taskForm.reset();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error("Failed to create task");
    }
  };

  const handleTicketCreate = async (values: z.infer<typeof ticketSchema>) => {
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .insert({
          ...values,
          project_id: selectedProject,
        });

      if (error) throw error;

      fetchTickets(selectedProject);
      toast.success("Ticket created successfully");
      setIsTicketDialogOpen(false);
      ticketForm.reset();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error("Failed to create ticket");
    }
  };

  const handleTaskUpdate = async (values: z.infer<typeof taskSchema>) => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from('project_sub_tasks')
        .update(values)
        .eq('task_id', selectedTask.task_id);

      if (error) throw error;

      fetchTasks(selectedProject || '');
      toast.success("Task updated successfully");
      setIsTaskEditOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("Failed to update task");
    }
  };

  const handleTicketUpdate = async (values: z.infer<typeof ticketSchema>) => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update(values)
        .eq('id', selectedTicket.id);

      if (error) throw error;

      fetchTickets(selectedProject || '');
      toast.success("Ticket updated successfully");
      setIsTicketEditOpen(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error("Failed to update ticket");
    }
  };

  const handleDeleteConfirmation = (target: any) => {
    setDeleteTarget(target);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase
        .from('project_sub_tasks')
        .delete()
        .eq('task_id', deleteTarget.task_id);

      if (error) throw error;

      fetchTasks(selectedProject || '');
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error("Failed to delete task");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      fetchTickets(selectedProject || '');
      toast.success("Ticket deleted successfully");
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error("Failed to delete ticket");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      // Implement your ticket action logic here
      console.log(`Action ${action} triggered for ticket ${ticketId} with data:`, data);
      toast.success(`Action ${action} triggered for ticket ${ticketId}`);
    } catch (error) {
      console.error('Error handling ticket action:', error);
      toast.error("Failed to perform action on ticket");
    }
  };

  const renderTicketActions = (ticket: any) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleTicketClick(ticket)}>
        View
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleDeleteConfirmation(ticket)}>
        Delete
      </Button>
    </div>
  );

  const toggleTicketExpansion = (ticketId: string) => {
    setExpandedTickets((prevExpandedTickets) => {
      const newExpandedTickets = new Set(prevExpandedTickets);
      if (newExpandedTickets.has(ticketId)) {
        newExpandedTickets.delete(ticketId);
      } else {
        newExpandedTickets.add(ticketId);
      }
      return newExpandedTickets;
    });
  };

  return (
    <div className="container py-12">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-semibold">
            Sweaquity Business Dashboard
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open user menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsProfileFormOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Building2 className="mr-2 h-4 w-4" />
                <span>Company</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                <span>Contact</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              {profileData ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${profileData.email}.png`} />
                          <AvatarFallback>{profileData.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{profileData.username}</h4>
                          <p className="text-sm text-muted-foreground">{profileData.email}</p>
                        </div>
                      </div>
                      <p className="text-sm mt-4">{profileData.bio}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Project Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="font-medium">Total Projects:</dt>
                          <dd>{projectsData.length}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Active Tasks:</dt>
                          <dd>{tasksData.length}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Open Tickets:</dt>
                          <dd>{ticketsData.length}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading profile data...</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="applications">
              {applicationsData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No applications for this project.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicationsData.map(app => (
                      <TableRow key={app.job_app_id}>
                        <TableCell>
                          {app.profiles?.first_name} {app.profiles?.last_name}
                        </TableCell>
                        <TableCell>
                          {tasksData.find(t => t.task_id === app.task_id)?.title || 'Unknown task'}
                        </TableCell>
                        <TableCell>
                          {new Date(app.applied_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            app.status === 'accepted' ? 'bg-green-500' :
                              app.status === 'pending' ? 'bg-yellow-500' :
                                app.status === 'rejected' ? 'bg-red-500' :
                                  'bg-gray-500'
                          }>
                            {app.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            <TabsContent value="tasks">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setIsTaskDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
              {tasksData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks for this project.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Timeframe</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Equity</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasksData.map(task => (
                      <TableRow key={task.task_id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                        <TableCell>{task.timeframe}</TableCell>
                        <TableCell>
                          <Badge className={
                            task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'in_progress' ? 'bg-blue-500' :
                                task.status === 'open' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                          }>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{task.equity_allocation}%</TableCell>
                        <TableCell>{task.completion_percentage}%</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedTask(task);
                                taskForm.reset(task);
                                setIsTaskEditOpen(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteConfirmation(task)}>
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            <TabsContent value="tickets">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setIsTicketDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Ticket
                </Button>
              </div>
              {ticketsData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tickets for this project.</p>
                </div>
              ) : (
                <TicketDashboard
                  projectId={selectedProject}
                  tickets={ticketsData}
                  onTicketClick={handleTicketClick}
                  onTicketAction={handleTicketAction}
                  showTimeTracking={isTimeTrackingEnabled}
                  onLogTime={() => {}}
                  renderTicketActions={renderTicketActions}
                  expandedTickets={expandedTickets}
                  toggleTicketExpansion={toggleTicketExpansion}
                />
              )}
            </TabsContent>
            <TabsContent value="testing">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Project Management Tools</CardTitle>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setIsKanbanView(!isKanbanView)}>
                        {isKanbanView ? 'Hide Kanban' : 'Show Kanban'}
                        <KanbanSquare className="h-4 w-4 ml-1" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsGanttView(!isGanttView)}>
                        {isGanttView ? 'Hide Gantt' : 'Show Gantt'}
                        <BarChart2 className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Loading tickets...</div>
                    ) : (
                      <TicketDashboard
                        projectId={selectedProject}
                        tickets={ticketsData}
                        onTicketClick={handleTicketClick}
                        onTicketAction={handleTicketAction}
                        showTimeTracking={isTimeTrackingEnabled}
                        onLogTime={() => {}}
                        renderTicketActions={renderTicketActions}
                        expandedTickets={expandedTickets}
                        toggleTicketExpansion={toggleTicketExpansion}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Time Tracking</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="outline" size="sm" onClick={() => setIsTimeTrackingEnabled(!isTimeTrackingEnabled)}>
                            {isTimeTrackingEnabled ? 'Disable Time Tracking' : 'Enable Time Tracking'}
                            <Clock className="h-4 w-4 ml-1" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enable or disable time tracking for tickets</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardHeader>
                  <CardContent>
                    <TimeTracker />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Profile Dialog */}
      <Dialog open={isProfileFormOpen} onOpenChange={setIsProfileFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleProfileUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="shadcn" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="shadcn@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little bit about yourself."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Max. 160 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Push Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive push notifications on your device.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Add a new task to the selected project.
            </DialogDescription>
          </DialogHeader>
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit(handleTaskCreate)} className="space-y-4">
              <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Task description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taskForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Create Task</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Ticket Dialog */}
      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Ticket</DialogTitle>
            <DialogDescription>
              Add a new ticket to the selected project.
            </DialogDescription>
          </DialogHeader>
          <Form {...ticketForm}>
            <form onSubmit={ticketForm.handleSubmit(handleTicketCreate)} className="space-y-4">
              <FormField
                control={ticketForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Ticket title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={ticketForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ticket description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={ticketForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Create Ticket</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this item
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteTarget?.task_id ? handleDeleteTask : handleDeleteTicket}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SweaquityDashboard;
