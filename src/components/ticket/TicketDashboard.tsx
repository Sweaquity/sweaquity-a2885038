
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { RefreshCw, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { TicketDetails } from "./TicketDetails";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/types/types";
import { TimeLogDialog } from "./TimeLogDialog";

interface Column {
  field: string;
  header: string;
  render?: (ticket: Ticket) => React.ReactNode;
}

interface CardStat {
  label: string;
  value: number;
  color: string;
}

interface TicketDashboardProps {
  tickets: Ticket[];
  isLoading?: boolean;
  handleTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  columns?: Column[];
  cardStats?: CardStat[];
  showTimeLogDialog?: boolean;
}

export const TicketDashboard = ({ 
  tickets, 
  isLoading = false,
  handleTicketAction,
  renderTicketActions,
  columns = [
    { field: 'title', header: 'Title' },
    { field: 'status', header: 'Status' },
    { field: 'priority', header: 'Priority' }
  ],
  cardStats,
  showTimeLogDialog = false
}: TicketDashboardProps) => {
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setStatusPriority] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = useState(false);
  const [selectedTicketForTimeLog, setSelectedTicketForTimeLog] = useState<Ticket | null>(null);
  const itemsPerPage = 10;

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleTicketExpansion = (ticketId: string) => {
    setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId);
  };

  const handleLogTime = (ticket: Ticket) => {
    setSelectedTicketForTimeLog(ticket);
    setIsTimeLogDialogOpen(true);
  };

  const handleRefresh = () => {
    // Reset filters to default
    setSearchTerm("");
    setStatusFilter("");
    setStatusPriority("");
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed':
      case 'closed':
        return 'bg-green-500';
      case 'in-progress':
      case 'in progress':
      case 'in_progress':
        return 'bg-blue-500';
      case 'review':
        return 'bg-purple-500';
      case 'backlog':
        return 'bg-gray-500';
      case 'open':
      case 'new':
      case 'todo':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {cardStats && (
        <div className="grid grid-cols-4 gap-4">
          {cardStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className={`p-3 bg-${stat.color}-50`}>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className={`text-2xl font-bold text-${stat.color}-600`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Tickets</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-40">
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select 
                  value={priorityFilter} 
                  onValueChange={setStatusPriority}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading tickets...</p>
              </div>
            ) : paginatedTickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tickets found.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      {columns.map((column, index) => (
                        <TableHead key={index}>{column.header}</TableHead>
                      ))}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTickets.map((ticket) => (
                      <>
                        <TableRow key={ticket.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTicketExpansion(ticket.id)}
                              className="p-0 h-8 w-8"
                            >
                              {expandedTicketId === ticket.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          {columns.map((column, index) => (
                            <TableCell key={index}>
                              {column.render ? (
                                column.render(ticket)
                              ) : column.field === 'status' ? (
                                <Badge className={getStatusColor(ticket.status)}>
                                  {ticket.status}
                                </Badge>
                              ) : column.field === 'priority' ? (
                                <Badge className={getPriorityColor(ticket.priority)}>
                                  {ticket.priority}
                                </Badge>
                              ) : (
                                // @ts-ignore
                                ticket[column.field]
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {showTimeLogDialog && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleLogTime(ticket)}
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                              )}
                              {renderTicketActions && renderTicketActions(ticket)}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedTicketId === ticket.id && (
                          <TableRow>
                            <TableCell colSpan={columns.length + 2}>
                              <TicketDetails 
                                ticket={ticket}
                                onTicketAction={handleTicketAction}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTicketForTimeLog && (
        <TimeLogDialog
          isOpen={isTimeLogDialogOpen}
          onOpenChange={setIsTimeLogDialogOpen}
          ticket={selectedTicketForTimeLog}
          onClose={() => setSelectedTicketForTimeLog(null)}
        />
      )}
    </div>
  );
};
