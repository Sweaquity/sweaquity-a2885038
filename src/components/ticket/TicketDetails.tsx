
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/types/types";
import { X, Clock, MessageSquare, CalendarIcon, User, FileText } from "lucide-react";

export interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  onClose
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
      case 'closed':
        return 'bg-green-500';
      case 'blocked':
        return 'bg-red-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'review':
        return 'bg-purple-500';
      case 'new':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{ticket.title}</h2>
          <div className="text-sm text-muted-foreground mt-1">Ticket ID: {ticket.id}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
        <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
        {ticket.health && (
          <Badge variant="outline">Health: {ticket.health}</Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="whitespace-pre-line">{ticket.description || "No description provided."}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Details</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Reporter: {ticket.reporter || "N/A"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Assigned to: {ticket.reporter || "Unassigned"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Created: {formatDate(ticket.created_at)}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Updated: {formatDate(ticket.updated_at)}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Due date: {formatDate(ticket.due_date)}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Log Time
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Attach File
                  </Button>
                </div>
              </div>
            </div>

            {ticket.notes && ticket.notes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Activity</h3>
                <div className="space-y-4">
                  {ticket.notes.map((note, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                      <div className="text-sm font-medium">{note.user || "Unknown user"}</div>
                      <div className="text-xs text-muted-foreground mb-1">{formatDate(note.timestamp)}</div>
                      <div className="text-sm">{note.comment || note.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDetails;
