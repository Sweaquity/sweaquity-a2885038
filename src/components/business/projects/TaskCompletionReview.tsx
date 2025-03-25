
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertCircle, Clock, CalendarDays, ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Task {
  task_id: string;
  title: string;
  description: string;
  equity_allocation: number;
  completion_percentage: number;
  status: string;
  task_status: string;
  project_id: string;
  timeframe: string;
  created_at: string;
  assignee?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface TaskWithApplication extends Task {
  application?: {
    job_app_id: string;
    status: string;
    user_id: string;
    user?: {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
  };
}

interface TaskCompletionReviewProps {
  businessId: string;
}

export const TaskCompletionReview: React.FC<TaskCompletionReviewProps> = ({ businessId }) => {
  const [tasks, setTasks] = useState<TaskWithApplication[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithApplication | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [reviewStatus, setReviewStatus] = useState<string>("pending_review");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (businessId) {
      fetchTasksForReview();
    }
  }, [businessId]);

  useEffect(() => {
    if (selectedTask) {
      setCompletionPercentage(selectedTask.completion_percentage || 0);
      setReviewStatus(selectedTask.task_status || "pending_review");
    }
  }, [selectedTask]);

  const fetchTasksForReview = async () => {
    try {
      setLoading(true);
      // Fetch all projects for this business
      const { data: projectsData, error: projectsError } = await supabase
        .from('business_projects')
        .select('project_id')
        .eq('business_id', businessId);
      
      if (projectsError) throw projectsError;
      
      if (!projectsData || projectsData.length === 0) {
        setLoading(false);
        return;
      }
      
      const projectIds = projectsData.map(p => p.project_id);
      
      // Fetch tasks for these projects that need review
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select(`
          *,
          application:job_applications(
            job_app_id,
            status,
            user_id,
            user:profiles(
              first_name,
              last_name,
              email
            )
          )
        `)
        .in('project_id', projectIds)
        .in('task_status', ['pending_review', 'in_review'])
        .order('created_at', { ascending: false });
      
      if (tasksError) throw tasksError;
      
      const processedTasks = tasksData.map((task: any) => {
        // Fix for the TypeScript error - ensure assignee is an object
        const assignee = task.application?.user || {};
        
        return {
          ...task,
          assignee
        };
      });
      
      setTasks(processedTasks || []);
    } catch (error) {
      console.error("Error fetching tasks for review:", error);
      toast.error("Failed to load tasks for review");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: TaskWithApplication) => {
    setSelectedTask(task);
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedTask) return;
    
    try {
      // Update task status and completion percentage
      const { error } = await supabase
        .from('project_sub_tasks')
        .update({
          task_status: reviewStatus,
          completion_percentage: completionPercentage,
          review_feedback: reviewFeedback,
          last_activity_at: new Date().toISOString()
        })
        .eq('task_id', selectedTask.task_id);
      
      if (error) throw error;
      
      // If approved as completed, also update the project completion
      if (reviewStatus === 'completed') {
        // Get current project data
        const { data: projectData, error: projectError } = await supabase
          .from('business_projects')
          .select('completion_percentage, total_tasks')
          .eq('project_id', selectedTask.project_id)
          .single();
        
        if (projectError) throw projectError;
        
        // Calculate new completion percentage for the project
        const currentCompletion = projectData.completion_percentage || 0;
        const taskWeight = 100 / (projectData.total_tasks || 1);
        const newCompletion = Math.min(currentCompletion + taskWeight, 100);
        
        // Update project
        const { error: updateError } = await supabase
          .from('business_projects')
          .update({
            completion_percentage: newCompletion
          })
          .eq('project_id', selectedTask.project_id);
        
        if (updateError) throw updateError;
      }
      
      toast.success("Task review submitted successfully");
      setShowReviewDialog(false);
      fetchTasksForReview();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    }
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserName = (user: any) => {
    if (!user) return 'Unassigned';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : user.email || 'Unnamed User';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Review</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No tasks pending review at this time.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <Card key={task.task_id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">{task.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>Created: {formatDate(task.created_at)}</span>
                          
                          <span className="mx-1">•</span>
                          
                          <span>Status: 
                            <Badge variant={task.task_status === 'pending_review' ? 'outline' : 'secondary'} 
                                  className="ml-2">
                              {task.task_status === 'pending_review' ? 'Pending Review' : 'In Review'}
                            </Badge>
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="text-right mr-4">
                          <div className="font-medium">Equity: {task.equity_allocation}%</div>
                          <div className="text-sm">
                            Completion: {task.completion_percentage || 0}%
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTaskClick(task)}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Progress value={task.completion_percentage || 0} className="h-2" />
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          <span className="font-medium">Assignee:</span> {getUserName(task.application?.user)}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTaskExpand(task.task_id)}
                      >
                        {expandedTasks[task.task_id] ? (
                          <>
                            Hide Details <ChevronUp className="ml-1 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Show Details <ChevronDown className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {expandedTasks[task.task_id] && (
                      <div className="mt-4 border-t pt-4">
                        <div className="text-sm">
                          <p className="font-medium">Description:</p>
                          <p className="mt-1">{task.description}</p>
                        </div>
                        
                        <div className="mt-4 text-sm">
                          <p className="font-medium">Timeframe:</p>
                          <p>{task.timeframe || 'Not specified'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Review Dialog */}
      {selectedTask && (
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Task Completion</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex justify-between">
                <h3 className="text-lg font-medium">{selectedTask.title}</h3>
                <Badge variant="outline">
                  {selectedTask.task_status === 'pending_review' ? 'Pending Review' : 'In Review'}
                </Badge>
              </div>
              
              <div className="text-sm">
                <span className="font-medium">Assignee:</span> {getUserName(selectedTask.application?.user)}
              </div>
              
              <div className="text-sm">
                <span className="font-medium">Description:</span>
                <p className="mt-1">{selectedTask.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Equity Allocation</Label>
                  <div className="mt-1 font-medium">{selectedTask.equity_allocation}%</div>
                </div>
                
                <div>
                  <Label>Timeframe</Label>
                  <div className="mt-1">{selectedTask.timeframe || 'Not specified'}</div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="completion">Completion Percentage</Label>
                <div className="flex items-center gap-4 mt-1">
                  <Progress value={completionPercentage} className="flex-1 h-2" />
                  <Input
                    id="completion"
                    type="number"
                    value={completionPercentage}
                    onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-24"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Review Status</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="completed">Approve as Completed</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="feedback">Review Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide feedback on the task completion..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReview}>
                Submit Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
