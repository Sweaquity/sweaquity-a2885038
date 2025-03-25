
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Check, Clock, ExternalLink, X } from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input"; 
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ProgressCircle } from "@/components/ui/progress-circle";

// Define interfaces
export interface TaskCompletionReviewProps {
  businessId: string | null;
  task?: any; // Optional task parameter for when used in a dialog
  onClose?: () => void;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface TaskReview {
  task_id: string;
  task_title: string;
  task_description: string;
  project_title: string;
  project_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  completion_percentage: number;
  equity_allocation: number;
  equity_earned: number;
  status: string;
  job_app_id: string;
  total_hours_logged?: number;
}

export const TaskCompletionReview = ({ 
  businessId,
  task,
  onClose,
  open,
  setOpen
}: TaskCompletionReviewProps) => {
  const [taskReviews, setTaskReviews] = useState<TaskReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [equityValues, setEquityValues] = useState<Record<string, number>>({});
  
  useEffect(() => {
    if (businessId) {
      fetchTaskReviews();
    }
  }, [businessId]);
  
  const fetchTaskReviews = async () => {
    if (!businessId) return;
    
    try {
      setLoading(true);
      
      // Get all projects for this business
      const { data: projects, error: projectsError } = await supabase
        .from('business_projects')
        .select('project_id, title')
        .eq('business_id', businessId);
        
      if (projectsError) throw projectsError;
      
      if (!projects || projects.length === 0) {
        setLoading(false);
        return;
      }
      
      const projectIds = projects.map(p => p.project_id);
      
      // Get all job applications for tasks in these projects
      const { data: applications, error: appsError } = await supabase
        .from('job_applications')
        .select(`
          job_app_id,
          task_id,
          user_id,
          project_id,
          status,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .in('project_id', projectIds)
        .eq('status', 'accepted');
        
      if (appsError) throw appsError;
      
      if (!applications || applications.length === 0) {
        setLoading(false);
        return;
      }
      
      // Get all task details
      const taskIds = applications.map(app => app.task_id);
      
      const { data: tasks, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select('task_id, title, description, completion_percentage, equity_allocation, project_id')
        .in('task_id', taskIds);
        
      if (tasksError) throw tasksError;
      
      if (!tasks) {
        setLoading(false);
        return;
      }
      
      // Get all accepted jobs
      const appIds = applications.map(app => app.job_app_id);
      
      const { data: acceptedJobs, error: jobsError } = await supabase
        .from('accepted_jobs')
        .select('job_app_id, equity_agreed')
        .in('job_app_id', appIds);
        
      if (jobsError) throw jobsError;
      
      // Get total hours logged
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('ticket_id, job_app_id, hours_logged')
        .in('job_app_id', appIds);
        
      if (timeError) throw timeError;
      
      // Map everything together
      const reviews: TaskReview[] = [];
      
      for (const app of applications) {
        const task = tasks.find(t => t.task_id === app.task_id);
        if (!task) continue;
        
        const project = projects.find(p => p.project_id === task.project_id);
        if (!project) continue;
        
        const acceptedJob = acceptedJobs?.find(job => job.job_app_id === app.job_app_id);
        
        // Calculate total hours logged
        const taskHours = timeEntries
          ?.filter(entry => entry.job_app_id === app.job_app_id)
          .reduce((total, entry) => total + (entry.hours_logged || 0), 0) || 0;
        
        // Fix for profiles access - ensuring it's an object with first_name and last_name
        const profileData = app.profiles || {};
        const firstName = profileData.first_name || '';
        const lastName = profileData.last_name || '';
        const userName = `${firstName} ${lastName}`.trim() || 'Unknown user';
        
        reviews.push({
          task_id: task.task_id,
          task_title: task.title,
          task_description: task.description || '',
          project_title: project.title,
          project_id: project.project_id,
          user_id: app.user_id,
          user_name: userName,
          completion_percentage: task.completion_percentage || 0,
          equity_allocation: task.equity_allocation || 0,
          equity_earned: acceptedJob?.equity_agreed || 0,
          status: app.status,
          job_app_id: app.job_app_id,
          total_hours_logged: taskHours
        });
      }
      
      // Initialize equity values state
      const initialEquityValues: Record<string, number> = {};
      
      reviews.forEach(review => {
        initialEquityValues[review.job_app_id] = review.equity_earned;
      });
      
      setEquityValues(initialEquityValues);
      setTaskReviews(reviews);
    } catch (error) {
      console.error('Error fetching task reviews:', error);
      toast.error("Failed to load task reviews");
    } finally {
      setLoading(false);
    }
  };
  
  const handleEquityChange = (jobAppId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEquityValues(prev => ({
      ...prev,
      [jobAppId]: numValue
    }));
  };
  
  const handleUpdateEquity = async (jobAppId: string) => {
    try {
      const { error } = await supabase
        .from('accepted_jobs')
        .update({ equity_agreed: equityValues[jobAppId] || 0 })
        .eq('job_app_id', jobAppId);
        
      if (error) throw error;
      
      toast.success("Equity update successful");
      
      // Refresh the data
      fetchTaskReviews();
    } catch (error) {
      console.error('Error updating equity:', error);
      toast.error("Failed to update equity");
    }
  };
  
  const getPendingReviews = () => {
    return taskReviews.filter(review => review.completion_percentage >= 50 && review.completion_percentage < 100);
  };
  
  const getCompletedReviews = () => {
    return taskReviews.filter(review => review.completion_percentage >= 100);
  };
  
  const getInProgressReviews = () => {
    return taskReviews.filter(review => review.completion_percentage < 50);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending Review ({getPendingReviews().length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({getCompletedReviews().length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({getInProgressReviews().length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              {loading ? (
                <div className="py-8 text-center">Loading task reviews...</div>
              ) : getPendingReviews().length === 0 ? (
                <div className="py-8 text-center">No tasks pending review.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project / Task</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Allocated Equity</TableHead>
                      <TableHead>Approve Equity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPendingReviews().map(review => (
                      <TableRow key={review.task_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{review.project_title}</div>
                            <div className="text-sm text-muted-foreground">{review.task_title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={review.user_avatar} />
                              <AvatarFallback>{review.user_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{review.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ProgressCircle 
                              value={review.completion_percentage}
                              size="sm"
                              strokeWidth={4}
                            />
                            <span>{review.completion_percentage}%</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <Clock className="inline-block h-3 w-3 mr-1" />
                            {review.total_hours_logged || 0} hours logged
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge>{review.equity_allocation}%</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number"
                              min="0"
                              max={review.equity_allocation}
                              step="0.01"
                              value={equityValues[review.job_app_id] || 0}
                              onChange={(e) => handleEquityChange(review.job_app_id, e.target.value)}
                              className="w-20"
                            />
                            <span>%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateEquity(review.job_app_id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Update
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {loading ? (
                <div className="py-8 text-center">Loading completed tasks...</div>
              ) : getCompletedReviews().length === 0 ? (
                <div className="py-8 text-center">No tasks have been completed yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project / Task</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Allocated Equity</TableHead>
                      <TableHead>Earned Equity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCompletedReviews().map(review => (
                      <TableRow key={review.task_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{review.project_title}</div>
                            <div className="text-sm text-muted-foreground">{review.task_title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={review.user_avatar} />
                              <AvatarFallback>{review.user_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{review.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ProgressCircle
                              value={review.completion_percentage}
                              size="sm" 
                              strokeWidth={4}
                            />
                            <span>{review.completion_percentage}%</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <Clock className="inline-block h-3 w-3 mr-1" />
                            {review.total_hours_logged || 0} hours logged
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge>{review.equity_allocation}%</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{review.equity_earned}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="in-progress">
              {loading ? (
                <div className="py-8 text-center">Loading in-progress tasks...</div>
              ) : getInProgressReviews().length === 0 ? (
                <div className="py-8 text-center">No tasks in progress.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project / Task</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Allocated Equity</TableHead>
                      <TableHead>Hours Logged</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getInProgressReviews().map(review => (
                      <TableRow key={review.task_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{review.project_title}</div>
                            <div className="text-sm text-muted-foreground">{review.task_title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={review.user_avatar} />
                              <AvatarFallback>{review.user_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{review.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ProgressCircle 
                              value={review.completion_percentage}
                              size="sm"
                              strokeWidth={4}
                            />
                            <span>{review.completion_percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge>{review.equity_allocation}%</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{review.total_hours_logged || 0} hours</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
