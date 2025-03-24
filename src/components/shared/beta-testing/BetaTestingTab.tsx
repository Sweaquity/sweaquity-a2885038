
// Update this import to use the correct path to TimeTracker
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ticket/FilterBar";
import { KanbanBoard } from "@/components/ticket/KanbanBoard";
import { Task } from "gantt-task-react"; // Fixed import to use Task instead of task
import { toast } from "sonner";
import { DragDropContext } from "react-beautiful-dnd";
import { ExpandedTicketDetails } from "@/components/ticket/ExpandedTicketDetails";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";

interface BetaTestingTabProps {
  userType: "job-seeker" | "business" | "admin";
  userId: string;
  includeProjectTickets?: boolean;
}

export interface BetaTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  health: string;
  due_date?: string;
  assigned_to?: string;
  expanded?: boolean;
  task_id?: string;
  project_id?: string;
  description?: string;
  job_app_id?: string;
}

export const BetaTestingTab: React.FC<BetaTestingTabProps> = ({ userType, userId, includeProjectTickets }) => {
  const [tickets, setTickets] = useState<BetaTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<BetaTicket[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select('*');

      if (userType === 'job-seeker') {
        query = query.eq('assigned_to', userId);
      } else if (userType === 'business') {
        query = query.eq('reporter', userId);
      }

      if (includeProjectTickets) {
        query = query.not('project_id', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data as BetaTicket[]);
      setFilteredTickets(data as BetaTicket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [userId, userType, includeProjectTickets]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets, userId, userType, includeProjectTickets]);

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success("Ticket status updated");
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error("Failed to update ticket status");
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (newFilters: any) => {
    let filtered = [...tickets];

    if (newFilters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === newFilters.status);
    }

    if (newFilters.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === newFilters.priority);
    }

    setFilteredTickets(filtered);
  };

  const toggleTicketExpanded = (ticketId: string) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
    setSelectedTicketId(ticketId);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Tickets</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={fetchTickets}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="kanban">
            <TabsList className="mb-4">
              <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            </TabsList>
            
            <TabsContent value="kanban">
              <FilterBar 
                onFilterChange={handleFilterChange} 
                statuses={['all', 'todo', 'in-progress', 'review', 'done', 'closed']}
                priorities={['all', 'low', 'medium', 'high', 'urgent']}
              />
              
              <div className="mt-4">
                <DragDropContext onDragEnd={(result) => {
                  if (!result.destination) return;
                  const { draggableId, destination } = result;
                  updateTicketStatus(draggableId, destination.droppableId);
                }}>
                  <KanbanBoard 
                    tickets={filteredTickets as any} // Updated to fix type issue
                    onStatusChange={updateTicketStatus}
                    onTicketClick={(ticket) => toggleTicketExpanded(typeof ticket === 'string' ? ticket : ticket.id)} // Fixed to handle both string and Ticket object
                  />
                </DragDropContext>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedTicketId && (
        <Dialog open={!!selectedTicketId} onOpenChange={() => setSelectedTicketId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ticket Details</DialogTitle>
            </DialogHeader>
            <ExpandedTicketDetails 
              ticket={tickets.find(t => t.id === selectedTicketId) || null}
              onStatusChange={(status) => updateTicketStatus(selectedTicketId, status)} // Fixed to match the expected signature
            />
            <TimeTracker ticketId={selectedTicketId} userId={userId} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
