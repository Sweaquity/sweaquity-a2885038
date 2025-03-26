
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExtendedJobApplication } from "@/types/jobSeeker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Calendar, ArrowUpRight, CircleDollarSign, FileText, BarChart2, Check, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface EquityProjectItemProps {
  application: ExtendedJobApplication;
  onViewApplication?: (application: ExtendedJobApplication) => void;
  onViewContract?: (application: ExtendedJobApplication) => void;
}

export const EquityProjectItem = ({ 
  application, 
  onViewApplication,
  onViewContract
}: EquityProjectItemProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState("");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "withdrawn":
        return "bg-gray-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const getFormattedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleWithdraw = () => {
    if (!withdrawalReason.trim()) {
      toast.error("Please provide a reason for withdrawal");
      return;
    }
    setIsConfirmOpen(false);
    toast.success("Application withdrawn successfully");
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const renderApplicationDetails = () => {
    const project = application.business_roles || {};
    
    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-sm mb-1">Project Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <div className="w-24 text-gray-500">Title:</div>
                <div className="flex-1 font-medium">{project.project_title || "Untitled Project"}</div>
              </div>
              <div className="flex items-start">
                <div className="w-24 text-gray-500">Role:</div>
                <div className="flex-1 font-medium">{project.title || "Untitled Role"}</div>
              </div>
              <div className="flex items-start">
                <div className="w-24 text-gray-500">Company:</div>
                <div className="flex-1">{project.company_name || "Unknown Company"}</div>
              </div>
              {project.timeframe && (
                <div className="flex items-start">
                  <div className="w-24 text-gray-500">Timeframe:</div>
                  <div className="flex-1">{project.timeframe}</div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-1">Application Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <div className="w-24 text-gray-500">Status:</div>
                <div className="flex-1">
                  <Badge className={getStatusColor(application.status)}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-24 text-gray-500">Applied:</div>
                <div className="flex-1">{getFormattedDate(application.applied_at)}</div>
              </div>
              {application.status === "accepted" && (
                <>
                  <div className="flex items-start">
                    <div className="w-24 text-gray-500">Equity:</div>
                    <div className="flex-1 font-medium text-green-600">
                      {application.accepted_jobs?.equity_agreed || 0}%
                    </div>
                  </div>
                  
                  {application.accepted_jobs && application.accepted_jobs.jobs_equity_allocated !== undefined && (
                    <div className="flex items-start">
                      <div className="w-24 text-gray-500">Earned:</div>
                      <div className="flex-1 font-medium">
                        {application.accepted_jobs.jobs_equity_allocated}% of {application.accepted_jobs.equity_agreed}%
                      </div>
                    </div>
                  )}
                  
                  {project.completion_percentage !== undefined && (
                    <div className="flex items-start">
                      <div className="w-24 text-gray-500">Progress:</div>
                      <div className="flex-1 w-full">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{project.completion_percentage}% Complete</span>
                        </div>
                        <Progress value={project.completion_percentage} className="h-2" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-sm mb-1">Description</h3>
          <p className="text-sm text-gray-700">
            {project.description || "No description provided for this role."}
          </p>
        </div>
        
        {application.message && (
          <div>
            <h3 className="font-medium text-sm mb-1">Your Application Message</h3>
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              {application.message}
            </div>
          </div>
        )}
        
        {application.status === "pending" && (
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsConfirmOpen(true)}
            >
              Withdraw Application
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderEquityProgressTab = () => {
    if (application.status !== "accepted") {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No Equity Progress Yet</h3>
          <p className="text-sm text-gray-400 max-w-md mt-1">
            Equity progress will be available after your application is accepted and you start working on the project.
          </p>
        </div>
      );
    }
    
    // Calculate percentages
    const equityAgreed = application.accepted_jobs?.equity_agreed || 0;
    const equityEarned = application.accepted_jobs?.jobs_equity_allocated || 0;
    const earnedPercentage = equityAgreed > 0 ? (equityEarned / equityAgreed) * 100 : 0;
    const projectCompletion = application.business_roles?.completion_percentage || 0;
    
    return (
      <div className="space-y-6 py-2">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <CircleDollarSign className="h-4 w-4 mr-1 text-green-500" />
              Equity Overview
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Total Equity Allocation</span>
                  <span className="font-medium">{equityAgreed}%</span>
                </div>
                <Progress value={100} className="h-2 bg-gray-100" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Equity Earned So Far</span>
                  <span className="font-medium">{equityEarned}%</span>
                </div>
                <Progress value={earnedPercentage} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Project Completion</span>
                  <span className="font-medium">{projectCompletion}%</span>
                </div>
                <Progress 
                  value={projectCompletion} 
                  className={`h-2 ${getCompletionColor(projectCompletion)}`} 
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-1 text-blue-500" />
              Time Tracking
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Hours Logged</span>
                <span className="text-lg font-medium">{application.hours_logged || 0} hrs</span>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                View Time Log
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <FileText className="h-4 w-4 mr-1 text-purple-500" />
            Contract & Documentation
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-sm">Equity Agreement</p>
                <p className="text-xs text-gray-500">Signed on {getFormattedDate(application.applied_at)}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onViewContract && onViewContract(application)}
              >
                View
              </Button>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-sm">Project Requirements</p>
                <p className="text-xs text-gray-500">Last updated 3 days ago</p>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">
              {application.business_roles?.title || "Untitled Position"}
            </CardTitle>
            <Badge className={getStatusColor(application.status)}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Avatar className="h-5 w-5 mr-1">
              <AvatarFallback className="text-xs">
                {(application.business_roles?.company_name || "?").charAt(0)}
              </AvatarFallback>
            </Avatar>
            {application.business_roles?.company_name || "Unknown Company"}
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          <div className="flex flex-wrap gap-4 text-sm my-1">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
              {application.business_roles?.timeframe || "Flexible"}
            </div>
            
            {application.status === "accepted" && application.accepted_jobs?.equity_agreed && (
              <div className="flex items-center">
                <CircleDollarSign className="h-4 w-4 mr-1 text-green-500" />
                {application.accepted_jobs.equity_agreed}% equity
              </div>
            )}
            
            {application.business_roles?.completion_percentage !== undefined && 
             application.status === "accepted" && (
              <div className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-1 text-blue-500" />
                {application.business_roles.completion_percentage}% complete
              </div>
            )}
          </div>
          
          {application.status === "accepted" && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Project Progress</span>
                {application.business_roles?.task_status === "closed" && (
                  <span className="text-green-600 flex items-center">
                    <Check className="h-3 w-3 mr-1" /> Complete
                  </span>
                )}
              </div>
              <Progress 
                value={application.business_roles?.completion_percentage || 0} 
                className={`h-2 ${
                  getCompletionColor(application.business_roles?.completion_percentage || 0)
                }`} 
              />
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500"
              onClick={() => setIsDetailsSheetOpen(true)}
            >
              Details
            </Button>
            
            {application.status === "accepted" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewApplication && onViewApplication(application)}
              >
                Open Project
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {application.business_roles?.title || "Untitled Position"}
            </SheetTitle>
            <SheetDescription>
              {application.business_roles?.company_name || "Unknown Company"}
            </SheetDescription>
          </SheetHeader>
          
          <Separator className="my-4" />
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="equity">Equity Progress</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-0">
              {renderApplicationDetails()}
            </TabsContent>
            
            <TabsContent value="equity" className="mt-0">
              {renderEquityProgressTab()}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
      
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-sm mb-2 block">
              Please provide a reason (required):
            </label>
            <Textarea
              value={withdrawalReason}
              onChange={(e) => setWithdrawalReason(e.target.value)}
              placeholder="I'm no longer available for this project..."
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleWithdraw}
              disabled={!withdrawalReason.trim()}
            >
              Withdraw Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
