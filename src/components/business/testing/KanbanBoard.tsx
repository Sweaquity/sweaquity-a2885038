
import React from "react";
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult
} from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, BetaTicket } from "@/types/types";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Clock, AlertTriangle, Check, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isValid, parseISO } from "date-fns";

interface KanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: string) => Promise<void>;
  onTicketClick: (ticket: BetaTicket) => void;
  onTicketDelete?: (ticket: Ticket) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tickets,
  onStatusChange,
  onTicketClick,
  onTicketDelete
}) => {
  const columns = [
    { id: "todo", title: "To Do" },
    { id: "in-progress", title: "In Progress" },
    { id: "review", title: "In Review" },
    { id: "done", title: "Done" },
  ];

  const getTicketsForColumn = (columnId: string) => {
    return tickets.filter((ticket) => {
      // Handle different status formats
      const status = ticket.status?.toLowerCase() || "";
      return (
        status === columnId ||
        (columnId === "in-progress" && status === "in progress") ||
        (columnId === "review" && status === "in review")
      );
    });
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Convert kanban column IDs to ticket status values
    let newStatus = destination.droppableId;
    if (newStatus === "in-progress") newStatus = "in progress";
    if (newStatus === "review") newStatus = "in review";

    onStatusChange(draggableId, newStatus);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-800";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-800";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return "";
      return format(date, "MMM d");
    } catch (e) {
      return "";
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col h-full">
            <h3 className="font-medium text-sm mb-2 px-2">{column.title}</h3>
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 min-h-[200px] rounded-md p-2",
                    snapshot.isDraggingOver
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-900"
                  )}
                >
                  {getTicketsForColumn(column.id).map((ticket, index) => (
                    <Draggable
                      key={ticket.id}
                      draggableId={ticket.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "mb-2",
                            snapshot.isDragging && "opacity-70"
                          )}
                        >
                          <CardContent className="p-3">
                            <div className="flex flex-col space-y-2">
                              <div className="flex justify-between items-start">
                                <div 
                                  className="font-medium text-sm cursor-pointer hover:text-blue-600 transition-colors flex-1"
                                  onClick={() => onTicketClick(ticket as BetaTicket)}
                                >
                                  {ticket.title}
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Actions</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => onTicketClick(ticket as BetaTicket)}
                                    >
                                      View Details
                                    </DropdownMenuItem>
                                    {onTicketDelete && (
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => onTicketDelete(ticket)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                                  {ticket.priority}
                                </Badge>
                                
                                {ticket.due_date && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDueDate(ticket.due_date)}
                                  </div>
                                )}
                              </div>
                              
                              {typeof ticket.completion_percentage === "number" && (
                                <div className="mt-2">
                                  <div className="flex justify-between items-center text-xs mb-1">
                                    <span>Progress</span>
                                    <span>{ticket.completion_percentage}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full"
                                      style={{ width: `${ticket.completion_percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
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
    </DragDropContext>
  );
};
