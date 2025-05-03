
import React, { useState } from 'react';
import { Ticket } from '@/types/types';
import { Pagination } from "@/components/ui/pagination";
import { useTicketDashboard } from './hooks/useTicketDashboard';
import { TicketFilters } from './filters/TicketFilters';
import { EmptyTicketState } from './empty/EmptyTicketState';
import { TicketTable } from './table/TicketTable';
import { TicketDetailDialog } from './dialogs/TicketDetailDialog';
import { DeleteTicketDialog } from './dialogs/DeleteTicketDialog';
import { toast } from "sonner"; // Replace custom Toast with sonner

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
    try {
      await onTicketAction(ticketId, "updateStatus", status);
      setTickets(
        tickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status } : ticket
        )
      );
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleUpdatePriority = async (ticketId: string, priority: string) => {
    try {
      await onTicketAction(ticketId, "updatePriority", priority);
      setTickets(
        tickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, priority } : ticket
        )
      );
      toast.success("Priority updated successfully");
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Failed to update priority");
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    
    try {
      // Instead of just updating UI state, we need to ensure the DB operation completes
      await onTicketAction(ticketToDelete.id, "deleteTicket", null);
      
      // Only update local state after confirming successful DB operation
      setTickets(tickets.filter(ticket => ticket.id !== ticketToDelete.id));
      toast.success("Ticket deleted successfully");
      cancelDelete();
      
      // Optionally refresh to ensure UI is in sync with DB
      // onRefresh();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Failed to delete ticket");
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      // Perform the DB operation first
      await onTicketAction(ticketId, action, data);
      
      // Then update the UI based on the action
      if (action === 'deleteTicket') {
        setTickets(tickets.filter(ticket => ticket.id !== ticketId));
        closeTicketDetails();
        toast.success("Ticket deleted successfully");
        return;
      }
      
      // For all other actions, update the local ticket state
      const ticketIndex = tickets.findIndex(t => t.id === ticketId);
      if (ticketIndex !== -1) {
        const updatedTickets = [...tickets];
        
        switch (action) {
          case 'updateStatus':
            updatedTickets[ticketIndex] = { ...updatedTickets[ticketIndex], status: data };
            break;
          case 'updatePriority':
            updatedTickets[ticketIndex] = { ...updatedTickets[ticketIndex], priority: data };
            break;
          case 'updateCompletionPercentage':
            updatedTickets[ticketIndex] = { ...updatedTickets[ticketIndex], completion_percentage: data };
            break;
          case 'updateEstimatedHours':
            updatedTickets[ticketIndex] = { ...updatedTickets[ticketIndex], estimated_hours: data };
            break;
          case 'updateDueDate':
            updatedTickets[ticketIndex] = { ...updatedTickets[ticketIndex], due_date: data };
            break;
          default:
            break;
        }
        
        setTickets(updatedTickets);
        toast.success(`${action.replace('update', '').charAt(0).toUpperCase() + action.replace('update', '').slice(1).toLowerCase()} updated successfully`);
      }
    } catch (error) {
      console.error(`Error with ticket action ${action}:`, error);
      toast.error(`Failed to ${action.replace('update', '').toLowerCase()} ticket`);
    }
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
