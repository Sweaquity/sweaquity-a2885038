
import React from 'react';
import { Ticket } from '@/types/types';
import { Pagination } from "@/components/ui/pagination";
import { useTicketDashboard } from './hooks/useTicketDashboard';
import { TicketFilters } from './filters/TicketFilters';
import { EmptyTicketState } from './empty/EmptyTicketState';
import { TicketTable } from './table/TicketTable';
import { TicketDetailDialog } from './dialogs/TicketDetailDialog';
import { DeleteTicketDialog } from './dialogs/DeleteTicketDialog';

interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  userId: string;
  onLogTime?: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  expandedTickets: Set<string>;
  toggleTicketExpansion: (ticketId: string) => void;
  userCanEditDates?: boolean;
  userCanEditStatus?: boolean;
  loading?: boolean;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  showTimeTracking = false,
  userId,
  onLogTime,
  renderTicketActions,
  expandedTickets = new Set<string>(),
  toggleTicketExpansion = () => {},
  userCanEditDates = false,
  userCanEditStatus = false,
  loading = false
}) => {
  const {
    tickets,
    setTickets,
    displayedTickets,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    typeFilter,
    setTypeFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    selectedTicket,
    isDialogOpen,
    openTicketDetails,
    closeTicketDetails,
    ticketToDelete,
    isDeleteDialogOpen,
    showDeleteConfirmation,
    cancelDelete
  } = useTicketDashboard(initialTickets);

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    await onTicketAction(ticketId, "updateStatus", status);
    setTickets(
      tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status } : ticket
      )
    );
  };

  const handleUpdatePriority = async (ticketId: string, priority: string) => {
    await onTicketAction(ticketId, "updatePriority", priority);
    setTickets(
      tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, priority } : ticket
      )
    );
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    
    try {
      await onTicketAction(ticketToDelete.id, "deleteTicket", null);
      setTickets(tickets.filter(ticket => ticket.id !== ticketToDelete.id));
      cancelDelete();
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    if (action === 'deleteTicket') {
      await onTicketAction(ticketId, action, data);
      setTickets(tickets.filter(ticket => ticket.id !== ticketId));
      closeTicketDetails();
      return;
    }
    
    await onTicketAction(ticketId, action, data);
    
    // Refresh the specific ticket data
    const updatedTicket = tickets.find(t => t.id === ticketId);
    if (updatedTicket && action === 'updateStatus') {
      updatedTicket.status = data;
    } else if (updatedTicket && action === 'updatePriority') {
      updatedTicket.priority = data;
    } else if (updatedTicket && action === 'updateCompletionPercentage') {
      updatedTicket.completion_percentage = data;
    } else if (updatedTicket && action === 'updateEstimatedHours') {
      updatedTicket.estimated_hours = data;
    } else if (updatedTicket && action === 'updateDueDate') {
      updatedTicket.due_date = data;
    }
    
    setTickets([...tickets]);
  };

  return (
    <div className="space-y-4">
      <TicketFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        typeFilter={typeFilter}
        setSearchTerm={setSearchTerm}
        setStatusFilter={setStatusFilter}
        setPriorityFilter={setPriorityFilter}
        setTypeFilter={setTypeFilter}
        onRefresh={onRefresh}
      />

      {displayedTickets.length === 0 ? (
        <EmptyTicketState />
      ) : (
        <>
          <TicketTable
            tickets={displayedTickets}
            showTimeTracking={showTimeTracking}
            userCanEditStatus={userCanEditStatus}
            openTicketDetails={openTicketDetails}
            handleUpdateStatus={handleUpdateStatus}
            handleUpdatePriority={handleUpdatePriority}
            showDeleteConfirmation={showDeleteConfirmation}
            onLogTime={onLogTime}
            renderTicketActions={renderTicketActions}
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      <TicketDetailDialog
        isOpen={isDialogOpen}
        selectedTicket={selectedTicket}
        onClose={closeTicketDetails}
        onTicketAction={handleTicketAction}
        onLogTime={onLogTime}
        showTimeTracking={showTimeTracking}
        userCanEditStatus={userCanEditStatus}
        userCanEditDates={userCanEditDates}
      />

      <DeleteTicketDialog
        isOpen={isDeleteDialogOpen}
        ticketToDelete={ticketToDelete}
        onCancel={cancelDelete}
        onConfirm={handleDeleteTicket}
      />
    </div>
  );
};
