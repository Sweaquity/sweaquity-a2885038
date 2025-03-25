
import React, { useState } from "react";
import { Ticket } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, MessageSquare, Clock, Edit, Save, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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
  const [isEditingEstimatedHours, setIsEditingEstimatedHours] = useState(false);
  const [isEditingCompletion, setIsEditingCompletion] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(ticket.due_date || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      setIsUpdatingNote(true);

      // Create a new note object
      const newNote = {
        id: Date.now().toString(),
        user: "Current User", // Ideally, get the current user's name
        timestamp: new Date().toISOString(),
        action: "commented",
        comment: noteText
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
      setIsSaving(true);
      
      // Update the ticket
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ 
          estimated_hours: estimatedHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (ticketError) {
        console.error("Error updating ticket:", ticketError);
        throw ticketError;
      }
      
      // If this is a task ticket, also update the task's estimated hours
      if (ticket.task_id) {
        try {
          // Find the job app ID associated with this task/ticket
          const { data: jobAppData } = await supabase
            .from('job_applications')
            .select('job_app_id')
            .eq('task_id', ticket.task_id)
            .maybeSingle();
            
          if (jobAppData?.job_app_id) {
            // Update project_sub_tasks view
            const { error: projectError } = await supabase
              .from('project_sub_tasks')
              .update({ estimated_hours: estimatedHours })
              .eq('task_id', ticket.task_id);
                
            if (projectError) {
              console.error("Error updating task:", projectError);
              // Continue execution even if this fails
            }
            
            // Update jobseeker_active_projects
            const { error: jsError } = await supabase
              .from('jobseeker_active_projects')
              .update({ estimated_hours: estimatedHours })
              .eq('task_id', ticket.task_id);
                
            if (jsError) {
              console.error("Error updating jobseeker project:", jsError);
              // Continue execution even if this fails
            }
          }
        } catch (e) {
          console.error("Error updating associated tables:", e);
          // Don't fail if this secondary update fails
        }
      }

      toast.success("Estimated hours updated");
      setIsEditingEstimatedHours(false);
    } catch (error) {
      console.error('Error updating estimated hours:', error);
      toast.error("Failed to update estimated hours");
    } finally {
      setIsSaving(false);
    }
  };

  const updateCompletionPercentage = async () => {
    if (completionPercentage < 0 || completionPercentage > 100) {
      toast.error("Completion percentage must be between 0 and 100");
      return;
    }

    try {
      setIsSaving(true);
      
      // Update the ticket
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ 
          completion_percentage: completionPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (ticketError) {
        console.error("Error updating ticket:", ticketError);
        toast.error("Failed to update ticket completion percentage");
        return;
      }

      // If this is a task ticket, also update the task completion percentage
      if (ticket.task_id) {
        try {
          const { error: taskError } = await supabase
            .from('project_sub_tasks')
            .update({ 
              completion_percentage: completionPercentage,
              last_activity_at: new Date().toISOString()
            })
            .eq('task_id', ticket.task_id);

          if (taskError) {
            console.error("Error updating task completion:", taskError);
            // Continue execution even if this fails
          }
          
          // Update jobseeker_active_projects
          const { error: jsError } = await supabase
            .from('jobseeker_active_projects')
            .update({ completion_percentage: completionPercentage })
            .eq('task_id', ticket.task_id);
              
          if (jsError) {
            console.error("Error updating jobseeker project completion:", jsError);
            // Continue execution even if this fails
          }
        } catch (e) {
          console.error("Error updating task completion:", e);
          // Don't fail if this secondary update fails
        }
      }

      toast.success("Task/Ticket Completion updated");
      setIsEditingCompletion(false);
    } catch (error) {
      console.error('Error updating completion percentage:', error);
      toast.error("Failed to update completion percentage");
    } finally {
      setIsSaving(false);
    }
  };
  
  const updateDueDate = async () => {
    try {
      setIsSaving(true);
      
      // Call the parent component's onDueDateChange
      onDueDateChange(ticket.id, dueDate);
      
      // If this is a task ticket, also update jobseeker_active_projects
      if (ticket.task_id) {
        try {
          const { error: jsError } = await supabase
            .from('jobseeker_active_projects')
            .update({ due_date: dueDate })
            .eq('task_id', ticket.task_id);
              
          if (jsError) {
            console.error("Error updating jobseeker project due date:", jsError);
            // Continue execution even if this fails
          }
        } catch (e) {
          console.error("Error updating due date:", e);
          // Don't fail if this secondary update fails
        }
      }
      
      setIsEditingDueDate(false);
      toast.success("Due date updated");
    } catch (error) {
      console.error('Error updating due date:', error);
      toast.error("Failed to update due date");
    } finally {
      setIsSaving(false);
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
                  {isEditingDueDate ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="date" 
                        value={dueDate || ''} 
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-40 h-8 text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2" 
                        onClick={updateDueDate}
                        disabled={isSaving}
                      >
                        {isSaving ? 
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" /> : 
                          <Save className="h-3 w-3" />
                        }
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-2" 
                        onClick={() => setIsEditingDueDate(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer"
                        onClick={() => setIsEditingDueDate(true)}
                      >
                        {ticket.due_date ? formatDate(ticket.due_date) : 'Set date'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Estimated Hours</p>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  {isEditingEstimatedHours ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={estimatedHours || 0}
                        onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2" 
                        onClick={updateEstimatedHours}
                        disabled={isSaving}
                      >
                        {isSaving ? 
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" /> : 
                          <Save className="h-3 w-3" />
                        }
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-2" 
                        onClick={() => setIsEditingEstimatedHours(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer"
                      onClick={() => setIsEditingEstimatedHours(true)}
                    >
                      {estimatedHours || 0}h
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Task/Ticket Completion</p>
                <div className="flex items-center mt-1">
                  {isEditingCompletion ? (
                    <div className="flex items-center gap-2 ml-6">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={completionPercentage || 0}
                        onChange={(e) => setCompletionPercentage(parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2" 
                        onClick={updateCompletionPercentage}
                        disabled={isSaving}
                      >
                        {isSaving ? 
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" /> : 
                          <Save className="h-3 w-3" />
                        }
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-2" 
                        onClick={() => setIsEditingCompletion(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer ml-6"
                      onClick={() => setIsEditingCompletion(true)}
                    >
                      {completionPercentage || 0}%
                    </Badge>
                  )}
                </div>
              </div>
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
