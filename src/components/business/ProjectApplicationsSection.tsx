import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CheckCircle, Loader2, MessageCircle, UserCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Application } from "@/types/business";
import { ExpandedApplicationContent } from "./applications/ExpandedApplicationContent";
import { useAcceptedJobs } from "@/hooks/useAcceptedJobs";
import { CreateMessageDialog } from "@/components/job-seeker/dashboard/applications/CreateMessageDialog";

const ITEMS_PER_PAGE = 5;

export const ProjectApplicationsSection = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedApplicationForMessage, setSelectedApplicationForMessage] = useState<Application | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);
  
  const { acceptJobAsBusiness, isLoading: isAccepting, isUploading, uploadContract } = useAcceptedJobs();

  useEffect(() => {
    fetchApplications();
  }, [currentPage, filterStatus, sortOrder, searchTerm, forceRefresh]);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: applicationsData, error: applicationsError, count } = await supabase
        .from('job_applications')
        .select('*, business_roles (equity_allocation)', { count: 'exact' })
        .eq('business_id', supabase.auth.currentUser?.id)
        .ilike('job_title', `%${searchTerm}%`)
        .eq('status', filterStatus)
        .order('applied_at', { ascending: sortOrder === 'asc' })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError);
        throw new Error(`Failed to fetch applications: ${applicationsError.message}`);
      }

      if (!applicationsData) {
        throw new Error("No applications found");
      }
      
      setApplications(applicationsData);
      setTotalApplications(count || 0);
      setTotalPages(Math.ceil(totalApplications / ITEMS_PER_PAGE));
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTotalPages(Math.ceil(totalApplications / ITEMS_PER_PAGE));
  }, [totalApplications]);

  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedApplication(null);
  };

  const handleAccept = async (application: Application) => {
    setAcceptingId(application.job_app_id);
    try {
      await acceptJobAsBusiness(application);
      toast.success("Application accepted successfully");
      setForceRefresh(prev => prev + 1);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (application: Application) => {
    setRejectingId(application.job_app_id);
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'rejected' })
        .eq('job_app_id', application.job_app_id);

      if (error) {
        console.error("Error rejecting application:", error);
        throw new Error("Failed to reject application");
      }

      toast.success("Application rejected successfully");
      setForceRefresh(prev => prev + 1);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRejectingId(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleStatusFilterChange = (status: string) => {
    setCurrentPage(1);
    setFilterStatus(status);
  };

  const handleSortOrderChange = () => {
    setCurrentPage(1);
    setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSendMessageClick = (application: Application) => {
    setSelectedApplicationForMessage(application);
    setIsMessageDialogOpen(true);
  };
  
  const handleMessageDialogClose = () => {
    setIsMessageDialogOpen(false);
    setSelectedApplicationForMessage(null);
  };
  
  const handleMessageSent = () => {
    setForceRefresh(prev => prev + 1);
  };

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Applications</CardTitle>
        <CardDescription>
          Manage applications for your projects.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center space-x-4">
          <Input
            type="text"
            placeholder="Search by job title..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="max-w-sm"
          />
          <Select value={filterStatus} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleSortOrderChange}>
            Sort by Date ({sortOrder === 'asc' ? 'Asc' : 'Desc'})
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading applications...
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : applications.length === 0 ? (
          <div className="text-muted-foreground italic">No applications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead className="hidden md:table-cell">Applicant</TableHead>
                  <TableHead>Applied At</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.job_app_id}>
                    <TableCell className="font-medium">{application.job_title}</TableCell>
                    <TableCell className="hidden md:table-cell">{application.jobseeker_id}</TableCell>
                    <TableCell>
                      {new Date(application.applied_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">{application.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplicationClick(application)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendMessageClick(application)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Total: {totalApplications} Applications
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={isFirstPage}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={isLastPage}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              View and manage the application details.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <ExpandedApplicationContent
              application={selectedApplication}
              onClose={handleCloseDialog}
              onUpdate={() => setForceRefresh(prev => prev + 1)}
            />
          )}
          <DialogFooter>
            {selectedApplication && selectedApplication.status === 'pending' && (
              <div className="flex justify-end space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => handleReject(selectedApplication)}
                  disabled={rejectingId === selectedApplication.job_app_id}
                >
                  {rejectingId === selectedApplication.job_app_id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    "Reject"
                  )}
                </Button>
                
                {/* When sending the Boolean parameter, ensure it's a boolean value: */}
                {/* const isAcceptingApplication = application.job_app_id === acceptingId; */}
                
                <Button
                  onClick={() => handleAccept(selectedApplication)}
                  disabled={acceptingId === selectedApplication.job_app_id}
                >
                  {acceptingId === selectedApplication.job_app_id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    "Accept"
                  )}
                </Button>
              </div>
            )}
            <Button variant="ghost" onClick={handleCloseDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <CreateMessageDialog
        isOpen={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        applicationId={selectedApplicationForMessage?.job_app_id}
        onMessageSent={handleMessageSent}
      />
    </Card>
  );
};
