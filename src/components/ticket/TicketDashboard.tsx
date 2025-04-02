import React, { useState, useEffect } from "react";
import { TicketList } from "./TicketList";
import { FilterBar } from "./FilterBar";
import TicketStats from "./TicketStats";
import { Ticket } from "@/types/types";
import { ExpandedTicketDetails } from "./ExpandedTicketDetails";
import { ReplyDialog } from "./ReplyDialog";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "./KanbanBoard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  userId?: string;
  onLogTime?: (ticketId: string) => void;
  userCanEditDates?: boolean;
  userCanEditStatus?: boolean;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  expandedTickets?: Set<string> | Record<string, boolean>;
  toggleTicketExpansion?: (ticketId: string) => void;
  projectId?: string;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  showTimeTracking = false,
  userId,
  onLogTime,
  userCanEditDates = false,
  userCanEditStatus = false,
  renderTicketActions,
  expandedTickets = new Set<string>(),
  toggleTicketExpansion = () => {},
  projectId
}) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [isKanbanView, setIsKanbanView] = useState(false);
  const [filterParams, setFilterParams] = useState({
    status: "all",
    priority: "all",
    assigned: "all"
  });

  useEffect(() => {
    setTickets(initialTickets);
    setFilteredTickets(initialTickets);
  }, [initialTickets]);

  const handleFilterChange = (newFilterParams: any) => {
    setFilterParams(newFilterParams);
    
    let result = [...tickets];
    
    if (newFilterParams.status !== "all") {
      result = result.filter(ticket => ticket.status === newFilterParams.status);
    }
    
    if (newFilterParams.priority !== "all") {
      result = result.filter(ticket => ticket.priority === newFilterParams.priority);
    }
    
    if (newFilterParams.assigned === "mine" && userId) {
      result = result.filter(ticket => ticket.assigned_to === userId);
    } else if (newFilterParams.assigned === "unassigned") {
      result = result.filter(ticket => !ticket.assigned_to);
    }
    
    setFilteredTickets(result);
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseTicket = () => {
    setSelectedTicket(null);
  };

  const handleReply = async (message: string) => {
    if (selectedTicket && onTicketAction) {
      await onTicketAction(selectedTicket.id, 'reply', { message });
      setReplyDialogOpen(false);
      onRefresh?.();
    }
  };

  const handleTicketActionWithRefresh = async (ticketId: string, action: string, data: any) => {
    if (onTicketAction) {
      if (action === 'reply') {
        setReplyDialogOpen(true);
        return;
      }
      
      await onTicketAction(ticketId, action, data);
      onRefresh?.();
      
      // If the action was on the currently selected ticket, refresh it
      if (selectedTicket && selectedTicket.id === ticketId) {
        const updatedTicket = tickets.find(t => t.id === ticketId);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      }
    }
  };

  const toggleKanbanView = () => {
    setIsKanbanView(!isKanbanView);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:space-y-0">
        <div className="flex-1">
          <FilterBar 
            onFilterChange={handleFilterChange} 
            statusFilter={filterParams.status}
            priorityFilter={filterParams.priority}
            onClearFilters={() => handleFilterChange({
              status: "all",
              priority: "all",
              assigned: "all"
            })}
            onToggleView={toggleKanbanView}
            isKanbanView={isKanbanView}
          />
        </div>
        <div className="flex space-x-2">
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              Refresh
            </Button>
          )}
        </div>
      </div>
      
      <TicketStats 
        total={tickets.length}
        open={tickets.filter(t => t.status === 'todo' || t.status === 'backlog').length}
        inProgress={tickets.filter(t => t.status === 'in_progress').length}
        completed={tickets.filter(t => t.status === 'done' || t.status === 'closed').length}
        highPriority={tickets.filter(t => t.priority === 'high').length}
      />
      
      {isKanbanView ? (
        <div className="mb-6">
          <KanbanBoard 
            projectId={projectId}
            tickets={tickets}
            onTicketClick={onTicketClick}
            onTicketAction={onTicketAction}
            showTimeTracking={showTimeTracking}
            onLogTime={onLogTime}
            renderTicketActions={renderTicketActions}
            expandedTickets={expandedTickets}
            toggleTicketExpansion={toggleTicketExpansion}
          />
        </div>
      ) : (
        <TicketList 
          tickets={filteredTickets} 
          onTicketClick={handleTicketClick}
          onTicketAction={handleTicketActionWithRefresh}
          showTimeTracking={showTimeTracking}
          onLogTime={onLogTime}
          renderTicketActions={renderTicketActions}
          expandedTickets={expandedTickets}
          toggleTicketExpansion={toggleTicketExpansion}
        />
      )}
      
      {selectedTicket && (
        <ExpandedTicketDetails 
          ticket={selectedTicket}
          onClose={handleCloseTicket}
          onTicketAction={handleTicketActionWithRefresh}
          onLogTime={onLogTime ? () => onLogTime(selectedTicket.id) : undefined}
          userCanEditStatus={userCanEditStatus}
          userCanEditDates={userCanEditDates}
        />
      )}
      
      <ReplyDialog 
        isOpen={replyDialogOpen} 
        onOpenChange={setReplyDialogOpen}
        onSendReply={handleReply}
      />
    </div>
  );
};
