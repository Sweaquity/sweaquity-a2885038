
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Application } from "@/types/business";

// Import application card components
import { ApplicationCard } from './applications/ApplicationCard';
import { AcceptJobDialog } from './applications/AcceptJobDialog';
import { RejectApplicationDialog } from './applications/RejectApplicationDialog';
import { ExpandedApplicationContent } from './applications/ExpandedApplicationContent';
import { PendingApplicationsTable } from './applications/tables/PendingApplicationsTable';
import { ActiveApplicationsTable } from './applications/tables/ActiveApplicationsTable';
import { RejectedApplicationsTable } from './applications/tables/RejectedApplicationsTable';
import { WithdrawnApplicationsTable } from './applications/tables/WithdrawnApplicationsTable';

// Import contract components
import { ContractUploadDialog } from './applications/ContractUploadDialog';
import { ContractActionsSection } from './applications/ContractActionsSection';

export const ProjectApplicationsSection = ({ projectId }: { projectId: string }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [showEditNotesDialog, setShowEditNotesDialog] = useState<boolean>(false);
  const [applicationNotes, setApplicationNotes] = useState<string>("");
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState<boolean>(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState<boolean>(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Filter applications by status for each tab
  const pendingApplications = applications.filter(app => app.status === 'pending');
  const activeApplications = applications.filter(app => app.status === 'accepted');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');
  const withdrawnApplications = applications.filter(app => app.status === 'withdrawn');

  useEffect(() => {
    if (projectId) {
      loadApplications(projectId);
    }
  }, [projectId]);

  const loadApplications = async (projectId: string) => {
    try {
      setIsLoading(true);
      
      // Use the modified function to get applications with proper relationships
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          profiles:user_id(first_name, last_name, email, title, location, cv_url, skills, employment_preference),
          project_sub_tasks:task_id(title, description, skill_requirements, equity_allocation, timeframe)
        `)
        .eq('project_id', projectId)
        .order('applied_at', { ascending: false });

      if (error) {
        console.error("Error loading applications:", error);
        toast.error("Failed to load applications");
        return;
      }
      
      // Process the data to add any missing fields and ensure consistent structure
      const processedData = data.map((app: any) => ({
        ...app,
        job_app_id: app.id || app.job_app_id, // Ensure job_app_id is set
        applicant_anonymized: app.applicant_anonymized || false,
        applicant_email: app.profiles?.email || '',
        notes: app.notes || '',
        profile: app.profiles || {},
        business_roles: app.project_sub_tasks || {}
      })) as Application[];
      
      setApplications(processedData);
      
      if (!isInitialized && processedData.length > 0) {
        setSelectedApplication(processedData[0]);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error in loadApplications:", error);
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update application status
  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status, 
          processed_at: new Date().toISOString() 
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      setApplications(prevApps => 
        prevApps.map(app => 
          app.job_app_id === applicationId ? { ...app, status, processed_at: new Date().toISOString() } : app
        )
      );

      // Update selected application if needed
      if (selectedApplication && selectedApplication.job_app_id === applicationId) {
        setSelectedApplication(prev => prev ? { ...prev, status, processed_at: new Date().toISOString() } : null);
      }

      toast.success(`Application ${status}`);
    } catch (error) {
      console.error(`Error updating application to ${status}:`, error);
      toast.error(`Failed to update application`);
    }
  };

  // Function to update application notes
  const updateApplicationNotes = async () => {
    if (!selectedApplication) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ notes: applicationNotes })
        .eq('id', selectedApplication.job_app_id);

      if (error) throw error;

      // Update local state
      setApplications(prevApps => 
        prevApps.map(app => 
          app.job_app_id === selectedApplication.job_app_id ? { ...app, notes: applicationNotes } : app
        )
      );

      // Update selected application
      setSelectedApplication(prev => prev ? { ...prev, notes: applicationNotes } : null);

      setShowEditNotesDialog(false);
      toast.success("Notes updated");
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
    }
  };

  // Function to toggle anonymization
  const toggleAnonymization = async (applicationId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ applicant_anonymized: !currentState })
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      setApplications(prevApps => 
        prevApps.map(app => 
          app.job_app_id === applicationId ? { ...app, applicant_anonymized: !currentState } : app
        )
      );

      // Update selected application if needed
      if (selectedApplication && selectedApplication.job_app_id === applicationId) {
        setSelectedApplication(prev => prev ? { ...prev, applicant_anonymized: !currentState } : null);
      }

      toast.success(`Applicant ${!currentState ? 'anonymized' : 'de-anonymized'}`);
    } catch (error) {
      console.error("Error toggling anonymization:", error);
      toast.error("Failed to update anonymization status");
    }
  };

  // Handler for opening notes dialog
  const handleEditNotes = () => {
    if (selectedApplication) {
      setApplicationNotes(selectedApplication.notes || "");
      setShowEditNotesDialog(true);
    }
  };

  // Handler for selecting an application
  const handleSelectApplication = (application: Application) => {
    setSelectedApplication(application);
  };

  // Handlers for dialog states
  const handleAcceptDialogChange = (open: boolean) => {
    setIsAcceptDialogOpen(open);
  };

  const handleRejectDialogChange = (open: boolean) => {
    setIsRejectDialogOpen(open);
  };

  const handleContractDialogChange = (open: boolean) => {
    setIsContractDialogOpen(open);
  };

  // Handler for contract upload
  const handleContractUploaded = (contractUrl: string) => {
    if (!selectedApplication) return;
    
    // Update local state with new contract URL
    setApplications(prevApps => 
      prevApps.map(app => 
        app.job_app_id === selectedApplication.job_app_id ? { ...app, contract_url: contractUrl, contract_status: 'pending_signature' } : app
      )
    );
    
    // Update selected application
    setSelectedApplication(prev => prev ? { 
      ...prev, 
      contract_url: contractUrl, 
      contract_status: 'pending_signature' 
    } : null);
  };

  // Application action handlers
  const handleAcceptApplication = async (data: { message: string }) => {
    if (!selectedApplication) return;
    
    try {
      // Update application status to accepted
      await updateApplicationStatus(selectedApplication.job_app_id, 'accepted');
      
      // Send notification to applicant (would be implemented with a serverless function)
      console.log(`Sending acceptance message to ${selectedApplication.applicant_anonymized ? 'anonymized applicant' : selectedApplication.applicant_email}:`, data.message);
    } catch (error) {
      console.error("Error accepting application:", error);
      toast.error("Failed to accept application");
    }
  };

  const handleRejectApplication = async (data: { reason: string, message: string }) => {
    if (!selectedApplication) return;
    
    try {
      // Update application status to rejected
      await updateApplicationStatus(selectedApplication.job_app_id, 'rejected');
      
      // Send notification to applicant (would be implemented with a serverless function)
      console.log(`Sending rejection message to ${selectedApplication.applicant_anonymized ? 'anonymized applicant' : selectedApplication.applicant_email}:`, data.message);
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeApplications.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedApplications.length})
            </TabsTrigger>
            <TabsTrigger value="withdrawn">
              Withdrawn ({withdrawnApplications.length})
            </TabsTrigger>
          </TabsList>

          <div className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-5 space-y-4">
              <TabsContent value="pending" className="m-0">
                <PendingApplicationsTable 
                  applications={pendingApplications} 
                  onSelect={handleSelectApplication}
                  selectedId={selectedApplication?.job_app_id}
                  isLoading={isLoading}
                />
              </TabsContent>
              
              <TabsContent value="active" className="m-0">
                <ActiveApplicationsTable 
                  applications={activeApplications} 
                  onSelect={handleSelectApplication}
                  selectedId={selectedApplication?.job_app_id}
                  isLoading={isLoading}
                />
              </TabsContent>
              
              <TabsContent value="rejected" className="m-0">
                <RejectedApplicationsTable 
                  applications={rejectedApplications} 
                  onSelect={handleSelectApplication}
                  selectedId={selectedApplication?.job_app_id}
                  isLoading={isLoading}
                />
              </TabsContent>
              
              <TabsContent value="withdrawn" className="m-0">
                <WithdrawnApplicationsTable 
                  applications={withdrawnApplications} 
                  onSelect={handleSelectApplication}
                  selectedId={selectedApplication?.job_app_id}
                  isLoading={isLoading}
                />
              </TabsContent>
            </div>
            
            <div className="md:col-span-7">
              {selectedApplication ? (
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Application Details
                    </h3>
                    <div className="space-x-2">
                      {/* Notes button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleEditNotes}
                      >
                        Edit Notes
                      </Button>
                      
                      {/* Anonymize toggle button */}
                      <Button
                        variant={selectedApplication.applicant_anonymized ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAnonymization(selectedApplication.job_app_id, selectedApplication.applicant_anonymized || false)}
                      >
                        {selectedApplication.applicant_anonymized ? "De-anonymize" : "Anonymize"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Expanded content of the selected application */}
                  <ExpandedApplicationContent 
                    application={selectedApplication} 
                  />
                  
                  {/* Action buttons based on application status */}
                  {selectedApplication.status === 'pending' && (
                    <div className="flex justify-end space-x-3 mt-4">
                      <Dialog open={isRejectDialogOpen} onOpenChange={handleRejectDialogChange}>
                        <DialogTrigger asChild>
                          <Button variant="destructive">
                            Reject
                          </Button>
                        </DialogTrigger>
                        
                        <RejectApplicationDialog 
                          onReject={handleRejectApplication} 
                          onOpenChange={handleRejectDialogChange}
                        />
                      </Dialog>
                      
                      <Dialog open={isAcceptDialogOpen} onOpenChange={handleAcceptDialogChange}>
                        <DialogTrigger asChild>
                          <Button>
                            Accept
                          </Button>
                        </DialogTrigger>
                        
                        <AcceptJobDialog 
                          onAccept={handleAcceptApplication}
                          onOpenChange={handleAcceptDialogChange}
                        />
                      </Dialog>
                    </div>
                  )}
                  
                  {/* Contract actions for accepted applications */}
                  {selectedApplication.status === 'accepted' && (
                    <ContractActionsSection
                      application={selectedApplication}
                      onContractDialogChange={handleContractDialogChange}
                      isContractDialogOpen={isContractDialogOpen}
                      onContractUploaded={handleContractUploaded}
                    />
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border rounded-lg p-8 text-center">
                  <p className="text-gray-500">Select an application to view details</p>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </CardContent>
      
      {/* Notes editing dialog */}
      <Dialog open={showEditNotesDialog} onOpenChange={setShowEditNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Notes</DialogTitle>
            <DialogDescription>
              Add or edit notes about this applicant for internal reference.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            value={applicationNotes}
            onChange={(e) => setApplicationNotes(e.target.value)}
            rows={6}
            placeholder="Enter notes about this applicant..."
            className="w-full"
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditNotesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateApplicationNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
