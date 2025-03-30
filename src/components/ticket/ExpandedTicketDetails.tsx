
import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Clock, UserRound, Calendar, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Ticket, ExpandedTicketDetailsProps } from "@/types/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TicketAttachments } from "./TicketAttachments";

export const ExpandedTicketDetails = ({ 
  ticket, 
  onClose, 
  onTicketAction,
  onLogTime,
  userCanEditStatus,
  userCanEditDates
}: ExpandedTicketDetailsProps) => {
  const [newNote, setNewNote] = useState('');
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'review':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'done':
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    if (onTicketAction) {
      onTicketAction(ticket.id, 'addNote', newNote.trim());
      setNewNote('');
    }
  };
  
  return (
    <div className="mt-4 border-t pt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2 space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <div className="bg-gray-50 p-3 rounded text-sm">
              {ticket.description || 'No description provided'}
            </div>
          </div>
          
          {ticket.reproduction_steps && (
            <div>
              <h4 className="text-sm font-medium mb-2">Steps to Reproduce</h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                {ticket.reproduction_steps}
              </div>
            </div>
          )}
          
          {ticket.system_info && (
            <div>
              <h4 className="text-sm font-medium mb-2">System Information</h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <pre className="whitespace-pre-wrap">{typeof ticket.system_info === 'string' ? ticket.system_info : JSON.stringify(ticket.system_info, null, 2)}</pre>
              </div>
            </div>
          )}
          
          {/* Add the attachments section */}
          {(ticket.attachments?.length > 0 || (ticket.project_id && ticket.id)) && (
            <div>
              <h4 className="text-sm font-medium mb-2">Attachments</h4>
              <div className="flex gap-2 flex-wrap">
                <TicketAttachments 
                  ticketId={ticket.id}
                  projectId={ticket.project_id}
                  attachmentUrls={ticket.attachments}
                  label="View Attachments"
                />
              </div>
            </div>
          )}
          
          {(ticket.notes && ticket.notes.length > 0) && (
            <div>
              <h4 className="text-sm font-medium mb-2">Notes & Updates</h4>
              <div className="space-y-3">
                {ticket.notes.map((note, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{getInitials(note.user)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{note.user}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(note.timestamp)}</span>
                    </div>
                    <p className="text-sm">{note.comment || note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium mb-2">Add Note</h4>
            <div className="flex gap-2">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note or update..."
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button 
                variant="default" 
                size="sm"
                disabled={!newNote.trim()}
                onClick={handleAddNote}
              >
                <SendHorizontal className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </div>
          </div>
        </div>
        
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <UserRound className="h-4 w-4" /> Reporter
                </span>
                <span>{ticket.reporter ? ticket.reporter : 'Unknown'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <UserRound className="h-4 w-4" /> Assignee
                </span>
                <span>{ticket.assigned_to ? ticket.assigned_to : 'Unassigned'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Created
                </span>
                <span>{formatDate(ticket.created_at)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Updated
                </span>
                <span>{formatDate(ticket.updated_at)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Due Date
                </span>
                <span>{ticket.due_date ? formatDate(ticket.due_date) : 'Not set'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" /> Type
                </span>
                <span>{ticket.ticket_type || 'Task'}</span>
              </div>
              
              {ticket.completion_percentage !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" /> Completion
                  </span>
                  <span>{ticket.completion_percentage}%</span>
                </div>
              )}
              
              {ticket.equity_points !== undefined && ticket.equity_points > 0 && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" /> Equity Points
                  </span>
                  <span>{ticket.equity_points}</span>
                </div>
              )}
            </CardContent>
            {onLogTime && (
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onLogTime(ticket.id)}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Log Time
                </Button>
              </CardFooter>
            )}
          </Card>
          
          <div className="flex flex-col gap-2">
            {userCanEditStatus && onTicketAction && (
              <Button 
                variant="outline" 
                size="sm"
                className={
                  ticket.status === 'done' || ticket.status === 'closed'
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800'
                    : ticket.status === 'in-progress'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-800'
                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800'
                }
                onClick={() => {
                  if (ticket.status === 'new') {
                    onTicketAction(ticket.id, 'updateStatus', 'in-progress');
                  } else if (ticket.status === 'in-progress') {
                    onTicketAction(ticket.id, 'updateStatus', 'review');
                  } else if (ticket.status === 'review') {
                    onTicketAction(ticket.id, 'updateStatus', 'done');
                  }
                }}
                disabled={ticket.status === 'done' || ticket.status === 'closed' || ticket.status === 'blocked'}
              >
                {getStatusIcon(ticket.status)}
                <span className="ml-2">
                  {ticket.status === 'new' && 'Start Progress'}
                  {ticket.status === 'in-progress' && 'Submit for Review'}
                  {ticket.status === 'review' && 'Mark as Done'}
                  {(ticket.status === 'done' || ticket.status === 'closed') && 'Completed'}
                  {ticket.status === 'blocked' && 'Blocked'}
                </span>
              </Button>
            )}
            
            {onClose && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onClose}
              >
                Close Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
