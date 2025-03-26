
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
  userId?: string;
  onRefresh?: () => void;
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
  showTimeLogDialog = false,
  userId,
  onRefresh
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
    if (onRefresh) {
      onRefresh();
    } else {
      // Reset filters to default
      setSearchTerm("");
      setStatusFilter("");
      setStatusPriority("");
      setCurrentPage(1);
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardStats.map((stat, index) => (
            <Card key={index} className={`border-l-4 border-${stat.color}-500`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold">{isLoading ? "..." : stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-full bg-${stat.color}-100`}>
                    <div className={`h-6 w-6 text-${stat.color}-500`}>
                      {stat.label.includes('Open') ? <Clock /> : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setStatusPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by priority" />
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

        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-lg text-gray-500">No tickets found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={index}>{column.header}</TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTickets.map((ticket) => (
                  <React.Fragment key={ticket.id}>
                    <TableRow className="group">
                      {columns.map((column, index) => (
                        <TableCell key={index}>
                          {column.render ? (
                            column.render(ticket)
                          ) : column.field === 'status' ? (
                            <Badge className={getStatusColor(ticket.status as string)}>
                              {ticket.status}
                            </Badge>
                          ) : column.field === 'priority' ? (
                            <Badge className={getPriorityColor(ticket.priority as string)}>
                              {ticket.priority}
                            </Badge>
                          ) : column.field === 'completion_percentage' ? (
                            `${ticket.completion_percentage || 0}%`
                          ) : (
                            (ticket as any)[column.field]
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          {renderTicketActions ? (
                            renderTicketActions(ticket)
                          ) : null}
                          
                          {showTimeLogDialog && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLogTime(ticket)}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Log Time
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTicketExpansion(ticket.id)}
                          >
                            {expandedTicketId === ticket.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedTicketId === ticket.id && (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} className="p-0 border-t-0">
                          <div className="p-4 bg-gray-50">
                            <TicketDetails 
                              ticket={ticket} 
                              onTicketAction={handleTicketAction}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {selectedTicketForTimeLog && (
        <TimeLogDialog 
          open={isTimeLogDialogOpen}
          onOpenChange={setIsTimeLogDialogOpen}
          ticket={selectedTicketForTimeLog}
          userId={userId || ''}
        />
      )}
    </div>
  );
};
