import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";
import { TimeLogDialog } from "../TimeLogDialog";
import { useProjectsTabs } from "../projects/useProjectsTabs";
import { ProjectsHeader } from "../projects/ProjectsHeader";
import { StatisticsCards } from "../projects/StatisticsCards";
import { ProjectTabContent } from "../projects/ProjectTabContent";
import { DeleteTicketDialog } from "@/components/ticket/details/DeleteTicketDialog";
import { toast } from "sonner";
import { useNDAManagement } from "@/hooks/useNDAManagement";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { NDASignatureDialog } from "@/components/documents/NDASignatureDialog";
import { supabase } from "@/lib/supabase";

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab = ({ userId }: JobSeekerProjectsTabProps) => {
  const {
    activeTab,
    setActiveTab,
    projects,
    selectedProject,
    taskStats,
    isCreateTicketDialogOpen,
    setIsCreateTicketDialogOpen,
    showKanban,
    showGantt,
    isTimeLogDialogOpen,
    setIsTimeLogDialogOpen,
    selectedTicketId,
    expandedTickets,
    ticketToDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleTicketAction,
    confirmTicketDeletion,
    handleDeleteTicket,
    handleLogTime,
    handleTimeLogged,
    handleRefresh,
    handleProjectChange,
    handleCreateTicket,
    handleTicketCreated,
    getActiveTickets,
    toggleKanbanView,
    toggleGanttView,
    toggleTicketExpansion,
    handleDragEnd
  } = useProjectsTabs(userId);

  const { getNDAForJobApplication, isLoadingDocuments } = useNDAManagement();
  
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedJobApplication, setSelectedJobApplication] = useState<string | null>(null);
  const [ndaDocument, setNdaDocument] = useState<any | null>(null);
  const [isNdaDialogOpen, setIsNdaDialogOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);

  // Load NDA document for the selected project/ticket
  useEffect(() => {
    if (selectedTicketId) {
      loadNdaForTicket(selectedTicketId);
    }
  }, [selectedTicketId]);

  const loadNdaForTicket = async (ticketId: string) => {
    try {
      // First get the job application ID for this ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('job_app_id')
        .eq('id', ticketId)
        .single();
        
      if (ticketError || !ticket?.job_app_id) return;
      
      setSelectedJobApplication(ticket.job_app_id);
      
      // Then load the NDA document
      const document = await getNDAForJobApplication(ticket.job_app_id);
      setNdaDocument(document);
    } catch (error) {
      console.error("Error loading NDA for ticket:", error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    
    setIsDeleting(true);
    setDeleteErrorMessage(undefined);
    
    try {
      await handleDeleteTicket();
      toast.success("Ticket deleted successfully");
    } catch (error: any) {
      console.error("Error deleting ticket:", error);
      
      // Create a user-friendly error message based on the error
      let errorMessage = "Failed to delete ticket";
      if (error?.message) {
        if (error.message.includes("time entries")) {
          errorMessage = "Cannot delete ticket with time entries";
        } else if (error.message.includes("completion progress")) {
          errorMessage = "Cannot delete ticket with completion progress";
        } else if (error.message.includes("legal documents")) {
          errorMessage = "Cannot delete ticket with associated legal documents";
        } else {
          errorMessage = `${error.message}`;
        }
      }
      
      setDeleteErrorMessage(errorMessage);
      throw error; // Re-throw for the DeleteTicketDialog to handle
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewNda = () => {
    setIsNdaDialogOpen(true);
  };

  const handleSignNda = () => {
    setIsSignatureDialogOpen(true);
  };

  const handleNdaSigned = () => {
    // Refresh documents after signing
    if (selectedJobApplication) {
      getNDAForJobApplication(selectedJobApplication).then(doc => {
        setNdaDocument(doc);
      });
    }
    toast.success("NDA signed successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">My Projects</h2>
        <p className="text-muted-foreground">View and manage your project tasks</p>
      </div>

      <ProjectsHeader
        projects={projects}
        selectedProject={selectedProject}
        showKanban={showKanban}
        showGantt={showGantt}
        onProjectChange={handleProjectChange}
        onToggleKanban={toggleKanbanView}
        onToggleGantt={toggleGanttView}
        onRefresh={handleRefresh}
        onCreateTicket={handleCreateTicket}
      />

      <StatisticsCards taskStats={taskStats} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
          <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
          <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
          <TabsTrigger value="beta-testing">Beta Testing Tickets</TabsTrigger>
          <TabsTrigger value="documents">Legal Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab !== 'documents' ? activeTab : ''}>
          <ProjectTabContent
            activeTickets={getActiveTickets()}
            showKanban={showKanban}
            showGantt={showGantt}
            onRefresh={handleRefresh}
            onTicketAction={handleTicketAction}
            onLogTime={handleLogTime}
            userId={userId || ''}
            expandedTickets={expandedTickets}
            toggleTicketExpansion={toggleTicketExpansion}
            onDeleteTicket={confirmTicketDeletion}
            handleDragEnd={handleDragEnd}
          />
        </TabsContent>
        
        <TabsContent value="documents">
          <div className="space-y-4">
            {ndaDocument ? (
              <DocumentViewer 
                documentId={ndaDocument.id}
                documentType="nda"
                documentTitle="Non-Disclosure Agreement"
                documentContent={ndaDocument.content}
                documentStatus={ndaDocument.status}
                onSign={ndaDocument.status === 'final' ? handleSignNda : undefined}
              />
            ) : selectedJobApplication ? (
              <Card className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                {isLoadingDocuments ? (
                  <div className="text-center">
                    <div className="spinner h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-2"></div>
                    <p>Loading documents...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="mb-4">No legal documents found for this project.</p>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                <p className="mb-4">Select a project or ticket to view associated legal documents.</p>
                <Button variant="outline" onClick={handleRefresh}>Refresh</Button>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <CreateTicketDialog
        open={isCreateTicketDialogOpen}
        onClose={() => setIsCreateTicketDialogOpen(false)}
        onCreateTicket={handleTicketCreated}
        projects={projects}
      />

      {selectedTicketId && userId && (
        <TimeLogDialog
          open={isTimeLogDialogOpen}
          onClose={() => setIsTimeLogDialogOpen(false)}
          ticketId={selectedTicketId}
          userId={userId}
          onTimeLogged={handleTimeLogged}
        />
      )}

      {ticketToDelete && (
        <DeleteTicketDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          ticketTitle={ticketToDelete.title}
          errorMessage={deleteErrorMessage}
        />
      )}

      {selectedJobApplication && (
        <NDASignatureDialog
          open={isSignatureDialogOpen}
          onOpenChange={setIsSignatureDialogOpen}
          jobApplicationId={selectedJobApplication}
          onSigned={handleNdaSigned}
        />
      )}
    </div>
  );
};
