import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Eye, Clock, AlertTriangle, CheckCircle2, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface BetaTicket {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  health: string;
  created_at?: string;
  updated_at?: string;
  reporter?: string;
  project_id?: string;
  job_app_id?: string;
}

interface KanbanBoardProps {
  tickets?: BetaTicket[];
  onStatusChange?: (ticketId: string, newStatus: string) => void;
  onTicketClick?: (ticket: BetaTicket) => void;
  projectId?: string;
}

const statusColumns = [
  { id: "todo", title: "To Do", color: "bg-blue-100 text-blue-800" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { id: "in_review", title: "In Review", color: "bg-purple-100 text-purple-800" },
  { id: "done", title: "Done", color: "bg-green-100 text-green-800" },
];

export const KanbanBoard = ({ tickets = [], onStatusChange = () => {}, onTicketClick = () => {}, projectId }: KanbanBoardProps) => {
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [localTickets, setLocalTickets] = useState<BetaTicket[]>(tickets);
  
  useEffect(() => {
    if (projectId && tickets.length === 0) {
      fetchProjectTickets(projectId);
    } else {
      setLocalTickets(tickets);
    }
  }, [projectId, tickets]);
  
  const fetchProjectTickets = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      setLocalTickets(data || []);
    } catch (error) {
      console.error('Error fetching project tickets:', error);
    }
  };

  const getTicketsForStatus = (status: string) => {
    return localTickets.filter(ticket => ticket.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case "green":
        return "bg-green-100 text-green-800";
      case "yellow":
        return "bg-yellow-100 text-yellow-800";
      case "red":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "Invalid date";
    }
  };

  const handleViewTicket = async (ticket: BetaTicket) => {
    try {
      onTicketClick(ticket);
      
      setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id);
      
      console.log("Viewing ticket:", ticket);
      
      if (ticket.id) {
        const { data, error } = await supabase
          .from('tickets')
          .select(`
            *,
            job_applications(status, message),
            business_projects(title)
          `)
          .eq('id', ticket.id)
          .single();
          
        if (error) throw error;
        console.log("Ticket details:", data);
      }
    } catch (error) {
      console.error("Error viewing ticket:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statusColumns.map((column) => (
        <div key={column.id} className="flex flex-col">
          <div className="rounded-t-lg px-3 py-2 mb-2 border border-gray-200 bg-gray-50">
            <h3 className="font-medium">{column.title}</h3>
            <p className="text-xs text-muted-foreground">
              {getTicketsForStatus(column.id).length} items
            </p>
          </div>
          
          <Droppable droppableId={column.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex-1 min-h-[200px] bg-gray-50/50 rounded-b-lg p-2 space-y-2"
              >
                {getTicketsForStatus(column.id).map((ticket, index) => (
                  <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Card className="mb-2 cursor-grab">
                          <CardHeader className="py-3 px-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-sm font-medium line-clamp-2">
                                {ticket.title}
                              </CardTitle>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleViewTicket(ticket)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span className="sr-only">View</span>
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-0 px-3">
                            {ticket.description && (
                              <CardDescription className="line-clamp-2 text-xs mt-1">
                                {ticket.description}
                              </CardDescription>
                            )}
                          </CardContent>
                          <CardFooter className="py-2 px-3 flex justify-between">
                            <div className="flex space-x-1">
                              <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                              <Badge variant="outline" className={getHealthColor(ticket.health)}>
                                {ticket.health}
                              </Badge>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {getTimeAgo(ticket.created_at)}
                            </div>
                          </CardFooter>
                          
                          {expandedTicket === ticket.id && (
                            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-xs">
                              <h4 className="font-medium mb-1">Details</h4>
                              <div className="space-y-1">
                                <p><span className="font-medium">Created:</span> {getTimeAgo(ticket.created_at)}</p>
                                <p><span className="font-medium">Updated:</span> {getTimeAgo(ticket.updated_at)}</p>
                                <p><span className="font-medium">Status:</span> {ticket.status}</p>
                                <div className="flex justify-end mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => window.open(`/tickets/${ticket.id}`, '_blank')}
                                  >
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    Open Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      ))}
    </div>
  );
};
