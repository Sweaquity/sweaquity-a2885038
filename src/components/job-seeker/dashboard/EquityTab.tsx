
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EquityProject, LogEffort } from "@/types/jobSeeker";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
  const [hours, setHours] = useState<number>(0);
  const [description, setDescription] = useState<string>('');

  const handleLogEffort = async () => {
    if (!selectedProject) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get user ID from auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to log effort");
        return;
      }
      
      // Create a new effort log
      const { error } = await supabase
        .from('equity_effort_logs')
        .insert({
          project_id: selectedProject.project_id,
          task_id: selectedProject.id,
          user_id: session.user.id,
          date: today,
          hours: hours,
          description: description
        });
        
      if (error) throw error;
      
      toast.success("Effort logged successfully");
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
                      <div key={task.task_id} className="text-sm p-2 bg-secondary/50 rounded-md">
                        <div className="flex justify-between">
                          <p className="font-medium">{task.title}</p>
                          <span>{task.completion_percentage}% complete</span>
                        </div>
                        <p className="text-muted-foreground mt-1">{task.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedProject(project);
                      setIsDialogOpen(true);
                    }}
                  >
                    Log Effort
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Effort</DialogTitle>
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
    </>
  );
};
