
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EquityProject } from "@/types/jobSeeker";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChevronDown, Clock, Check } from "lucide-react";
import { TimeTracker } from "@/components/business/testing/TimeTracker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Update the EquityProject type to include the documents property
interface ProjectWithDocuments extends EquityProject {
  documents?: {
    contract?: {
      url: string;
    };
  };
  tickets?: any[];
}

interface ProjectsOverviewProps {
  currentProjects?: ProjectWithDocuments[];
  pastProjects?: ProjectWithDocuments[];
  onDocumentAction?: (projectId: string, action: 'edit' | 'approve') => void;
}

export const ProjectsOverview = ({
  currentProjects = [],
  pastProjects = [],
  onDocumentAction = () => {}
}: ProjectsOverviewProps) => {
  const [expandedProjects, setExpandedProjects] = useState<{[key: string]: boolean}>({});
  const [projectTickets, setProjectTickets] = useState<{[key: string]: any[]}>({});
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));

    // Load tickets if expanding and not yet loaded
    if (!expandedProjects[projectId] && !projectTickets[projectId]) {
      fetchProjectTickets(projectId);
    }
  };

  const fetchProjectTickets = async (projectId: string) => {
    setIsLoading(prev => ({ ...prev, [projectId]: true }));
    try {
      // Fetch tickets associated with this project
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      
      setProjectTickets(prev => ({
        ...prev,
        [projectId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching project tickets:', error);
      toast.error("Failed to load project tickets");
    } finally {
      setIsLoading(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const createTicket = async (projectId: string, taskId: string) => {
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to create a ticket");
        return;
      }

      // Create a new ticket
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: 'New task ticket',
          description: 'Please provide a description for this ticket',
          status: 'todo',
          priority: 'medium',
          health: 'green',
          project_id: projectId,
          task_id: taskId,
          reporter: session.user.id,
          assigned_to: session.user.id,
          ticket_type: 'task'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Ticket created successfully");
      
      // Refresh tickets
      fetchProjectTickets(projectId);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error("Failed to create ticket");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>Your current equity projects and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentProjects.map((project) => (
              <Collapsible 
                key={project.id} 
                open={expandedProjects[project.id]} 
                onOpenChange={() => toggleProjectExpansion(project.id)}
                className="border p-4 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{project.title}</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedProjects[project.id] ? 'transform rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <div className="mt-2 space-y-2">
                  <p className="text-sm">Status: {project.status}</p>
                  <p className="text-sm">Equity: {project.equity_amount}%</p>
                  <p className="text-sm">Hours logged: {project.total_hours_logged}</p>
                </div>
                
                <CollapsibleContent className="mt-4 pt-4 border-t">
                  {project.documents?.contract && (
                    <div className="flex space-x-2 mb-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Preview Contract
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh]">
                          <iframe 
                            src={project.documents.contract.url} 
                            className="w-full h-full"
                            title="Contract Preview"
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDocumentAction(project.id, 'edit')}
                      >
                        Edit Contract
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDocumentAction(project.id, 'approve')}
                      >
                        Approve Contract
                      </Button>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <h4 className="font-medium mb-2">Project Tasks & Tickets</h4>
                    
                    {isLoading[project.id] ? (
                      <p className="text-sm italic">Loading tickets...</p>
                    ) : (
                      <>
                        {/* Display project sub-tasks */}
                        {project.sub_tasks?.map((task) => (
                          <div key={task.task_id} className="mb-4 p-3 bg-secondary/20 rounded-md">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => createTicket(project.id, task.task_id)}
                              >
                                Create Ticket
                              </Button>
                            </div>
                            
                            {/* Tickets associated with this task */}
                            {projectTickets[project.id]?.filter(ticket => ticket.task_id === task.task_id).length > 0 ? (
                              <div className="mt-2 space-y-2">
                                <p className="text-sm font-medium">Task Tickets:</p>
                                {projectTickets[project.id]
                                  .filter(ticket => ticket.task_id === task.task_id)
                                  .map(ticket => (
                                    <div key={ticket.id} className="flex justify-between items-center p-2 bg-background rounded border text-sm">
                                      <div>
                                        <p>{ticket.title}</p>
                                        <p className="text-xs text-muted-foreground">Status: {ticket.status}</p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => setSelectedTicketId(ticket.id === selectedTicketId ? null : ticket.id)}
                                        >
                                          <Clock className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-xs mt-2 text-muted-foreground">No tickets yet</p>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  
                  {/* Time Tracker for selected ticket */}
                  {selectedTicketId && userId && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-medium mb-2">Time Tracking</h4>
                      <TimeTracker ticketId={selectedTicketId} userId={userId} />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
            
            {currentProjects.length === 0 && (
              <p className="text-muted-foreground">No active projects</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Projects</CardTitle>
          <CardDescription>Completed equity projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pastProjects.map((project) => (
              <div key={project.id} className="border p-4 rounded-lg">
                <h3 className="text-lg font-medium">{project.title}</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">Final Equity: {project.equity_amount}%</p>
                  <p className="text-sm">Total Hours: {project.total_hours_logged}</p>
                  <p className="text-sm">
                    Duration: {new Date(project.start_date).toLocaleDateString()} - {
                      project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'
                    }
                  </p>
                </div>
              </div>
            ))}
            {pastProjects.length === 0 && (
              <p className="text-muted-foreground">No past projects</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
