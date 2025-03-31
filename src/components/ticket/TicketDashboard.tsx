
import React, { useState, useEffect } from 'react';
import { TicketList } from './TicketList';
import { TicketDetails } from './TicketDetails';
import { FilterBar } from './FilterBar';
import { TicketStats } from './TicketStats';
import { Ticket } from '@/types/types';
import { CreateTicketDialog } from './CreateTicketDialog';
import { TicketAttachments } from './TicketAttachments';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  showTimeTracking?: boolean;
  userId: string;
  expandedTickets: Set<string>;
  toggleTicketExpansion: (ticketId: string) => void;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  onLogTime,
  renderTicketActions,
  showTimeTracking = false,
  userId,
  expandedTickets,
  toggleTicketExpansion
}) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets || []);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(tickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("details");

  useEffect(() => {
    setTickets(initialTickets || []);
    setFilteredTickets(initialTickets || []);
  }, [initialTickets]);

  const handleFilterChange = (filtered: Ticket[]) => {
    setFilteredTickets(filtered);
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleClose = () => {
    setSelectedTicket(null);
  };

  return (
    <div className="space-y-4">
      <FilterBar 
        tickets={tickets} 
        onFilterChange={handleFilterChange} 
        onCreateTicket={() => setIsCreateTicketOpen(true)} 
      />
      
      <TicketStats tickets={filteredTickets} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <TicketList 
            tickets={filteredTickets} 
            onTicketSelect={handleTicketSelect} 
            selectedTicketId={selectedTicket?.id}
            onTicketAction={onTicketAction}
            onLogTime={onLogTime}
            renderTicketActions={renderTicketActions}
            showTimeTracking={showTimeTracking}
            expandedTickets={expandedTickets}
            toggleTicketExpansion={toggleTicketExpansion}
          />
        </div>
        
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <TicketDetails
                    ticket={selectedTicket}
                    onClose={handleClose}
                    onTicketAction={onTicketAction}
                    onLogTime={onLogTime}
                    showTimeTracking={showTimeTracking}
                  />
                </TabsContent>
                <TabsContent value="attachments">
                  <TicketAttachments ticket={selectedTicket} />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Select a ticket to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <CreateTicketDialog 
        open={isCreateTicketOpen} 
        onOpenChange={setIsCreateTicketOpen}
        onTicketCreated={onRefresh}
        userId={userId}
      />
    </div>
  );
};
