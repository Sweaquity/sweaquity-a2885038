
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, Clock, FileText, MoreHorizontal, X, Check, AlertCircle } from "lucide-react";
import { JobApplication, Skill } from "@/types/jobSeeker";
import { formatDistanceToNow } from "date-fns";
import { SkillBadge } from "../SkillBadge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ApplicationItemProps {
  application: JobApplication;
  getMatchedSkills: () => string[];
  onApplicationUpdated?: () => void;
}

export const ApplicationItem = ({ 
  application, 
  getMatchedSkills,
  onApplicationUpdated 
}: ApplicationItemProps) => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { 
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", 
        icon: <Clock className="h-3.5 w-3.5 mr-1" /> 
      },
      "in review": { 
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", 
        icon: <FileText className="h-3.5 w-3.5 mr-1" /> 
      },
      accepted: { 
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", 
        icon: <Check className="h-3.5 w-3.5 mr-1" /> 
      },
      rejected: { 
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", 
        icon: <X className="h-3.5 w-3.5 mr-1" /> 
      },
      withdrawn: { 
        color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", 
        icon: <AlertCircle className="h-3.5 w-3.5 mr-1" /> 
      },
      negotiation: { 
        color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", 
        icon: <FileText className="h-3.5 w-3.5 mr-1" /> 
      }
    };

    const { color, icon } = statusMap[status.toLowerCase()] || statusMap.pending;

    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  const handleWithdrawApplication = async () => {
    if (!withdrawReason.trim()) {
      toast.error("Please provide a reason for withdrawing your application");
      return;
    }

    setIsWithdrawing(true);

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: 'withdrawn',
          notes: withdrawReason
        })
        .eq('job_app_id', application.job_app_id);

      if (error) throw error;

      toast.success("Application withdrawn successfully");
      setIsWithdrawDialogOpen(false);
      
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    } catch (error) {
      console.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const matchedSkills = getMatchedSkills();
  const timeAgo = application.applied_at 
    ? formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })
    : 'recently';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">
              {application.business_roles?.title || "Untitled Role"}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Briefcase className="h-4 w-4 mr-1" />
              {application.business_roles?.company_name || "Unknown Company"}
              {application.business_roles?.project_title && (
                <span className="ml-2">• {application.business_roles.project_title}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(application.status)}
            
            {['pending', 'in review'].includes(application.status.toLowerCase()) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsWithdrawDialogOpen(true)}>
                    Withdraw Application
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            Applied {timeAgo}
          </div>
          
          {application.business_roles?.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Role Description:</h4>
              <p className="text-sm text-muted-foreground">
                {application.business_roles.description}
              </p>
            </div>
          )}
          
          {application.message && (
            <div>
              <h4 className="text-sm font-medium mb-1">Your Application Message:</h4>
              <p className="text-sm text-muted-foreground">
                {application.message}
              </p>
            </div>
          )}
          
          {matchedSkills.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Your Matching Skills:</h4>
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((skill, index) => (
                  <SkillBadge 
                    key={index} 
                    skill={{ skill, level: "Intermediate" }} 
                    isUserSkill={true} 
                  />
                ))}
              </div>
            </div>
          )}
          
          {application.notes && application.status.toLowerCase() === 'withdrawn' && (
            <div>
              <h4 className="text-sm font-medium mb-1">Withdrawal Reason:</h4>
              <p className="text-sm text-muted-foreground">
                {application.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for withdrawing (required)
              </label>
              <Textarea
                id="reason"
                placeholder="Please explain why you're withdrawing your application..."
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleWithdrawApplication}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? "Withdrawing..." : "Withdraw Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
