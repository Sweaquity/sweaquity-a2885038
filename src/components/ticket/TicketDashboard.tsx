import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Ticket } from "@/types/types";

export interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  userId: string;
  onLogTime: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  expandedTickets?: Set<string>;
  toggleTicketExpansion?: (ticketId: string) => void;
  hideTaskEditButtons?: boolean; // New prop to hide edit/delete buttons for tasks
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  showTimeTracking = true,
  userId,
  onLogTime,
  renderTicketActions,
  expandedTickets = new Set<string>(),
  toggleTicketExpansion = () => {},
  hideTaskEditButtons = false
}) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  // Filter tickets based on search term
  const filteredTickets = tickets.filter(ticket => 
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // This is a simplified implementation - you would need to replace this
  // with your actual ticket display component
  return (
    <div>
      <div className="flex mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button 
          variant="outline" 
          className="ml-2"
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tickets found
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div key={ticket.id} className="border rounded-md p-4">
              {/* You would replace this with your actual ticket rendering logic */}
              <h3 className="font-bold">{ticket.title}</h3>
              {ticket.description && <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>}
              
              {/* Conditionally render edit buttons based on hideTaskEditButtons prop */}
              {!hideTaskEditButtons && (
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mr-2"
                    onClick={() => onTicketAction(ticket.id, 'edit', null)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive"
                    onClick={() => onTicketAction(ticket.id, 'delete', null)}
                  >
                    Delete
                  </Button>
                </div>
              )}
              
              {/* Custom ticket actions */}
              {renderTicketActions && (
                <div className="mt-2">
                  {renderTicketActions(ticket)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
