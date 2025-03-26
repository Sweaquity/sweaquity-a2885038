
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,

  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { Slider } from "@/components/ui/slider";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  CalendarDays,
  FileCheck,
  CircleDollarSign
} from "lucide-react";
import { Ticket } from "@/types/types";
import { TicketService } from "@/components/ticket/TicketService";

interface TaskCompletionReviewProps {
  businessId: string;
  task: Ticket;
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
}

interface TaskReviewData {
  task_id: string;
  job_app_id: string;
  project_id: string;
  task_title: string;
  task_status: string;
  task_equity_allocation: number;
  user_id: string;
  user_name: string;
  completion_percentage: number;
  equity_agreed: number;
  equity_awarded: number;
  hours_logged: number;
  user_email?: string;
}

export const TaskCompletionReview = ({ 
  businessId, 
  task, 
  open, 
  setOpen, 
  onClose 
}: TaskCompletionReviewProps) => {
  const [activeTab, setActiveTab] = useState("review");
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [taskData, setTaskData] = useState<TaskReviewData | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(100);
  const [equityToAward, setEquityToAward] = useState(0);

  useEffect(() => {
    if (open && task) {
      loadTaskData();
    }
  }, [open, task]);

  const loadTaskData = async () => {
    setIsLoading(true);
    try {
      // First, get the task details from the project_sub_tasks table
      const { data: taskData, error: taskError } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('task_id', task.task_id)
        .single();

      if (taskError) throw taskError;

      if (!taskData) {
        toast.error("Task details not found");
        setOpen(false);
        return;
      }

      // Get the job application info
      const { data: jobAppData, error: jobAppError } = await supabase
        .from('job_applications')
        .select('*, accepted_jobs(*)')
        .eq('task_id', task.task_id)
        .single();

      if (jobAppError) throw jobAppError;

      if (!jobAppData) {
        toast.error("Job application details not found");
        setOpen(false);
        return;
      }

      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', jobAppData.user_id)
        .single();

      if (userError) throw userError;

      // Get time logged for this task
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('hours_logged')
        .eq('job_app_id', jobAppData.job_app_id);

      if (timeError) throw timeError;

      const totalHoursLogged = timeEntries?.reduce((total: number, entry: any) => {
        return total + (entry.hours_logged || 0);
      }, 0) || 0;

      // Get equity_agreed from accepted_jobs
      const equityAgreed = jobAppData.accepted_jobs?.equity_agreed || 0;
      
      // Calculate equity to award based on completion percentage
      const equityToAward = (equityAgreed * completionPercentage) / 100;

      setTaskData({
        task_id: taskData.task_id,
        job_app_id: jobAppData.job_app_id,
        project_id: taskData.project_id,
        task_title: taskData.title,
        task_status: taskData.task_status,
        task_equity_allocation: taskData.equity_allocation,
        user_id: userData.id,
        user_name: `${userData.first_name} ${userData.last_name}`,
        user_email: userData.email,
        completion_percentage: task.completion_percentage || taskData.completion_percentage || 0,
        equity_agreed: equityAgreed,
        equity_awarded: equityToAward,
        hours_logged: totalHoursLogged
      });

      setEquityToAward(equityToAward);
      setCompletionPercentage(completionPercentage);
    } catch (error) {
      console.error("Error loading task review data:", error);
      toast.error("Failed to load task review data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletionChange = (value: number[]) => {
    const newValue = value[0];
    setCompletionPercentage(newValue);
    
    if (taskData) {
      // Recalculate equity award based on new completion percentage
      const newEquityToAward = (taskData.equity_agreed * newValue) / 100;
      setEquityToAward(newEquityToAward);
    }
  };

  const handleApproveTask = async () => {
    if (!taskData) return;
    
    try {
      setIsSubmitting(true);
      
      // 1. Update the accepted_jobs table with the awarded equity
      const { error: updateEquityError } = await supabase
        .from('accepted_jobs')
        .update({
          jobs_equity_allocated: equityToAward,
          updated_at: new Date().toISOString()
        })
        .eq('job_app_id', taskData.job_app_id);
      
      if (updateEquityError) throw updateEquityError;
      
      // 2. Add a comment to the ticket
      const comment = `Task approved with ${completionPercentage}% completion. Equity awarded: ${equityToAward}. ${reviewComments ? `Comments: ${reviewComments}` : ''}`;
      
      await TicketService.addComment(task.id, comment, businessId);
      
      // 3. Update the ticket status to done and completion percentage
      await supabase
        .from('tickets')
        .update({
          status: 'done',
          completion_percentage: completionPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      // 4. Update task_status in project_sub_tasks
      await supabase
        .from('project_sub_tasks')
        .update({
          task_status: 'closed',
          completion_percentage: completionPercentage,
          last_activity_at: new Date().toISOString()
        })
        .eq('task_id', taskData.task_id);
      
      // 5. Update the business_projects table with overall completion and equity allocated
      await TicketService.updateProjectCompletionAndEquity(taskData.project_id);
      
      toast.success("Task approved successfully");
      
      setOpen(false);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error approving task:", error);
      toast.error("Failed to approve task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectTask = async () => {
    if (!taskData || !reviewComments) {
      toast.error("Please provide feedback before rejecting");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 1. Update the ticket status to in-progress
      await supabase
        .from('tickets')
        .update({
          status: 'in-progress',
          completion_percentage: 80, // Set back to a lower value
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      // 2. Update task_status in project_sub_tasks
      await supabase
        .from('project_sub_tasks')
        .update({
          task_status: 'in_progress',
          completion_percentage: 80, // Set back to a lower value
          last_activity_at: new Date().toISOString()
        })
        .eq('task_id', taskData.task_id);
      
      // 3. Add a comment to the ticket
      const comment = `Task review rejected. Feedback: ${reviewComments}`;
      await TicketService.addComment(task.id, comment, businessId);
      
      toast.success("Task sent back for revision");
      
      setOpen(false);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error rejecting task:", error);
      toast.error("Failed to reject task review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReviewTab = () => {
    if (isLoading || !taskData) {
      return (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
              <CardDescription>Review the task completion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Task:</span>
                <span className="font-medium">{taskData.task_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium">
                  {taskData.task_status === 'review' ? 'Pending Review' : taskData.task_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Completion:</span>
                <span className="font-medium">{taskData.completion_percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hours Logged:</span>
                <span className="font-medium">{taskData.hours_logged} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Assigned To:</span>
                <span className="font-medium">{taskData.user_name}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Equity Review</CardTitle>
              <CardDescription>Adjust equity based on completion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Equity Agreed:</span>
                  <span className="font-medium">{taskData.equity_agreed}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Set Completion:</span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Equity to be awarded:</span>
                  <span>{equityToAward}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm">Adjust Completion Percentage:</label>
                <Slider
                  defaultValue={[completionPercentage]}
                  max={100}
                  step={5}
                  onValueChange={handleCompletionChange}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Review Feedback</CardTitle>
            <CardDescription>
              Provide feedback for the task completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add your review comments here..."
              className="min-h-[100px]"
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleRejectTask}
              disabled={isSubmitting || !reviewComments}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Send Back for Revisions
            </Button>
            <Button 
              onClick={handleApproveTask}
              disabled={isSubmitting}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve & Award Equity
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderDetailsTab = () => {
    if (isLoading || !taskData) {
      return (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Timeline</CardTitle>
            <CardDescription>History of task progress</CardDescription>
          </CardHeader>
          <CardContent className="pl-6 relative">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-100 ml-3"></div>
            
            <div className="space-y-6">
              <div className="relative pl-6">
                <div className="absolute left-0 w-2 h-2 rounded-full bg-green-500 -ml-[5px]"></div>
                <p className="font-medium text-sm">Task Created</p>
                <p className="text-gray-500 text-xs">2 weeks ago</p>
              </div>
              
              <div className="relative pl-6">
                <div className="absolute left-0 w-2 h-2 rounded-full bg-blue-500 -ml-[5px]"></div>
                <p className="font-medium text-sm">Work Started</p>
                <p className="text-gray-500 text-xs">10 days ago</p>
              </div>
              
              <div className="relative pl-6">
                <div className="absolute left-0 w-2 h-2 rounded-full bg-purple-500 -ml-[5px]"></div>
                <p className="font-medium text-sm">First Time Log</p>
                <p className="text-gray-500 text-xs">8 days ago</p>
                <p className="text-gray-600 text-xs mt-1">2 hours logged</p>
              </div>
              
              <div className="relative pl-6">
                <div className="absolute left-0 w-2 h-2 rounded-full bg-amber-500 -ml-[5px]"></div>
                <p className="font-medium text-sm">Submitted for Review</p>
                <p className="text-gray-500 text-xs">Today</p>
                <p className="text-gray-600 text-xs mt-1">Total: {taskData.hours_logged} hours logged</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Detailed Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">{taskData.user_name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Last Activity</p>
                  <p className="font-medium">Today</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Hours Logged</p>
                  <p className="font-medium">{taskData.hours_logged} hours</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Completion</p>
                  <p className="font-medium">{taskData.completion_percentage}%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <CircleDollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Equity Allocated</p>
                  <p className="font-medium">{taskData.equity_agreed}%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium capitalize">{taskData.task_status.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Task Completion</DialogTitle>
          <DialogDescription>
            Review the task completion and award equity points
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="review">Review & Approve</TabsTrigger>
            <TabsTrigger value="details">Task Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="review" className="mt-0">
            {renderReviewTab()}
          </TabsContent>
          
          <TabsContent value="details" className="mt-0">
            {renderDetailsTab()}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
