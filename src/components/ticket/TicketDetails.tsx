import React, { useState } from "react";
import { Ticket } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, MessageSquare, Clock, PercentIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  // Make sure we have a safe value for ticket status and priority
  const safeStatus = ticket.status || "new";
  const safePriority = ticket.priority || "medium";
  
  const [noteText, setNoteText] = useState('');
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState<number>(ticket.estimated_hours || 0);
  const [completionPercentage, setCompletionPercentage] = useState<number>(
    ticket.completion_percentage || 0
  );

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      setIsUpdatingNote(true);

      // Create a new note object (use 'comment' field for compatibility)
      const newNote = {
        id: Date.now().toString(),
        user: "Current User", // Ideally, get the current user's name
        timestamp: new Date().toISOString(),
        action: "commented",
        comment: noteText // Use comment field to ensure it shows up
      };

      // Get existing notes or initialize empty array
      const existingNotes = ticket.notes || [];
      const updatedNotes = [...existingNotes, newNote];

      // Update the ticket with the new note
      const { error } = await supabase
        .from('tickets')
        .update({ 
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (error) throw error;

      toast.success("Note added successfully");
      setNoteText(''); // Clear the input
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error("Failed to add note");
    } finally {
      setIsUpdatingNote(false);
    }
  };

  const updateEstimatedHours = async () => {
    if (estimatedHours < 0) {
      toast.error("Hours cannot be negative");
      return;
    }

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          estimated_hours: estimatedHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (error) throw error;

      toast.success("Estimated hours updated");
    } catch (error) {
      console.error('Error updating estimated hours:', error);
      toast.error("Failed to update estimated hours");
    }
  };

  const updateCompletionPercentage = async () => {
    if (completionPercentage < 0 || completionPercentage > 100) {
      toast.error("Completion percentage must be between 0 and 100");
      return;
    }

    try {
      // First update the ticket
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ 
          completion_percentage: completionPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (ticketError) throw ticketError;

      // If this is a task ticket, also update the task completion percentage
      if (ticket.task_id) {
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({ 
            completion_percentage: completionPercentage,
            last_activity_at: new Date().toISOString()
          })
          .eq('task_id', ticket.task_id);

        if (taskError) throw taskError;
      }

      toast.success("Completion percentage updated");
    } catch (error) {
      console.error('Error updating completion percentage:', error);
      toast.error("Failed to update completion percentage");
    }
  };
  
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
                      variant={safeStatus === status ? "default" : "outline"}
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
                      variant={safePriority === priority ? "default" : "outline"}
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

              {ticket.isTaskTicket && (
                <>
                  <div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="mt-2">
                          <PercentIcon className="h-3 w-3 mr-1" /> Update Task Completion
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Task Information</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="estimated-hours">Estimated Hours</Label>
                            <div className="flex space-x-2">
                              <Input 
                                id="estimated-hours"
                                type="number" 
                                step="0.5"
                                min="0"
                                value={estimatedHours || 0}
                                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                              />
                              <Button onClick={updateEstimatedHours}>Update</Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="completion-percentage">Completion Percentage</Label>
                            <div className="flex space-x-2">
                              <Input 
                                id="completion-percentage"
                                type="number" 
                                min="0"
                                max="100"
                                value={completionPercentage || 0}
                                onChange={(e) => setCompletionPercentage(parseFloat(e.target.value) || 0)}
                              />
                              <Button onClick={updateCompletionPercentage}>Update</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Setting completion to 100% will mark the task for review
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-semibold mb-2">Activity</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Created: {formatDate(ticket.created_at || '')}</span>
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
                        <div className="font-medium">{note.user} - {note.action || "commented"}</div>
                        <div className="text-gray-500 text-xs">{formatDate(note.timestamp)}</div>
                        <p className="mt-1">{note.comment || note.content || "No content"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">No notes yet.</p>
                )}
                
                <div className="mt-3">
                  <Textarea 
                    placeholder="Add a note..." 
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleAddNote}
                    disabled={isUpdatingNote || !noteText.trim()}
                  >
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
