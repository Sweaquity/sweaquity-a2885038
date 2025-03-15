
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EquityProject, LogEffort } from "@/types/jobSeeker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TimeTracker } from "@/components/business/testing/TimeTracker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, FileText, ArrowUpToLine } from "lucide-react";

interface EquityTabProps {
  equityProjects?: EquityProject[];
  logEffort?: LogEffort;
  onLogEffort?: (projectId: string) => void;
  onLogEffortChange?: (projectId: string, field: 'hours' | 'description', value: string | number) => void;
}

export const EquityTab = ({ 
  equityProjects = [],
  logEffort,
  onLogEffort = () => {},
  onLogEffortChange = () => {}
}: EquityTabProps) => {
  const [selectedProject, setSelectedProject] = useState<EquityProject | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [hours, setHours] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
      setIsLoading(false);
    };
    
    getUser();
  }, []);

  const handleLogEffort = async () => {
    if (!selectedProject || !selectedTaskId) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get user ID from auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to log effort");
        return;
      }
      
      // Create a new time entry in the ticket_time_entries table
      const { error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: selectedTaskId,
          user_id: session.user.id,
          description: description,
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString(),
          hours_logged: hours
        });
        
      if (error) throw error;
      
      toast.success("Time logged successfully");
      setIsDialogOpen(false);
      setHours(0);
      setDescription('');
      
      // Refresh the page to update the data
      window.location.reload();
    } catch (error) {
      console.error('Error logging effort:', error);
      toast.error("Failed to log effort");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Current Equity Projects</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {equityProjects.length === 0 && (
              <p className="text-muted-foreground">No active equity projects.</p>
            )}
            
            {equityProjects.map((project) => (
              <div key={project.id} className="border p-4 rounded-lg">
                <div className="flex justify-between">
                  <h3 className="text-lg font-medium">{project.title}</h3>
                  <Badge>{project.status}</Badge>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Equity Allocation</p>
                    <p className="font-medium">{project.equity_amount}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Frame</p>
                    <p className="font-medium">{project.time_allocated}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hours Logged</p>
                    <p className="font-medium">{project.total_hours_logged || 0} hours</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Tasks</p>
                  <div className="mt-2 space-y-2">
                    {project.sub_tasks?.map((task) => (
                      <div key={task.task_id} className="text-sm p-3 bg-secondary/50 rounded-md">
                        <div className="flex justify-between">
                          <p className="font-medium">{task.title}</p>
                          <span>{task.completion_percentage}% complete</span>
                        </div>
                        <p className="text-muted-foreground mt-1">{task.description}</p>
                        
                        <div className="flex mt-3 gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setSelectedTaskId(task.task_id);
                              setIsDialogOpen(true);
                            }}
                            className="flex items-center"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Log Time
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setSelectedTaskId(task.task_id);
                              setIsUploadDialogOpen(true);
                            }}
                            className="flex items-center"
                          >
                            <ArrowUpToLine className="h-4 w-4 mr-2" />
                            Upload Document
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedTaskId && selectedTaskId === project.id && (
                  <div className="mt-6 border-t pt-4">
                    <Tabs defaultValue="timeTracking">
                      <TabsList>
                        <TabsTrigger value="timeTracking">Time Tracker</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="timeTracking">
                        <TimeTracker ticketId={selectedTaskId} userId={userId} />
                      </TabsContent>
                      
                      <TabsContent value="documents">
                        <p>Document management will appear here</p>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time</DialogTitle>
            <DialogDescription>
              Record the time you've spent working on {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description of Work</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you accomplished during this time"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogEffort}>Log Hours</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document related to your work on {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>
          
          {/* Document upload form will be implemented here */}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentTitle">Document Title</Label>
              <Input id="documentTitle" placeholder="Enter document title" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documentDescription">Description</Label>
              <Textarea
                id="documentDescription"
                placeholder="Describe this document"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documentFile">File</Label>
              <Input id="documentFile" type="file" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
            <Button>Upload Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
