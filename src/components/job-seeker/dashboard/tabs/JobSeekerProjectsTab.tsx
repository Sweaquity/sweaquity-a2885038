
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";
import { TimeLogDialog } from "../TimeLogDialog";
import { useProjectsTabs } from "../projects/useProjectsTabs";
import { ProjectsHeader } from "../projects/ProjectsHeader";
import { StatisticsCards } from "../projects/StatisticsCards";
import { ProjectTabContent } from "../projects/ProjectTabContent";
import { DeleteTicketDialog } from "@/components/ticket/details/DeleteTicketDialog";

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
        </TabsList>
        
        <TabsContent value={activeTab}>
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
          onConfirm={handleDeleteTicket}
          isDeleting={false}
          ticketTitle={ticketToDelete.title}
          errorMessage={undefined}
        />
      )}
    </div>
  );
};
