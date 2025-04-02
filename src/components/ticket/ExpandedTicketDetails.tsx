import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Clock, AlertCircle, Send, Image, User2, Trash, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Ticket } from "@/types/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TicketAttachmentsList, checkTicketAttachments } from "@/components/dashboard/TicketAttachmentsList";

const statusOptions = [
  { value: "new", label: "New" },
  { value: "in-progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "closed", label: "Closed" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

interface TimeEntry {
  id: string;
  ticket_id: string;
  hours_logged: number;
  description?: string;
  created_at: string;
  user_id?: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface ExpandedTicketDetailsProps {
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
  onTicketAction = async () => {},
  onLogTime,
  userCanEditStatus = true,
  userCanEditDates = true
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [newNote, setNewNote] = useState("");
  const [activityComment, setActivityComment] = useState("");
  const [conversationMessage, setConversationMessage] = useState("");
  const [date, setDate] = useState<Date | undefined>(
    ticket.due_date ? new Date(ticket.due_date) : undefined
  );
  const [completionPercent, setCompletionPercent] = useState<number>(
    ticket.completion_percentage || 0
  );
  const [estimatedHours, setEstimatedHours] = useState<number>(
    ticket.estimated_hours || 0
  );
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoadingTimeEntries, setIsLoadingTimeEntries] = useState(false);
  const [timeEntriesError, setTimeEntriesError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [hasAttachments, setHasAttachments] = useState(false);
  const [isCheckingAttachments, setIsCheckingAttachments] = useState(true);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  
  useEffect(() => {
    if (ticket.id) {
      fetchTimeEntries(ticket.id);
      checkForAttachments();
    }
  }, [ticket.id]);

  const checkForAttachments = async () => {
      setIsCheckingAttachments(true);
      
      // Check both storage-based attachments and attachments array
      const storageAttachmentsExist = await checkTicketAttachments(ticket.reporter, ticket.id);
      const hasAttachmentsArray = ticket.attachments && ticket.attachments.length > 0;
      
      setHasAttachments(storageAttachmentsExist || hasAttachmentsArray);
      setIsCheckingAttachments(false);
    };

  const handleAttachmentsLoaded = (hasAttachments: boolean) => {
    setHasAttachments(hasAttachments);
    setIsCheckingAttachments(false);
  };

  const fetchTimeEntries = async (ticketId: string) => {
    setIsLoadingTimeEntries(true);
    setTimeEntriesError(null);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const entriesWithUserDetails = await Promise.all((data || []).map(async (entry) => {
        if (entry.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', entry.user_id)
            .single();
            
          return {
            ...entry,
            profiles: profileData
          };
        }
        return entry;
      }));
      
      setTimeEntries(entriesWithUserDetails);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      setTimeEntriesError('Failed to load time entries. Please try again.');
    } finally {
      setIsLoadingTimeEntries(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    try {
      return format(parseISO(date), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return "Not set";
    try {
      return format(parseISO(date), "PPP p");
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleStatusChange = async (value: string) => {
    await onTicketAction(ticket.id, "updateStatus", value);
  };

  const handlePriorityChange = async (value: string) => {
    await onTicketAction(ticket.id, "updatePriority", value);
  };

  const handleDueDateChange = async (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      await onTicketAction(ticket.id, "updateDueDate", formattedDate);
    } else {
      await onTicketAction(ticket.id, "updateDueDate", null);
    }
  };

  const handleCompletionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setCompletionPercent(value);
    await onTicketAction(ticket.id, "updateCompletionPercentage", value);
  };

  const handleEstimatedHoursChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setEstimatedHours(value);
    await onTicketAction(ticket.id, "updateEstimatedHours", value);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    await onTicketAction(ticket.id, "addNote", newNote);
    setNewNote("");
  };
 
  const handleDeleteTicket = async () => {
    try {
      await onTicketAction(ticket.id, "deleteTicket", null);
      toast.success("Ticket deleted successfully");
      setConfirmDeleteOpen(false);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Failed to delete ticket");
    }
  };
  
  const handleOpenPreview = (url: string) => {
    setImagePreviewUrl(url);
    setPreviewOpen(true);
  };

  const handleDeleteAttachment = async (url: string) => {
    try {
      const isStorageUrl = url.includes('storage/v1');
      
      if (isStorageUrl) {
        // Extract path from storage URL
        const urlPath = url.split('/o/')[1];
        if (!urlPath) throw new Error("Invalid storage URL");
        
        const decodedPath = decodeURIComponent(urlPath);
        const { error } = await supabase.storage.from('ticket-attachments').remove([decodedPath]);
        
        if (error) throw error;
      }
      
      // Also remove from ticket attachments array
      if (ticket.attachments && ticket.attachments.length > 0) {
        const updatedAttachments = ticket.attachments.filter(a => a !== url);
        await onTicketAction(ticket.id, "updateAttachments", updatedAttachments);
      }
      
      toast.success("Attachment deleted successfully");
      checkForAttachments(); // Refresh attachments
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    }
  };
  
  const handleAddConversationMessage = async () => {
    if (!conversationMessage.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user?.id)
        .single();
      
      const userName = profileData ? 
        `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.email : 
        'User';
      
      const replies = Array.isArray(ticket.replies) ? [...ticket.replies] : [];
      
      const newReply = {
        id: Date.now().toString(),
        user: userName,
        timestamp: new Date().toISOString(),
        comment: conversationMessage
      };
      
      replies.push(newReply);
      
      await supabase
        .from('tickets')
        .update({ replies })
        .eq('id', ticket.id);
      
      toast.success("Message added to conversation");
      setConversationMessage("");
      await onTicketAction(ticket.id, "refreshTicket", null);
    } catch (error) {
      console.error("Error adding conversation message:", error);
      toast.error("Failed to add message");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAddActivityComment = async () => {
    if (!activityComment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user?.id)
        .single();
      
      const userName = profileData ? 
        `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.email : 
        'User';
      
      await supabase.from('ticket_comments').insert({
        ticket_id: ticket.id,
        user_id: user?.id,
        content: activityComment
      });
      
      toast.success("Comment added to activity log");
      setActivityComment("");
      await onTicketAction(ticket.id, "refreshTicket", null);
    } catch (error) {
      console.error("Error adding activity comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const renderDetailsSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <Select
          value={ticket.status}
          disabled={!userCanEditStatus}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className={getStatusColor(ticket.status)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Priority</label>
        <Select
          value={ticket.priority}
          disabled={!userCanEditStatus}
          onValueChange={handlePriorityChange}
        >
          <SelectTrigger className={getPriorityColor(ticket.priority)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Due Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
              disabled={!userCanEditDates}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "No date selected"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDueDateChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Estimated Hours</label>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            min="0"
            step="0.5"
            value={estimatedHours}
            onChange={handleEstimatedHoursChange}
            disabled={!userCanEditDates}
            className="w-20"
          />
          <span>hrs</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Completion</label>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            min="0"
            max="100"
            value={completionPercent}
            onChange={handleCompletionChange}
            disabled={!userCanEditStatus}
            className="w-20"
          />
          <span>%</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium mb-1">Description</label>
        <div className="p-3 bg-gray-50 rounded-md border min-h-[100px] whitespace-pre-wrap">
          {ticket.description || "No description provided."}
        </div>
      </div>

      {onLogTime && (
        <div className="col-span-2 pt-4">
          <Button onClick={() => onLogTime(ticket.id)}>
            <Clock className="h-4 w-4 mr-2" /> Log Time
          </Button>
        </div>
      )}
    </div>
  );

  const renderActivitySection = () => (
    <div className="p-4 space-y-4">
      <ScrollArea className="h-[400px] w-full rounded-md border">
        <div className="space-y-4 p-4">
          {ticket.notes && ticket.notes.length > 0 ? (
            ticket.notes.map((note, index) => (
              <div key={index} className="border rounded-md p-3">
                <div className="flex items-center text-sm text-muted-foreground space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDateTime(note.timestamp)}</span>
                  <User2 className="h-4 w-4" />
                  <span>{note.user}</span>
                </div>
                <div className="text-sm mt-2">
                  {note.action ? (
                    <span className="font-medium">{note.action}: </span>
                  ) : null}
                  {note.comment || note.content}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No activity recorded.</div>
          )}
        </div>
      </ScrollArea>

      <div className="space-y-2">
        <Textarea 
          placeholder="Add a note..." 
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <Button 
          onClick={handleAddNote}
          disabled={!newNote.trim()}
        >
          Add Note
        </Button>
      </div>
    </div>
  );

  const renderAttachmentsSection = () => (
    <div className="p-4 space-y-4">
      {ticket.reporter ? (
        <TicketAttachmentsList
          reporterId={ticket.reporter}
          ticketId={ticket.id}
          onAttachmentsLoaded={handleAttachmentsLoaded}
          onViewAttachment={handleOpenPreview}
          onDeleteAttachment={handleDeleteAttachment}
        />
      ) : (
        <div className="text-sm text-gray-500 py-4">
          No attachments found for this ticket.
        </div>
      )}

      {/* Display direct attachments from ticket record */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-medium">Additional Screenshots ({ticket.attachments.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ticket.attachments.map((url, index) => (
              <div 
                key={`attachment-${index}`} 
                className="border rounded-md p-2 flex flex-col gap-1"
              >
                <div 
                  className="aspect-square bg-gray-100 rounded flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => handleOpenPreview(url)}
                >
                  <img 
                    src={url} 
                    alt={`Screenshot ${index + 1}`} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-xs truncate" title={`Screenshot ${index + 1}`}>
                  Screenshot {index + 1}
                </div>
                <div className="flex gap-1 mt-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7 flex-1"
                    onClick={() => handleOpenPreview(url)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => window.open(url, '_blank')}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7 text-red-500"
                    onClick={() => handleDeleteAttachment(url)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTimeLogSection = () => (
    <div className="space-y-4 p-4">
      <div className="bg-gray-50 p-4 rounded-md border mb-4">
        <p className="text-sm text-gray-500 mb-2">
          Time Log shows all time entries recorded for this ticket.
        </p>
      </div>
      
      {isLoadingTimeEntries ? (
        <div className="flex justify-center p-8">
          <p>Loading time entries...</p>
        </div>
      ) : timeEntriesError ? (
        <div className="flex items-center justify-center p-8 bg-red-50 rounded-md border border-red-200">
          <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
          <p className="text-red-700">{timeEntriesError}</p>
        </div>
      ) : (
        <div>
          {timeEntries.length === 0 ? (
            <div className="text-center text-gray-500 py-8 border rounded-md">
              <p>No time entries found for this ticket.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.profiles ? 
                          `${entry.profiles.first_name || ''} ${entry.profiles.last_name || ''}`.trim() || entry.profiles.email : 
                          'Unknown user'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.hours_logged.toFixed(2)} hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {entry.description || 'No description'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {onLogTime && (
            <div className="mt-4">
              <Button onClick={() => onLogTime(ticket.id)}>
                <Clock className="h-4 w-4 mr-2" /> Log Time
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderConversationSection = () => (
    <div className="space-y-4 p-4">
      <div className="bg-gray-50 p-4 rounded-md border mb-4">
        <p className="text-sm text-gray-500">
          Use this tab to communicate with others about this ticket.
        </p>
      </div>
      
      <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto space-y-3">
        {Array.isArray(ticket.replies) && ticket.replies.length > 0 ? (
          ticket.replies.map((reply, index) => (
            <div key={index} className="p-3 bg-white border rounded-md shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">{reply.user}</span>
                <span className="text-xs text-gray-500">
                  {formatDateTime(reply.timestamp)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{reply.comment}</p>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No conversation messages yet.
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-2 mt-4">
        <div className="flex-1">
          <Textarea
            placeholder="Type your message here..."
            value={conversationMessage}
            onChange={(e) => setConversationMessage(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>
        <Button 
          onClick={handleAddConversationMessage}
          disabled={!conversationMessage.trim() || isSubmittingComment}
          size="sm"
          className="h-10"
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container max-w-4xl h-full py-6">
        <div className="bg-background rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
          <div className="flex flex-row items-center justify-between p-4 border-b">
            <h2 className="text-2xl font-bold">{ticket.title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="details">
              <TabsList className="p-4 border-b w-full justify-start">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="conversation">Conversation</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="time-log">Time Log</TabsTrigger>
                {(hasAttachments || isCheckingAttachments || (ticket.attachments && ticket.attachments.length > 0)) && (
                  <TabsTrigger value="attachments">
                    <div className="flex items-center">
                      <Image className="h-4 w-4 mr-1" />
                      Attachments
                      {isCheckingAttachments && (
                        <span className="ml-1 h-3 w-3 rounded-full bg-gray-200 animate-pulse"></span>
                      )}
                    </div>
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="details">
                {renderDetailsSection()}
              </TabsContent>
              
              <TabsContent value="conversation">
                {renderConversationSection()}
              </TabsContent>
              
              <TabsContent value="activity">
                {renderActivitySection()}
              </TabsContent>
              
              <TabsContent value="time-log">
                {renderTimeLogSection()}
              </TabsContent>
              
              <TabsContent value="attachments">
                {renderAttachmentsSection()}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Delete Ticket</h3>
            <p className="mb-6">Are you sure you want to delete this ticket? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteTicket}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Dialog */}
      {previewOpen && imagePreviewUrl && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background rounded-lg shadow-lg p-4 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Image Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </div>
            <div className="relative max-h-[70vh] overflow-hidden flex justify-center">
              <img 
                src={imagePreviewUrl} 
                alt="Preview" 
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => window.open(imagePreviewUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteAttachment(imagePreviewUrl);
                  setPreviewOpen(false);
                }}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpandedTicketDetails;
