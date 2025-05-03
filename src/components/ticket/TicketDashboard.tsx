import React, { useState } from 'react';
import { Ticket } from '@/types/types';
import { Pagination } from "@/components/ui/pagination";
import { useTicketDashboard } from './hooks/useTicketDashboard';
import { TicketFilters } from './filters/TicketFilters';
import { EmptyTicketState } from './empty/EmptyTicketState';
import { TicketTable } from './table/TicketTable';
import { TicketDetailDialog } from './dialogs/TicketDetailDialog';
import { DeleteTicketDialog } from './dialogs/DeleteTicketDialog';
import { toast } from "sonner";

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
  const [isDeleting, setIsDeleting] = useState(false);
  
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
    if (!ticketToDelete || isDeleting) return;
    
    setIsDeleting(true);
    try {
      // Call the onTicketAction function which should connect to TicketService.deleteTicket
      await onTicketAction(ticketToDelete.id, "deleteTicket", userId);
      
      // Only update local state after confirming successful DB operation
      setTickets(tickets.filter(ticket => ticket.id !== ticketToDelete.id));
      toast.success("Ticket deleted successfully");
      cancelDelete();
      
      // Refresh to ensure UI is in sync with DB
      onRefresh();
    } catch (error: any) {
      console.error("Error deleting ticket:", error);
      
      // Show the specific error message from the backend if available
      if (error.message) {
        toast.error(error.message);
      } else if (error.code === 'P0001' && error.message?.includes('time entries')) {
        toast.error("Cannot delete ticket with time entries");
      } else if (error.code === 'P0001' && error.message?.includes('completion progress')) {
        toast.error("Cannot delete ticket with completion progress");
      } else {
        toast.error("Failed to delete ticket");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      if (action === 'deleteTicket') {
        // Special handling for deletion
        try {
          // Pass the userId to the deleteTicket function
          await onTicketAction(ticketId, action, userId);
          setTickets(tickets.filter(ticket => ticket.id !== ticketId));
          closeTicketDetails();
          toast.success("Ticket deleted successfully");
        } catch (error: any) {
          console.error("Error deleting ticket:", error);
          // Show specific error message
          if (error.message) {
            toast.error(error.message);
          } else if (error.code === 'P0001') {
            const msg = error.message || "Cannot delete this ticket";
            toast.error(msg);
          } else {
            toast.error("Failed to delete ticket");
          }
          throw error; // Re-throw to prevent further processing
        }
        return;
      }
      
      // For all other actions
      await onTicketAction(ticketId, action, data);
      
      // Update the local ticket state
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
        const actionName = action.replace('update', '');
        const formattedAction = actionName.charAt(0).toUpperCase() + actionName.slice(1).toLowerCase();
        toast.success(`${formattedAction} updated successfully`);
      }
    } catch (error: any) {
      // Only show error if it wasn't already handled in the deleteTicket block
      if (action !== 'deleteTicket') {
        console.error(`Error with ticket action ${action}:`, error);
        toast.error(`Failed to ${action.replace('update', '').toLowerCase()} ticket`);
      }
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
        isDeleting={isDeleting}
      />
    </div>
  );
};
