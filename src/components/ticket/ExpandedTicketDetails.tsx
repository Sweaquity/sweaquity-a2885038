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
import { CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Ticket } from "@/types/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface TimeEntry {
  id: string;
  ticket_id: string;
  hours_logged: number;
  description?: string;
  created_at: string;
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

  useEffect(() => {
    if (ticket.id) {
      fetchTimeEntries(ticket.id);
    }
  }, [ticket.id]);

  const fetchTimeEntries = async (ticketId: string) => {
    setIsLoadingTimeEntries(true);
    setTimeEntriesError(null);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*, profiles(first_name, last_name, email)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setTimeEntries(data || []);
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
    await onTicketAction(ticket.id, "updateStatus", value);
  };

  const handlePriorityChange = async (value: string) => {
    await onTicketAction(ticket.id, "updatePriority", value);
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
              ticket.notes.map((note: any, index: number) => (
                <div key={note.id || index} className="border-b pb-3">
                  <div className="flex justify-between">
                    <p className="font-medium">{note.user}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(note.timestamp)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm">{note.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                No conversation history yet.
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            <Textarea
              placeholder="Add a note or comment..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              Add
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="activity-log" className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md border mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Activity Log shows a record of all changes and updates made to this ticket.
              It's useful for tracking the history and progress.
            </p>
          </div>
          
          <div className="min-h-[200px] border rounded-md p-4">
            <p className="text-center text-gray-500 py-8">
              Activity log is being implemented.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="time-log" className="space-y-4">
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
                              `${entry.profiles.first_name || ''} ${entry.profiles.last_name || ''}`.trim() : 
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
