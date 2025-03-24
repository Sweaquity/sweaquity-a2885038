
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";

interface TaskCompletionReviewProps {
  businessId: string;
  task?: any;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onClose?: () => void;
}

export const TaskCompletionReview = ({ 
  businessId, 
  task,
  open = false,
  setOpen = () => {},
  onClose = () => {}
}: TaskCompletionReviewProps) => {
  const [loading, setLoading] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [jobApplicationData, setJobApplicationData] = useState<any>(null);
  const [totalHoursLogged, setTotalHoursLogged] = useState(0);

  useEffect(() => {
    if (task?.task_id) {
      setCompletionPercentage(task.completion_percentage || 0);
      loadTaskDetails(task.task_id);
    }
  }, [task]);

  const loadTaskDetails = async (taskId: string) => {
    setLoading(true);
    try {
      // Get job application for this task
      const { data: appData, error: appError } = await supabase
        .from('job_applications')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('task_id', taskId)
        .maybeSingle();
        
      if (appError) throw appError;
      setJobApplicationData(appData);
      
      // Get tickets for this task
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .eq('task_id', taskId);
        
      if (ticketError) throw ticketError;
      
      if (ticketData && ticketData.length > 0 && appData?.user_id) {
        // Load time entries for these tickets
        const ticketIds = ticketData.map(t => t.id);
        
        const { data: timeData, error: timeError } = await supabase
          .from('time_entries')
          .select('*')
          .in('ticket_id', ticketIds)
          .eq('user_id', appData.user_id);
          
        if (timeError) throw timeError;
        
        setTimeEntries(timeData || []);
        
        // Calculate total hours
        const total = (timeData || []).reduce((sum, entry) => sum + (entry.hours_logged || 0), 0);
        setTotalHoursLogged(total);
      }
      
    } catch (error) {
      console.error('Error loading task details:', error);
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!task?.task_id) return;
    
    setLoading(true);
    try {
      // Update task completion percentage
      const { error: updateError } = await supabase
        .from('project_sub_tasks')
        .update({ 
          completion_percentage: completionPercentage,
          last_activity_at: new Date().toISOString()
        })
        .eq('task_id', task.task_id);
        
      if (updateError) throw updateError;
      
      // Get tickets for this task
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id, notes')
        .eq('task_id', task.task_id);
        
      if (ticketError) throw ticketError;
      
      // Update notes on tickets
      if (ticketData && ticketData.length > 0 && feedback) {
        for (const ticket of ticketData) {
          const currentNotes = ticket.notes || [];
          
          const { data: profileData } = await supabase
            .from('businesses')
            .select('company_name')
            .eq('businesses_id', businessId)
            .single();
            
          const reviewerName = profileData?.company_name || 'Business';
          
          const newNote = {
            id: Date.now().toString(),
            user: reviewerName,
            timestamp: new Date().toISOString(),
            action: 'Review Feedback',
            comment: feedback
          };
          
          const updatedNotes = [...currentNotes, newNote];
          
          await supabase
            .from('tickets')
            .update({ 
              notes: updatedNotes,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticket.id);
        }
      }
      
      toast.success("Task review saved successfully");
      setOpen(false);
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("Failed to save review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Task Completion Review</DialogTitle>
        </DialogHeader>
        
        {task && (
          <div className="grid gap-6">
            <div className="grid gap-2">
              <h3 className="font-medium text-lg">{task.title}</h3>
              <p className="text-muted-foreground">{task.description}</p>
              
              <div className="flex items-center justify-between mt-2">
                <div>
                  <Label>Equity Allocation:</Label>
                  <div className="text-lg font-semibold">{task.equity_allocation}%</div>
                </div>
                <div>
                  <Label>Timeframe:</Label>
                  <div>{task.timeframe}</div>
                </div>
                <div>
                  <Label>Current Status:</Label>
                  <div className="capitalize">{task.task_status || task.status}</div>
                </div>
              </div>
            </div>
            
            {jobApplicationData && (
              <div className="grid gap-2 p-4 border rounded-md">
                <h4 className="font-medium">Assigned To:</h4>
                <div>
                  {jobApplicationData.profiles?.first_name} {jobApplicationData.profiles?.last_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {jobApplicationData.profiles?.email}
                </div>
              </div>
            )}
            
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <ProgressCircle 
                  value={completionPercentage} 
                  size={80} 
                  strokeWidth={8}
                  className="text-primary"
                />
                <div className="flex-1">
                  <Label>Completion Percentage: {completionPercentage}%</Label>
                  <Slider
                    value={[completionPercentage]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(values) => setCompletionPercentage(values[0])}
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add your review feedback here..."
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <h4 className="font-medium">Time Tracking Summary</h4>
              <div className="text-lg font-semibold">
                Total Hours Logged: {totalHoursLogged.toFixed(2)}
              </div>
              
              {timeEntries.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                  {timeEntries.map((entry) => (
                    <div key={entry.id} className="flex justify-between p-2 text-sm border-b">
                      <span>{entry.description?.substring(0, 30)}{entry.description?.length > 30 ? '...' : ''}</span>
                      <span>{entry.hours_logged} hours</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">No time entries recorded yet</div>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => {
            setOpen(false);
            onClose();
          }} variant="outline">Cancel</Button>
          <Button onClick={handleUpdateTask} disabled={loading}>
            {loading ? "Saving..." : "Save Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
