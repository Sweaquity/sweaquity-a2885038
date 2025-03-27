
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EquityProjectItemProps, JobApplication } from '@/types/jobSeeker';
import { ArrowDown, ArrowUp, Clock, Eye, MessageSquare, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export const EquityProjectItem: React.FC<EquityProjectItemProps> = ({ 
  application, 
  onApplicationUpdated 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [equityData, setEquityData] = useState({
    equityAgreed: 0,
    equityAllocated: 0
  });
  const [hoursData, setHoursData] = useState({
    hoursLogged: 0,
    estimatedHours: 0
  });
  
  // Fetch equity and hours data
  useEffect(() => {
    const fetchEquityData = async () => {
      try {
        // Get equity data from accepted_jobs using job_app_id
        const { data: acceptedJobsData, error: acceptedJobsError } = await supabase
          .from('accepted_jobs')
          .select('equity_agreed, jobs_equity_allocated')
          .eq('job_app_id', application.job_app_id)
          .single();
          
        if (acceptedJobsError) {
          console.error("Error fetching equity data:", acceptedJobsError);
        } else if (acceptedJobsData) {
          setEquityData({
            equityAgreed: acceptedJobsData.equity_agreed || 0,
            equityAllocated: acceptedJobsData.jobs_equity_allocated || 0
          });
        }
        
        // Get ticket data using task_id
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('id, estimated_hours')
          .eq('task_id', application.task_id)
          .single();
          
        if (ticketError) {
          console.error("Error fetching ticket data:", ticketError);
        } else if (ticketData) {
          // Get hours logged data from time_entries
          const { data: timeEntries, error: timeEntriesError } = await supabase
            .from('time_entries')
            .select('hours_logged')
            .eq('ticket_id', ticketData.id);
            
          if (timeEntriesError) {
            console.error("Error fetching time entries:", timeEntriesError);
          } else if (timeEntries) {
            const totalHoursLogged = timeEntries.reduce((total, entry) => total + (entry.hours_logged || 0), 0);
            setHoursData({
              hoursLogged: totalHoursLogged,
              estimatedHours: ticketData.estimated_hours || 0
            });
          }
        }
      } catch (error) {
        console.error("Error in data fetching:", error);
      }
    };
    
    fetchEquityData();
  }, [application.job_app_id, application.task_id]);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const formatTimeframe = (timeframe: string | undefined) => {
    if (!timeframe) return "Not specified";
    return timeframe;
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  const getTimeAgo = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };
  
  const handleWithdraw = async () => {
    try {
      setIsWithdrawing(true);
      
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: 'withdrawn',
          notes: withdrawReason ? [{
            timestamp: new Date().toISOString(),
            content: `Withdrawn: ${withdrawReason}`
          }] : undefined
        })
        .eq('job_app_id', application.job_app_id);
        
      if (error) throw error;
      
      toast.success("Application withdrawn successfully");
      onApplicationUpdated();
    } catch (error) {
      console.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application");
    } finally {
      setIsWithdrawing(false);
      setWithdrawReason("");
    }
  };
  
  const handleSendMessage = () => {
    toast.info("The messaging feature is coming soon");
  };
  
  const handleViewProject = () => {
    toast.info("Project view feature is coming soon");
  };
  
  // Calculate percentage of equity earned vs agreed
  const percentageEarned = equityData.equityAgreed > 0 
    ? ((equityData.equityAllocated / equityData.equityAgreed) * 100).toFixed(1) 
    : "0.0";
  
  // Format for display, showing earned/total
  const equityDisplay = `${equityData.equityAllocated}%/${equityData.equityAgreed}%`;
  const hoursDisplay = `${hoursData.hoursLogged}h/${hoursData.estimatedHours}h`;
  const completionPercentage = application.business_roles?.completion_percentage || 0;
  
  return (
    <Card className="mb-4 overflow-hidden">
      <div className="border-b cursor-pointer" onClick={toggleExpand}>
        <div className="flex flex-col md:flex-row justify-between p-4">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-lg flex items-center font-medium">
                  {application.business_roles?.title}
                  <Badge className="ml-2 bg-green-500" variant="secondary">
                    accepted
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {application.business_roles?.company_name} | Project: {application.business_roles?.project_title}
                </div>
                <div className="text-xs text-muted-foreground">
                  Applied: {getTimeAgo(application.applied_at)}
                </div>
              </div>
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWithdraw();
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Withdraw
                </Button>
                {isExpanded ? (
                  <ArrowUp className="h-4 w-4 ml-2" />
                ) : (
                  <ArrowDown className="h-4 w-4 ml-2" />
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2">
              <div>
                <div className="text-xs font-medium">Task Status</div>
                <div className="text-sm">{application.business_roles?.task_status || "pending"}</div>
              </div>
              <div>
                <div className="text-xs font-medium">Timeframe</div>
                <div className="text-sm">{formatTimeframe(application.business_roles?.timeframe)}</div>
              </div>
              <div>
                <div className="text-xs font-medium">Equity Allocation/Earned</div>
                <div className="text-sm">{equityDisplay}</div>
              </div>
              <div>
                <div className="text-xs font-medium">Hours Logged/Estimated</div>
                <div className="text-sm">{hoursDisplay}</div>
              </div>
              <div>
                <div className="text-xs font-medium">Completion</div>
                <div className="text-sm">{completionPercentage}%</div>
              </div>
            </div>
            
            <div className="mt-2">
              <div className="text-xs font-medium">Skills Required</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.isArray(application.business_roles?.skill_requirements) ? 
                  application.business_roles?.skill_requirements.map((skill, index) => {
                    const skillName = typeof skill === 'string' ? skill : skill.skill;
                    const level = typeof skill === 'string' ? 'Intermediate' : skill.level;
                    
                    return (
                      <Badge variant="outline" key={index} className="text-xs">
                        {skillName} {level && <span className="ml-1 opacity-70">({level})</span>}
                      </Badge>
                    );
                  }) : 
                  <span className="text-muted-foreground text-xs">No skills specified</span>
                }
              </div>
            </div>
          </div>
          
          <div className="flex mt-4 md:mt-0 justify-between items-center">
            <div>
              <Button variant="outline" size="sm" className="w-24">
                {application.status === 'accepted' ? 'Accepted' : application.status}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full border-b rounded-none">
              <TabsTrigger value="details" className="flex-1">Project Details</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">Activity & Hours</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Project Description</h4>
                  <p className="text-sm text-muted-foreground">{application.business_roles?.description || "No description provided."}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Task Information</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2">
                        <div className="text-sm font-medium">Estimated Hours:</div>
                        <div className="text-sm">{hoursData.estimatedHours}h</div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="text-sm font-medium">Hours Logged:</div>
                        <div className="text-sm">{hoursData.hoursLogged}h</div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="text-sm font-medium">Completion:</div>
                        <div className="text-sm">{completionPercentage}%</div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="text-sm font-medium">Equity Agreed:</div>
                        <div className="text-sm">{equityData.equityAgreed}%</div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="text-sm font-medium">Equity Earned:</div>
                        <div className="text-sm">{equityData.equityAllocated}%</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={handleSendMessage}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Send Message
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleViewProject}>
                        <Eye className="h-4 w-4 mr-1" />
                        View Project
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Application Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex">
                      <div className="flex-none w-32 text-sm font-medium">Applied:</div>
                      <div className="text-sm">{formatDate(application.applied_at)}</div>
                    </div>
                    {application.accepted_jobs?.date_accepted && (
                      <div className="flex">
                        <div className="flex-none w-32 text-sm font-medium">Accepted:</div>
                        <div className="text-sm">{formatDate(application.accepted_jobs.date_accepted)}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Equity Tracking</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Equity Agreed:</span>
                      <span className="text-sm font-medium">{equityData.equityAgreed}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Equity Allocated:</span>
                      <span className="text-sm font-medium">{equityData.equityAllocated}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${parseFloat(percentageEarned)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-muted-foreground">{percentageEarned}% earned</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Card>
  );
};
