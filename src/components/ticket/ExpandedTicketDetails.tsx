
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
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Ticket } from "@/types/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export interface ExpandedTicketDetailsProps {
  ticket: Ticket;
  onClose?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
  messages?: any[];
  onReply?: (message: any) => Promise<void>;
  onStatusChange?: (status: any) => Promise<void>;
  onPriorityChange?: (priority: any) => Promise<void>;
  onAssigneeChange?: (userId: any) => Promise<void>;
  users?: any[];
}

export const ExpandedTicketDetails: React.FC<ExpandedTicketDetailsProps> = ({
  ticket,
  onClose,
  onTicketAction = async () => {},
  onLogTime,
  userCanEditStatus = false,
  userCanEditDates = false,
  messages = [],
  onReply,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  users = []
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [newNote, setNewNote] = useState("");
  const [date, setDate] = useState<Date | undefined>(
    ticket.due_date ? new Date(ticket.due_date) : undefined
  );
  const [completionPercent, setCompletionPercent] = useState<number>(
    ticket.completion_percentage || 0
  );
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [isLoadingTimeEntries, setIsLoadingTimeEntries] = useState(false);

  const statusOptions = [
    { value: "new", label: "New" },
    { value: "in-progress", label: "In Progress" },
    { value: "blocked", label: "Blocked" },
    { value: "review", label: "Review" },
    { value: "done", label: "Done" },
    { value: "closed", label: "Closed" }
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" }
  ];

  useEffect(() => {
    if (ticket.id) {
      fetchTimeEntries(ticket.id);
    }
  }, [ticket.id]);

  const fetchTimeEntries = async (ticketId: string) => {
    setIsLoadingTimeEntries(true);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error fetching time entries:', error);
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
      return format(new Date(date), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return "Not set";
    try {
      return format(new Date(date), "PPP p");
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleStatusChange = async (value: string) => {
    if (onStatusChange) {
      await onStatusChange(value);
    } else {
      await onTicketAction(ticket.id, "updateStatus", value);
    }
  };

  const handlePriorityChange = async (value: string) => {
    if (onPriorityChange) {
      await onPriorityChange(value);
    } else {
      await onTicketAction(ticket.id, "updatePriority", value);
    }
  };

  const handleDueDateChange = async (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      await onTicketAction(ticket.id, "updateDueDate", selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleCompletionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setCompletionPercent(value);
    await onTicketAction(ticket.id, "updateCompletionPercentage", value);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    if (onReply) {
      await onReply(newNote);
    } else {
      await onTicketAction(ticket.id, "addNote", newNote);
    }
    
    setNewNote("");
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold">{ticket.title}</h2>
        <div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
          <TabsTrigger value="time-log">Time Log</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  />
                </PopoverContent>
              </Popover>
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <div className="p-3 bg-gray-50 rounded-md border min-h-[100px] whitespace-pre-wrap">
              {ticket.description || "No description provided."}
            </div>
          </div>

          {onLogTime && (
            <div className="pt-4">
              <Button onClick={() => onLogTime(ticket.id)}>
                <Clock className="h-4 w-4 mr-2" /> Log Time
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="conversation" className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md border mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Conversation is where you can discuss this ticket with other team members.
              Chat history is saved and visible to all team members.
            </p>
          </div>
          
          <div className="min-h-[200px] max-h-[300px] overflow-y-auto border rounded-md p-4 space-y-4">
            {ticket.notes && ticket.notes.length > 0 ? (
              ticket.notes.map((note) => (
                <div key={note.id} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{note.user}</span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(note.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{note.comment || note.content}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No conversation yet.</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              Add Comment
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="activity-log" className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md border">
            <p className="text-sm text-gray-500">
              Activity log shows all actions taken on this ticket.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="border-l-2 border-gray-200 pl-4 ml-2 space-y-6">
              <div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 -ml-[17px] mr-2"></div>
                  <span className="text-sm font-medium">Ticket Created</span>
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  {formatDateTime(ticket.created_at)}
                </span>
              </div>
              
              {ticket.notes && ticket.notes.length > 0 &&
                ticket.notes.map((note) => (
                  <div key={note.id}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 -ml-[17px] mr-2"></div>
                      <span className="text-sm font-medium">
                        {note.action || "Comment Added"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDateTime(note.timestamp)}
                    </span>
                    <p className="text-sm ml-2 mt-1">
                      {note.user}: {note.comment || note.content}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="time-log" className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md border">
            <p className="text-sm text-gray-500">
              Time log shows all time entries for this ticket.
            </p>
          </div>
          
          {isLoadingTimeEntries ? (
            <div className="p-4 text-center">Loading time entries...</div>
          ) : timeEntries.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No time entries recorded yet.</div>
          ) : (
            <div className="space-y-4">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="border rounded-md p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">
                      {entry.profiles?.first_name} {entry.profiles?.last_name}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Hours: <strong>{entry.hours_logged}</strong></span>
                    <span className="text-gray-500 text-sm">
                      {entry.start_time ? formatDateTime(entry.start_time) : "N/A"} - 
                      {entry.end_time ? formatDateTime(entry.end_time) : "N/A"}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="text-sm text-gray-700 mt-2">{entry.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {onLogTime && (
            <div className="pt-2">
              <Button onClick={() => onLogTime(ticket.id)}>
                <Clock className="h-4 w-4 mr-2" /> Log Time
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
