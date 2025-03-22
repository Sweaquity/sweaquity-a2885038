import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

import { fetchTickets, updateTicketStatus, updateTicketPriority, setTicketDueDate } from "./ticketService";
import { TicketKanbanBoard } from "./TicketKanbanBoard";
import { GanttChartView } from "./GanttChartView";
import { TicketDetails } from "./TicketDetails";
import { Ticket, TicketStatistics } from "./types";

interface TicketDashboardProps {
  projectFilter?: string;
  initialTickets?: Ticket[];
  onRefresh?: () => void;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({ 
  projectFilter,
  initialTickets,
  onRefresh
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets || []);
  const [showKanban, setShowKanban] = useState(true);
  const [showGantt, setShowGantt] = useState(true);
  const [ticketStats, setTicketStats] = useState<TicketStatistics>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    byStatus: {},
    byPriority: {}
  });

  useEffect(() => {
    if (!initialTickets) {
      loadTickets();
    } else {
      setTickets(initialTickets);
      calculateTicketStatistics(initialTickets);
      setIsLoading(false);
    }
  }, [initialTickets, projectFilter]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const ticketData = await fetchTickets(projectFilter);
      setTickets(ticketData);
      calculateTicketStatistics(ticketData);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load ticket data");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTicketStatistics = (ticketData: Ticket[]) => {
    const totalTickets = ticketData.length;
    const openTickets = ticketData.filter(ticket => 
      ticket.status !== 'done' && ticket.status !== 'closed'
    ).length;
    const closedTickets = totalTickets - openTickets;
    const highPriorityTickets = ticketData.filter(ticket => 
      ticket.priority === 'high'
    ).length;

    const byStatus: { [key: string]: number } = {};
    const byPriority: { [key: string]: number } = {};

    ticketData.forEach(ticket => {
      byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1;
      byPriority[ticket.priority] = (byPriority[ticket.priority] || 0) + 1;
    });

    setTicketStats({
      totalTickets,
      openTickets,
      closedTickets,
      highPriorityTickets,
      byStatus,
      byPriority,
    });
  };

  const handleRefreshData = async () => {
    await loadTickets();
    if (onRefresh) onRefresh();
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      
      const updatedTickets = tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      );
      
      setTickets(updatedTickets);
      calculateTicketStatistics(updatedTickets);
      toast.success("Ticket status updated successfully");
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    }
  };

  const handleUpdateTicketPriority = async (ticketId: string, newPriority: string) => {
    try {
      await updateTicketPriority(ticketId, newPriority);
      
      const updatedTickets = tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
      );
      
      setTickets(updatedTickets);
      calculateTicketStatistics(updatedTickets);
      toast.success("Ticket priority updated successfully");
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      toast.error("Failed to update ticket priority");
    }
  };

  const handleSetDueDate = async (ticketId: string, newDueDate: string) => {
    try {
      await setTicketDueDate(ticketId, newDueDate);
      
      const updatedTickets = tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, due_date: newDueDate } : ticket
      );
      
      setTickets(updatedTickets);
      toast.success("Due date updated successfully");
    } catch (error) {
      console.error("Error setting due date:", error);
      toast.error("Failed to set due date");
    }
  };

  const toggleTicketExpanded = (ticketId: string) => {
    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId ? { ...ticket, expanded: !ticket.expanded } : ticket
    ));
  };

  const getGanttTasks = () => {
    return tickets.map((ticket) => {
      const startDate = new Date(ticket.created_at);
      let endDate = ticket.due_date ? new Date(ticket.due_date) : new Date();
      
      if (!ticket.due_date || endDate < new Date()) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
      }
      
      return {
        id: ticket.id,
        name: ticket.title,
        start: startDate,
        end: endDate,
        type: 'task',
        progress: ticket.status === 'done' || ticket.status === 'closed' ? 100 : 
                 ticket.status === 'in-progress' ? 50 : 
                 ticket.status === 'review' ? 75 : 25,
        isDisabled: false,
        styles: { 
          progressColor: 
            ticket.priority === 'high' ? '#ef4444' : 
            ticket.priority === 'medium' ? '#f59e0b' : '#3b82f6'
        }
      };
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{projectFilter ? `${projectFilter} Tickets` : "All Tickets"}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKanban(!showKanban)}
            >
              {showKanban ? "Hide" : "Show"} Kanban Board
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGantt(!showGantt)}
            >
              {showGantt ? "Hide" : "Show"} Gantt Chart
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshData} 
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
        <CardDescription>Manage tickets and track progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-blue-600">Total Tickets</p>
                <p className="text-2xl font-bold">{ticketStats.totalTickets}</p>
              </div>
              <div className="p-1.5 bg-blue-100 rounded-full">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-amber-600">Open Tickets</p>
                <p className="text-2xl font-bold">{ticketStats.openTickets}</p>
              </div>
              <div className="p-1.5 bg-amber-100 rounded-full">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-green-600">Closed Tickets</p>
                <p className="text-2xl font-bold">{ticketStats.closedTickets}</p>
              </div>
              <div className="p-1.5 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-red-600">High Priority</p>
                <p className="text-2xl font-bold">{ticketStats.highPriorityTickets}</p>
              </div>
              <div className="p-1.5 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>
        
        {showKanban && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Ticket Board</h3>
            <div className="border rounded-lg overflow-hidden">
              <TicketKanbanBoard 
                tickets={tickets} 
                onStatusChange={handleUpdateTicketStatus} 
                onViewTicket={toggleTicketExpanded}
              />
            </div>
          </div>
        )}
        
        {showGantt && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Timeline</h3>
            <div className="border rounded-lg overflow-hidden p-4">
              <GanttChartView tasks={getGanttTasks()} />
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-lg font-medium mb-4">All Tickets</h3>
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(ticket => (
                <React.Fragment key={ticket.id}>
                  <TableRow className="group">
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                        ticket.status === 'blocked' ? 'bg-red-100 text-red-800' :
                        ticket.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'done' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    <TableCell>{ticket.due_date ? formatDate(ticket.due_date) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTicketExpanded(ticket.id)}
                      >
                        {ticket.expanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {ticket.expanded && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0 border-t-0">
                        <TicketDetails 
                          ticket={ticket}
                          onStatusChange={handleUpdateTicketStatus}
                          onPriorityChange={handleUpdateTicketPriority}
                          onDueDateChange={handleSetDueDate}
                          formatDate={formatDate}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
