
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobApplication } from '@/types/jobSeeker';
import { ArrowDown, ArrowUp, Clock, Eye, MessageSquare, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export interface EquityProjectItemProps {
  application: JobApplication;
  onApplicationUpdated: () => void;
}

export const EquityProjectItem: React.FC<EquityProjectItemProps> = ({ 
  application, 
  onApplicationUpdated 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  
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
  
  // Get equity information
  const equityAgreed = application.accepted_jobs?.equity_agreed || 0;
  const equityAllocated = application.accepted_jobs?.jobs_equity_allocated || 0;
  const hoursLogged = application.hours_logged || 0;
  
  // Calculate percentage of equity earned vs agreed
  const percentageEarned = equityAgreed > 0 
    ? ((equityAllocated / equityAgreed) * 100).toFixed(1) 
    : "0.0";
  
  // Format for display, showing earned/total
  const equityDisplay = `${equityAllocated}%/${equityAgreed}%`;
  
  return (
    <Card className="mb-4 overflow-hidden">
      <div className="border-b cursor-pointer" onClick={toggleExpand}>
        <div className="flex flex-col md:flex-row justify-between p-4">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <CardTitle className="text-lg flex items-center">
                  {application.business_roles?.title}
                  <Badge className="ml-2 bg-green-500" variant="secondary">
                    accepted
                  </Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  {application.business_roles?.company_name} | Project: {application.business_roles?.project_title}
                </div>
                <div className="text-xs text-muted-foreground">
                  Applied: {getTimeAgo(application.applied_at)}
                </div>
              </div>
              <div className="flex items-center">
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
              
              {/* Skills Required between Task Status and Timeframe */}
              <div>
                <div className="text-xs font-medium">Skills Required</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.isArray(application.business_roles?.skill_requirements) ? 
                    application.business_roles?.skill_requirements.map((skill, index) => {
                      const skillName = typeof skill === 'string' ? skill : skill.skill;
                      const level = typeof skill === 'string' ? 'Intermediate' : skill.level;
                      
                      return (
                        <Badge variant="outline" key={index} className="text-xs">
                          {skillName} <span className="ml-1 opacity-70">({level})</span>
                        </Badge>
                      );
                    }) : 
                    <span className="text-muted-foreground text-xs">No skills specified</span>
                  }
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium">Timeframe</div>
                <div className="text-sm">{formatTimeframe(application.business_roles?.timeframe)}</div>
              </div>
              
              {/* Equity Allocation / Earned between Timeframe and Hours Logged */}
              <div>
                <div className="text-xs font-medium">Equity Allocation / Earned</div>
                <div className="text-sm group relative" title={`${equityAllocated}% earned of ${equityAgreed}% agreed equity`}>
                  {equityDisplay}
                  <span className="absolute left-0 -top-8 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {equityAllocated}% earned of {equityAgreed}% agreed equity
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium">Hours Logged</div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span>{hoursLogged}h</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0 space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                handleWithdraw();
              }}
              className="whitespace-nowrap"
            >
              Withdraw
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="whitespace-nowrap"
              disabled={true}
            >
              Accepted
            </Button>
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
                        <div className="text-sm">0h</div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="text-sm font-medium">Hours Logged:</div>
                        <div className="text-sm">{hoursLogged}h</div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="text-sm font-medium">Completion:</div>
                        <div className="text-sm">{application.business_roles?.completion_percentage || 0}%</div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="text-sm font-medium">Equity Agreed:</div>
                        <div className="text-sm">{equityAgreed}%</div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="text-sm font-medium">Equity Earned:</div>
                        <div className="text-sm">{equityAllocated}%</div>
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
                      <span className="text-sm font-medium">{equityAgreed}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Equity Allocated:</span>
                      <span className="text-sm font-medium">{equityAllocated}%</span>
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

                {/* Add Equity Earned section when fully allocated */}
                {equityAgreed > 0 && equityAllocated >= equityAgreed && (
                  <div>
                    <h4 className="font-medium mb-2">Equity Earned</h4>
                    <div className="bg-green-50 p-3 rounded-md border border-green-200">
                      <div className="text-green-700 font-medium">
                        Congratulations! You have earned the full {equityAgreed}% equity for this project.
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        This equity has been fully allocated to your portfolio.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Card>
  );
};
