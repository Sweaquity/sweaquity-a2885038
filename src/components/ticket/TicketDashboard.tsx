
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ExpandedTicketDetails } from "@/components/ticket/ExpandedTicketDetails";
import { TicketMessage } from "@/types/dashboard";
import { Clock, CheckCircle2, AlertTriangle, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket } from "@/types/types";

export interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => void;
  showTimeTracking: boolean;
  userId: string;
}

export const TicketDashboard = ({ 
  initialTickets, 
  onRefresh,
  onTicketAction,
  showTimeTracking,
  userId
}: TicketDashboardProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    setTickets(initialTickets);
    setFilteredTickets(initialTickets);
  }, [initialTickets]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, priorityFilter, tickets]);

  const loadUsers = async () => {
    // Here you would load users from your backend
    // This is a placeholder
    setUsers([
      { id: userId, first_name: 'Current', last_name: 'User', email: 'user@example.com' }
    ]);
  };

  const applyFilters = () => {
    let result = [...tickets];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(ticket => 
        ticket.title?.toLowerCase().includes(term) || 
        ticket.description?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(ticket => ticket.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(ticket => ticket.priority === priorityFilter);
    }

    setFilteredTickets(result);
  };

  const handleRowClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDialogOpen(true);
  };

  // Status icon helper
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'done':
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleTicketStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    
    await onTicketAction(selectedTicket.id, 'updateStatus', status);
    
    // Update the local state
    setTickets(prev => 
      prev.map(t => t.id === selectedTicket.id ? { ...t, status } : t)
    );
    
    // Also update the selectedTicket
    setSelectedTicket(prev => prev ? { ...prev, status } : null);
  };

  const handleTicketPriorityChange = async (priority: string) => {
    if (!selectedTicket) return;
    
    await onTicketAction(selectedTicket.id, 'updatePriority', priority);
    
    // Update the local state
    setTickets(prev => 
      prev.map(t => t.id === selectedTicket.id ? { ...t, priority } : t)
    );
    
    // Also update the selectedTicket
    setSelectedTicket(prev => prev ? { ...prev, priority } : null);
  };

  const handleTicketDueDateChange = async (dueDate: string) => {
    if (!selectedTicket) return;
    
    await onTicketAction(selectedTicket.id, 'updateDueDate', dueDate);
    
    // Update the local state
    setTickets(prev => 
      prev.map(t => t.id === selectedTicket.id ? { ...t, due_date: dueDate } : t)
    );
    
    // Also update the selectedTicket
    setSelectedTicket(prev => prev ? { ...prev, due_date: dueDate } : null);
  };

  const handleTicketEstimatedHoursChange = async (hours: number) => {
    if (!selectedTicket) return;
    
    await onTicketAction(selectedTicket.id, 'updateEstimatedHours', hours);
    
    // Update the local state
    setTickets(prev => 
      prev.map(t => t.id === selectedTicket.id ? { ...t, estimated_hours: hours } : t)
    );
    
    // Also update the selectedTicket
    setSelectedTicket(prev => prev ? { ...prev, estimated_hours: hours } : null);
  };

  const handleTicketCompletionChange = async (percentage: number) => {
    if (!selectedTicket) return;
    
    await onTicketAction(selectedTicket.id, 'updateCompletionPercentage', percentage);
    
    // Update the local state
    setTickets(prev => 
      prev.map(t => t.id === selectedTicket.id ? { ...t, completion_percentage: percentage } : t)
    );
    
    // Also update the selectedTicket
    setSelectedTicket(prev => prev ? { ...prev, completion_percentage: percentage } : null);
  };

  const handleTicketReply = async (message: string) => {
    if (!selectedTicket) return;
    
    await onTicketAction(selectedTicket.id, 'addReply', message);
    
    // Update locally after the backend update
    const newReply = {
      id: Date.now().toString(),
      content: message,
      createdAt: new Date().toISOString(),
      sender: {
        id: userId,
        name: 'You'
      }
    };
    
    const updatedTicket = {
      ...selectedTicket,
      replies: [...(selectedTicket.replies || []), newReply]
    };
    
    setSelectedTicket(updatedTicket);
    
    // Also update in the main tickets list
    setTickets(prev => 
      prev.map(t => t.id === updatedTicket.id ? updatedTicket : t)
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button variant="outline" className="flex gap-1" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden md:inline">Refresh</span>
          </Button>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Priority</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              {showTimeTracking && (
                <TableHead className="hidden md:table-cell">Completion</TableHead>
              )}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showTimeTracking ? 6 : 5} className="text-center h-24">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(ticket)}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{ticket.title}</span>
                      <span className="text-xs text-muted-foreground md:hidden">
                        {ticket.status} • {ticket.priority}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1 capitalize">{ticket.status.replace('-', ' ')}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={ticket.priority === 'high' ? 'destructive' : 
                      ticket.priority === 'medium' ? 'default' : 'outline'}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(ticket.due_date)}
                  </TableCell>
                  {showTimeTracking && (
                    <TableCell className="hidden md:table-cell">
                      {ticket.completion_percentage || 0}%
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Ticket Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <ExpandedTicketDetails
              ticket={selectedTicket}
              onReply={handleTicketReply}
              onStatusChange={handleTicketStatusChange}
              onPriorityChange={handleTicketPriorityChange}
              onAssigneeChange={(userId) => onTicketAction(selectedTicket.id, 'updateAssignee', userId)}
              onUpdateEstimatedHours={handleTicketEstimatedHoursChange}
              onUpdateCompletionPercentage={handleTicketCompletionChange}
              onUpdateDueDate={handleTicketDueDateChange}
              users={users}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
