
import React from "react";
import { Ticket } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, MessageSquare, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface TicketDetailsProps {
  ticket: Ticket;
  onStatusChange: (ticketId: string, newStatus: string) => void;
  onPriorityChange: (ticketId: string, newPriority: string) => void;
  onDueDateChange: (ticketId: string, newDueDate: string) => void;
  formatDate: (dateString: string) => string;
}

export const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  formatDate
}) => {
  return (
    <Card className="shadow-none border-t-0 rounded-t-none pt-0">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-md font-semibold mb-2">Details</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-sm">{ticket.description || "No description provided."}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="flex space-x-2 mt-1">
                  {['new', 'in-progress', 'blocked', 'review', 'done', 'closed'].map(status => (
                    <Badge 
                      key={status}
                      variant={ticket.status === status ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => onStatusChange(ticket.id, status)}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Priority</p>
                <div className="flex space-x-2 mt-1">
                  {['low', 'medium', 'high'].map(priority => (
                    <Badge 
                      key={priority}
                      variant={ticket.priority === priority ? "default" : "outline"}
                      className={`cursor-pointer ${
                        priority === 'high' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                        priority === 'medium' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                        'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      onClick={() => onPriorityChange(ticket.id, priority)}
                    >
                      {priority}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Due Date</p>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <input 
                    type="date" 
                    value={ticket.due_date || ''} 
                    onChange={(e) => onDueDateChange(ticket.id, e.target.value)}
                    className="text-sm p-1 border rounded"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-semibold mb-2">Activity</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Created: {formatDate(ticket.created_at)}</span>
              </div>
              
              {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">Updated: {formatDate(ticket.updated_at)}</span>
                </div>
              )}
              
              <Separator className="my-2" />
              
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Notes & Comments
                </p>
                
                {ticket.notes && ticket.notes.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {ticket.notes.map((note, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                        <div className="font-medium">{note.user} - {note.action}</div>
                        <div className="text-gray-500 text-xs">{formatDate(note.timestamp)}</div>
                        {note.comment && <p className="mt-1">{note.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">No notes yet.</p>
                )}
                
                <div className="mt-3">
                  <Textarea 
                    placeholder="Add a note..." 
                    value={ticket.newNote || ''}
                    onChange={(e) => {
                      // This would need to be implemented with a state update function
                      // that's passed in as a prop
                    }}
                    className="text-sm"
                  />
                  <Button variant="outline" size="sm" className="mt-2">
                    Add Note
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
