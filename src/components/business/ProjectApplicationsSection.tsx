
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash, Copy, Eye, User, UserX, Mail, MessageSquare, CheckCircle, Ban, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { JobApplication } from "@/types/jobSeeker";
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useBusinessContext } from './BusinessContext';
import { Link } from 'react-router-dom';

interface ProjectApplicationsSectionProps {
  projectId?: string;
}

interface ApplicationStatusCounts {
  negotiation: number;
  accepted: number;
  withdrawn: number;
}

const statusColors: { [key: string]: string } = {
  negotiation: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  withdrawn: "bg-red-100 text-red-800",
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

export const ProjectApplicationsSection = ({ projectId }: ProjectApplicationsSectionProps) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [applicationStatusCounts, setApplicationStatusCounts] = useState<ApplicationStatusCounts>({
    negotiation: 0,
    accepted: 0,
    withdrawn: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isAnonymizationInfoDialogOpen, setIsAnonymizationInfoDialogOpen] = useState(false);
  const { business } = useBusinessContext();

  useEffect(() => {
    if (projectId) {
      fetchApplications();
    } else {
      fetchAllApplications();
    }
  }, [projectId]);

  const fetchAllApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: projectsData, error: projectsError } = await supabase
        .from('business_projects')
        .select('project_id')
        .eq('business_id', session.user.id);

      if (projectsError) throw projectsError;
      
      if (!projectsData || projectsData.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const projectIds = projectsData.map((p: any) => p.project_id);

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          business_roles (
            title,
            description,
            company_name,
            project_title,
            task_status,
            timeframe,
            equity_allocation,
            skill_requirements
          )
        `)
        .in('project_id', projectIds);

      if (error) throw error;

      setApplications(data || []);
      updateStatusCounts(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch applications");
      toast.error(err.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          business_roles (
            title,
            description,
            company_name,
            project_title,
            task_status,
            timeframe,
            equity_allocation,
            skill_requirements
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      setApplications(data || []);
      updateStatusCounts(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch applications");
      toast.error(err.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const updateStatusCounts = (apps: JobApplication[]) => {
    const counts: ApplicationStatusCounts = {
      negotiation: 0,
      accepted: 0,
      withdrawn: 0,
    };

    apps.forEach(app => {
      switch (app.status) {
        case 'negotiation':
          counts.negotiation++;
          break;
        case 'accepted':
          counts.accepted++;
          break;
        case 'withdrawn':
          counts.withdrawn++;
          break;
        default:
          break;
      }
    });

    setApplicationStatusCounts(counts);
  };

  const handleOpenNotesDialog = (application: JobApplication) => {
    setSelectedApplication(application);
    setNotes(application.notes || '');
    setIsNotesDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedApplication) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ notes: notes })
        .eq('job_app_id', selectedApplication.job_app_id);

      if (error) throw error;

      toast.success("Notes saved successfully");
      if (projectId) {
        fetchApplications();
      } else {
        fetchAllApplications();
      }
    } catch (error: any) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsNotesDialogOpen(false);
    }
  };

  const handleStatusChange = (application: JobApplication, status: string) => {
    setSelectedApplication(application);
    setSelectedStatus(status);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedApplication) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: selectedStatus })
        .eq('job_app_id', selectedApplication.job_app_id);

      if (error) throw error;

      toast.success("Application status updated successfully");
      if (projectId) {
        fetchApplications();
      } else {
        fetchAllApplications();
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update application status");
    } finally {
      setIsStatusDialogOpen(false);
    }
  };

  const handleWithdrawApplication = (application: JobApplication) => {
    setSelectedApplication(application);
    setIsWithdrawDialogOpen(true);
  };

  const confirmWithdrawApplication = async () => {
    if (!selectedApplication) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn', notes: withdrawReason })
        .eq('job_app_id', selectedApplication.job_app_id);

      if (error) throw error;

      toast.success("Application withdrawn successfully");
      if (projectId) {
        fetchApplications();
      } else {
        fetchAllApplications();
      }
    } catch (error: any) {
      console.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application");
    } finally {
      setIsWithdrawDialogOpen(false);
    }
  };

  const toggleAnonymization = async (application: JobApplication) => {
    const currentState = application.applicant_anonymized || false;
    
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          applicant_anonymized: !currentState 
        })
        .eq('job_app_id', application.job_app_id);

      if (error) throw error;
      
      toast.success(`Applicant ${currentState ? 'de-anonymized' : 'anonymized'} successfully`);
      if (projectId) {
        fetchApplications();
      } else {
        fetchAllApplications();
      }
    } catch (error) {
      console.error('Error toggling anonymization:', error);
      toast.error("Failed to update anonymization status");
    }
  };

  if (loading) return <div>Loading applications...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Applications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Badge className={statusColors.negotiation}>Negotiation: {applicationStatusCounts.negotiation}</Badge>
          <Badge className={statusColors.accepted}>Accepted: {applicationStatusCounts.accepted}</Badge>
          <Badge className={statusColors.withdrawn}>Withdrawn: {applicationStatusCounts.withdrawn}</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Applied At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.job_app_id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Avatar>
                      {application.applicant_anonymized ? (
                        <AvatarFallback><UserX className="h-4 w-4" /></AvatarFallback>
                      ) : (
                        <>
                          <AvatarImage src={`https://avatar.vercel.sh/${application.applicant_email}.png`} alt={application.applicant_email || 'User'} />
                          <AvatarFallback>{(application.applicant_email || 'U')[0].toUpperCase()}</AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <span>
                      {application.applicant_anonymized ? "Anonymized" : application.applicant_email || application.user_id}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{application.business_roles?.title}</TableCell>
                <TableCell>{formatDate(application.applied_at)}</TableCell>
                <TableCell>
                  <Badge className={statusColors[application.status] || ""}>{application.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleOpenNotesDialog(application)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Notes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(application, 'negotiation')}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Mark as Negotiation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(application, 'accepted')}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Accepted
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleWithdrawApplication(application)}>
                        <Ban className="mr-2 h-4 w-4" />
                        Withdraw Application
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleAnonymization(application)}>
                        {application.applicant_anonymized ? (
                          <>
                            <User className="mr-2 h-4 w-4" />
                            De-anonymize Applicant
                          </>
                        ) : (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            Anonymize Applicant
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsAnonymizationInfoDialogOpen(true)}>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Anonymization Info
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={() => setIsNotesDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
            <DialogDescription>
              Add or edit notes for this application.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={() => setIsStatusDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the application status to {selectedStatus}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Application Confirmation Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={() => setIsWithdrawDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw this application? Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="withdrawReason" className="text-right">
                Reason
              </Label>
              <Textarea id="withdrawReason" value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmWithdrawApplication}>Confirm Withdraw</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Anonymization Info Dialog */}
      <Dialog open={isAnonymizationInfoDialogOpen} onOpenChange={() => setIsAnonymizationInfoDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anonymization Information</DialogTitle>
            <DialogDescription>
              Anonymizing an applicant will hide their email address. This is useful for keeping the hiring process unbiased.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAnonymizationInfoDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
