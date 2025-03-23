
import { Application } from "@/types/business";
import { JobApplication } from "@/types/jobSeeker";
import { useState } from "react";
import { Expand, MessageSquare, CheckCircle, ShieldAlert } from "lucide-react";
import { ExpandedApplicationContent } from "../ExpandedApplicationContent";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateMessageDialog } from "@/components/job-seeker/dashboard/applications/CreateMessageDialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ActiveApplicationsTableProps {
  applications: Application[];
  expandedApplications: Set<string>;
  toggleApplicationExpanded: (applicationId: string) => void;
  handleStatusChange: (applicationId: string, newStatus: string) => Promise<void>;
  isUpdatingStatus: string | null;
  onApplicationUpdate: () => void;
  openAcceptJobDialog: (application: Application) => Promise<void>;
  handleAcceptJob: (application: JobApplication) => Promise<void>;
  isAcceptingJobLoading: boolean;
}

export const ActiveApplicationsTable = ({
  applications,
  expandedApplications,
  toggleApplicationExpanded,
  handleStatusChange,
  isUpdatingStatus,
  onApplicationUpdate,
  openAcceptJobDialog,
  handleAcceptJob,
  isAcceptingJobLoading
}: ActiveApplicationsTableProps) => {
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  const handleOpenMessageDialog = (id: string) => {
    setSelectedApplicationId(id);
    setMessageDialogOpen(true);
  };

  const handleCloseMessageDialog = () => {
    setMessageDialogOpen(false);
    setSelectedApplicationId(null);
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedApplicationId) return Promise.resolve();

    try {
      // Get existing discourse
      const { data: application, error: fetchError } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', selectedApplicationId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const timestamp = new Date().toLocaleString();
      const newMessage = `[${timestamp}] Business: ${message}`;
      
      const updatedDiscourse = application?.task_discourse 
        ? `${application.task_discourse}\n\n${newMessage}`
        : newMessage;
        
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ task_discourse: updatedDiscourse })
        .eq('job_app_id', selectedApplicationId);
        
      if (updateError) throw updateError;
      
      toast.success("Message sent successfully");
      onApplicationUpdate();
      return Promise.resolve();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
      return Promise.reject(error);
    } finally {
      handleCloseMessageDialog();
    }
  };
  
  // Check if the user can change the status (only before acceptance)
  const canChangeStatus = (app: Application) => {
    return !app.accepted_business && !app.accepted_jobseeker;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Applicant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Skills Match</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.job_app_id} className={expandedApplications.has(app.job_app_id) ? "bg-accent/10" : ""}>
              <TableCell>{app.business_roles?.project?.title || "Unnamed Project"}</TableCell>
              <TableCell>{app.business_roles?.title || "Unnamed Task"}</TableCell>
              <TableCell>
                {app.profile?.first_name} {app.profile?.last_name}
                <div className="text-xs text-muted-foreground">{app.profile?.title}</div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {canChangeStatus(app) ? (
                    <Select 
                      value={app.status} 
                      onValueChange={(value) => handleStatusChange(app.job_app_id, value)}
                      disabled={isUpdatingStatus === app.job_app_id}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      className={`${
                        app.status === 'negotiation' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 
                        app.status === 'accepted' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                        'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  )}
                  
                  {app.task_discourse && (
                    <Badge variant="outline" className="text-xs bg-accent/20">Has messages</Badge>
                  )}
                  
                  {app.accepted_business && (
                    <Badge variant="outline" className="text-xs bg-green-100">Accepted by business</Badge>
                  )}
                  
                  {app.accepted_jobseeker && (
                    <Badge variant="outline" className="text-xs bg-green-100">Accepted by job seeker</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {typeof app.skillMatch === 'number' ? (
                  <div className="flex items-center">
                    <span className={`
                      ${app.skillMatch >= 75 ? 'text-green-600' : 
                        app.skillMatch >= 50 ? 'text-amber-600' : 
                        'text-red-600'}
                    `}>
                      {app.skillMatch}%
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleApplicationExpanded(app.job_app_id)}
                  >
                    <Expand className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenMessageDialog(app.job_app_id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  
                  {/* Show accept button for accepted status if not already accepted by business */}
                  {app.status === 'accepted' && !app.accepted_business && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openAcceptJobDialog(app)}
                      disabled={isAcceptingJobLoading}
                      title="Accept Contract"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {applications.length > 0 && [...expandedApplications].map(appId => {
        const app = applications.find(a => a.job_app_id === appId);
        if (!app) return null;
        
        return (
          <div key={appId} className="mt-4 bg-slate-50 p-4 rounded-md">
            <ExpandedApplicationContent 
              application={app} 
              onClose={() => toggleApplicationExpanded(appId)}
              onUpdate={onApplicationUpdate}
              acceptedJob={null}
            />
          </div>
        );
      })}
      
      <CreateMessageDialog
        isOpen={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        onSendMessage={handleSendMessage}
      />
    </>
  );
};
