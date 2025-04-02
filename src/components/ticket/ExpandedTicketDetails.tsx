
import React, { useState, useEffect } from "react";
import { Ticket } from "@/types/types";
import { X, Clock, AlertTriangle, CheckCircle2, Calendar, CornerDownRight, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { TicketAttachment } from "./TicketAttachment";

export interface ExpandedTicketDetailsProps {
  ticket: Ticket;
  onClose?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
}

export const ExpandedTicketDetails: React.FC<ExpandedTicketDetailsProps> = ({
  ticket,
  onClose,
  onTicketAction,
  onLogTime,
  userCanEditStatus = false,
  userCanEditDates = false
}) => {
  const [newNote, setNewNote] = useState<string>("");
  const [completionPercentage, setCompletionPercentage] = useState<number>(ticket.completion_percentage || 0);
  const [estimatedHours, setEstimatedHours] = useState<number>(ticket.estimated_hours || 0);
  const [dueDate, setDueDate] = useState<string | null>(ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleUpdateCompletionPercentage = async () => {
    if (!onTicketAction) return;
    
    try {
      await onTicketAction(ticket.id, 'updateCompletionPercentage', completionPercentage);
    } catch (error) {
      console.error("Error updating completion percentage:", error);
    }
  };

  const handleUpdateEstimatedHours = async () => {
    if (!onTicketAction) return;
    
    try {
      await onTicketAction(ticket.id, 'updateEstimatedHours', estimatedHours);
    } catch (error) {
      console.error("Error updating estimated hours:", error);
    }
  };

  const handleUpdateDueDate = async () => {
    if (!onTicketAction || !dueDate) return;
    
    try {
      await onTicketAction(ticket.id, 'updateDueDate', dueDate);
    } catch (error) {
      console.error("Error updating due date:", error);
    }
  };

  const handleSubmitNote = async () => {
    if (!onTicketAction || !newNote.trim()) return;
    
    try {
      await onTicketAction(ticket.id, 'addNote', newNote);
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!onTicketAction) return;
    
    try {
      await onTicketAction(ticket.id, 'updateStatus', status);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    if (!onTicketAction) return;
    
    try {
      await onTicketAction(ticket.id, 'updatePriority', priority);
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const handleDeleteTicket = async () => {
    if (!onTicketAction) return;
    
    try {
      await onTicketAction(ticket.id, 'deleteTicket', null);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "blocked":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "done":
      case "closed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{ticket.title}</h2>
          <p className="text-sm text-muted-foreground">
            {ticket.project_id && `Project: ${ticket.project?.title || 'Unknown'}`}
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the ticket and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTicket} className="bg-red-500 hover:bg-red-600">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {onLogTime && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onLogTime(ticket.id)}
            >
              Log Time
            </Button>
          )}
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-4 col-span-2">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-sm mb-2">Description</h3>
            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-md">
              <TicketAttachment 
                attachments={ticket.attachments} 
                onDeleteAttachment={(url) => onTicketAction && onTicketAction(ticket.id, 'deleteAttachment', url)}
                canDelete={true}
              />
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-sm mb-4">Comments & History</h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {ticket.notes && ticket.notes.length > 0 ? (
                <div className="space-y-4">
                  {ticket.notes.map((note: any, index: number) => (
                    <div key={index} className="border-b pb-2 mb-2 last:border-0">
                      <div className="flex justify-between text-sm">
                        <p className="font-medium">{note.user}</p>
                        <p className="text-muted-foreground">
                          {formatDate(note.timestamp)}
                        </p>
                      </div>
                      <div className="mt-1 text-sm">
                        {note.action && (
                          <p className="text-xs text-muted-foreground">
                            {note.action}
                          </p>
                        )}
                        {note.comment && (
                          <p className="whitespace-pre-wrap mt-1">
                            <CornerDownRight className="h-3 w-3 inline mr-1 text-muted-foreground" />
                            {note.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
            </ScrollArea>

            <div className="mt-4 space-y-2">
              <Label htmlFor="note">Add a comment</Label>
              <Textarea
                id="note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type your comment here..."
                className="min-h-[100px]"
              />
              <Button 
                className="w-full" 
                onClick={handleSubmitNote}
                disabled={!newNote.trim()}
              >
                Submit Comment
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-sm mb-2">Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Status</dt>
                <dd>
                  {userCanEditStatus ? (
                    <Select 
                      defaultValue={ticket.status} 
                      onValueChange={handleUpdateStatus}
                    >
                      <SelectTrigger className="w-[120px] h-7">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center">
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1 text-sm">
                        {ticket.status === "in-progress" 
                          ? "In Progress" 
                          : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </div>
                  )}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Priority</dt>
                <dd>
                  <Select 
                    defaultValue={ticket.priority} 
                    onValueChange={handleUpdatePriority}
                  >
                    <SelectTrigger className="w-[120px] h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Assigned to</dt>
                <dd className="text-sm">
                  {ticket.assigned_to ? ticket.assigned_to : "Unassigned"}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Reporter</dt>
                <dd className="text-sm">
                  {ticket.reporter ? ticket.reporter : "Unknown"}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Created</dt>
                <dd className="text-sm">
                  {ticket.created_at ? formatDate(ticket.created_at) : "Unknown"}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Updated</dt>
                <dd className="text-sm">
                  {ticket.updated_at ? formatDate(ticket.updated_at) : "Unknown"}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Due Date</dt>
                <dd className="text-sm">
                  {userCanEditDates ? (
                    <div className="flex items-center">
                      <Input 
                        type="date"
                        value={dueDate || ''}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-[140px] h-7 mr-1"
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 px-2"
                        onClick={handleUpdateDueDate}
                      >
                        <Calendar className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    formatDate(ticket.due_date)
                  )}
                </dd>
              </div>

              {ticket.type === 'task' && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Completion</dt>
                    <dd className="text-sm flex items-center">
                      <Input 
                        type="number" 
                        value={completionPercentage}
                        onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                        className="w-[70px] h-7 mr-1"
                        min="0"
                        max="100"
                      />
                      <span className="mr-1">%</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 px-2"
                        onClick={handleUpdateCompletionPercentage}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </dd>
                  </div>
                  <div className="pt-1">
                    <Progress value={completionPercentage} />
                  </div>
                  
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Estimated Hours</dt>
                    <dd className="text-sm flex items-center">
                      <Input 
                        type="number" 
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(Number(e.target.value))}
                        className="w-[70px] h-7 mr-1"
                        min="0"
                      />
                      <span className="mr-1">hrs</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 px-2"
                        onClick={handleUpdateEstimatedHours}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
