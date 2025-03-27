
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaskCompletionReviewProps {
  businessId: string;
  task?: any; // Adding task as an optional prop to fix the type error
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onClose?: () => void;
}

export const TaskCompletionReview = ({ 
  businessId, 
  task, 
  open, 
  setOpen, 
  onClose 
}: TaskCompletionReviewProps) => {
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (businessId) {
      if (task) {
        // If task is provided, use it directly
        setSelectedTask(task);
        setCompletionPercentage(task.completion_percentage || 0);
      } else {
        // Otherwise load tasks from database
        loadCompletedTasks();
      }
    }
  }, [businessId, task]);

  useEffect(() => {
    if (selectedTask) {
      setCompletionPercentage(selectedTask.completion_percentage || 0);
    }
  }, [selectedTask]);

  // If open prop is provided, use it to control the dialog
  useEffect(() => {
    if (open !== undefined) {
      setIsReviewOpen(open);
    }
  }, [open]);

  const loadCompletedTasks = async () => {
    try {
      setLoading(true);
      
      // Get all project IDs for this business
      const { data: projectsData, error: projectsError } = await supabase
        .from('business_projects')
        .select('project_id')
        .eq('business_id', businessId);
      
      if (projectsError) throw projectsError;
      
      if (!projectsData || projectsData.length === 0) {
        setCompletedTasks([]);
        setLoading(false);
        return;
      }
      
      const projectIds = projectsData.map(project => project.project_id);
      
      // Get all tasks that are in these projects and are marked as "review" status
      const { data: tasksData, error: tasksError } = await supabase
        .from('tickets')
        .select(`
          *,
          job_applications(user_id, job_app_id, status)
        `)
        .in('project_id', projectIds)
        .eq('status', 'review');
      
      if (tasksError) throw tasksError;
      
      // Enhance the tasks with user information
      if (tasksData && tasksData.length > 0) {
        const enhancedTasks = await Promise.all(tasksData.map(async (task) => {
          // Get user info if task has job application
          if (task.job_applications && task.job_applications.length > 0) {
            const userId = task.job_applications[0].user_id;
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', userId)
              .single();
            
            if (!userError && userData) {
              return {
                ...task,
                user: userData,
                job_app_id: task.job_applications[0].job_app_id
              };
            }
          }
          
          return task;
        }));
        
        setCompletedTasks(enhancedTasks);
      } else {
        setCompletedTasks([]);
      }
    } catch (error) {
      console.error("Error loading completed tasks:", error);
      toast.error("Failed to load tasks for review");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (task: any) => {
    setSelectedTask(task);
    setIsReviewOpen(true);
  };

  const handleApproveTask = async () => {
    try {
      if (!selectedTask) return;
      
      // Update the ticket status to done
      await supabase
        .from('tickets')
        .update({
          status: 'done',
          completion_percentage: completionPercentage
        })
        .eq('id', selectedTask.id);
      
      // If task_id exists, update related tables
      if (selectedTask.task_id) {
        try {
          // Update project_sub_tasks
          await supabase
            .from('project_sub_tasks')
            .update({ 
              completion_percentage: completionPercentage,
              last_activity_at: new Date().toISOString()
            })
            .eq('task_id', selectedTask.task_id);
            
          // Update jobseeker_active_projects using RPC
          await supabase.rpc('update_active_project', {
            p_task_id: selectedTask.task_id,
            p_completion_percentage: completionPercentage,
            p_status: 'done'
          });
        } catch (e) {
          console.error("Error updating related tables:", e);
          // Don't fail if this secondary update fails
        }
      }
      
      toast.success("Task approved successfully");
      
      // Handle dialog closing based on props
      if (setOpen) {
        setOpen(false);
      } else {
        setIsReviewOpen(false);
      }
      
      // Call onClose if provided
      if (onClose) {
        onClose();
      }
      
      // Refresh the list
      loadCompletedTasks();
    } catch (error) {
      console.error("Error approving task:", error);
      toast.error("Failed to approve task");
    }
  };

  const handleRequestChanges = async () => {
    try {
      if (!selectedTask) return;
      
      // Update the ticket status back to in-progress
      await supabase
        .from('tickets')
        .update({
          status: 'in-progress'
        })
        .eq('id', selectedTask.id);
      
      // If task_id exists, update related tables
      if (selectedTask.task_id) {
        try {
          // Update jobseeker_active_projects using RPC
          await supabase.rpc('update_active_project', {
            p_task_id: selectedTask.task_id,
            p_status: 'in-progress'
          });
        } catch (e) {
          console.error("Error updating related tables:", e);
          // Don't fail if this secondary update fails
        }
      }
      
      toast.success("Requested changes successfully");
      
      // Handle dialog closing based on props
      if (setOpen) {
        setOpen(false);
      } else {
        setIsReviewOpen(false);
      }
      
      // Call onClose if provided
      if (onClose) {
        onClose();
      }
      
      // Refresh the list
      loadCompletedTasks();
    } catch (error) {
      console.error("Error requesting changes:", error);
      toast.error("Failed to request changes");
    }
  };

  const handleCloseDialog = () => {
    if (setOpen) {
      setOpen(false);
    } else {
      setIsReviewOpen(false);
    }
    
    if (onClose) {
      onClose();
    }
  };

  // Calculate equity to be awarded with 1 decimal place
  const calculateEquity = (equityPoints: number, completion: number) => {
    return ((equityPoints || 0) * completion / 100).toFixed(1);
  };

  // If a specific task is provided, just render the dialog
  if (task) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Task Completion</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">{task.title}</h3>
              <p className="text-muted-foreground">{task.description}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Task Details</h4>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge>{task.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equity Points:</span>
                    <span>{task.equity_points || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Hours:</span>
                    <span>{task.estimated_hours || 'Not set'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">Completed By</h4>
                {task.user ? (
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{task.user.first_name} {task.user.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{task.user.email}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">User information not available</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Completion Assessment</h4>
              <div className="flex items-center gap-4 mb-4">
                <Label htmlFor="completion-percentage">Completion Percentage:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="completion-percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={completionPercentage}
                    onChange={(e) => setCompletionPercentage(parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span>%</span>
                </div>
              </div>
              <div>
                <p className="font-medium">Equity to be awarded: {calculateEquity(task.equity_points, completionPercentage)}%</p>
                <p className="text-sm text-muted-foreground">
                  Based on {completionPercentage}% completion of {task.equity_points || 0}% task
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRequestChanges}>
                Request Changes
              </Button>
              <Button onClick={handleApproveTask}>
                Approve Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tasks Pending Review</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading tasks...</div>
          ) : completedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks are currently pending review.
            </div>
          ) : (
            <div className="space-y-4">
              {completedTasks.map((task) => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge>Status: {task.status}</Badge>
                        {task.user && (
                          <Badge variant="outline">
                            Completed by: {task.user.first_name} {task.user.last_name}
                          </Badge>
                        )}
                        {task.completion_percentage !== null && (
                          <Badge variant="outline">
                            {task.completion_percentage}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button onClick={() => handleOpenReview(task)}>Review</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTask && (
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Review Task Completion</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{selectedTask.title}</h3>
                <p className="text-muted-foreground">{selectedTask.description}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Task Details</h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge>{selectedTask.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Equity Points:</span>
                      <span>{selectedTask.equity_points || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Hours:</span>
                      <span>{selectedTask.estimated_hours || 'Not set'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium">Completed By</h4>
                  {selectedTask.user ? (
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{selectedTask.user.first_name} {selectedTask.user.last_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{selectedTask.user.email}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">User information not available</p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Completion Assessment</h4>
                <div className="flex items-center gap-4 mb-4">
                  <Label htmlFor="completion-percentage">Completion Percentage:</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="completion-percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={completionPercentage}
                      onChange={(e) => setCompletionPercentage(parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                    <span>%</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium">Equity to be awarded: {calculateEquity(selectedTask.equity_points, completionPercentage)}%</p>
                  <p className="text-sm text-muted-foreground">
                    Based on {completionPercentage}% completion of {selectedTask.equity_points || 0}% task
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRequestChanges}>
                  Request Changes
                </Button>
                <Button onClick={handleApproveTask}>
                  Approve Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
