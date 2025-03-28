
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Clock, Calendar, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { ExpandedTicketDetailsProps } from "@/types/types";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export const ExpandedTicketDetails: React.FC<ExpandedTicketDetailsProps> = ({
  ticket,
  onClose,
  onTicketAction,
  onLogTime,
  userCanEditStatus = false,
  userCanEditDates = false
}) => {
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState<number>(ticket.completion_percentage || 0);
  const [estimatedHours, setEstimatedHours] = useState<number>(ticket.estimated_hours || 0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    ticket.due_date ? new Date(ticket.due_date) : undefined
  );

  useEffect(() => {
    setCompletionPercentage(ticket.completion_percentage || 0);
    setEstimatedHours(ticket.estimated_hours || 0);
    setSelectedDate(ticket.due_date ? new Date(ticket.due_date) : undefined);
  }, [ticket]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !onTicketAction) return;
    
    setIsAddingNote(true);
    await onTicketAction(ticket.id, 'addNote', newNote.trim());
    setNewNote("");
    setIsAddingNote(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (onTicketAction) {
      await onTicketAction(ticket.id, 'updateStatus', newStatus);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (onTicketAction) {
      await onTicketAction(ticket.id, 'updatePriority', newPriority);
    }
  };

  const handleDueDateChange = async (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onTicketAction) {
      // Format date as ISO string for database compatibility
      const formattedDate = date.toISOString().split('T')[0];
      await onTicketAction(ticket.id, 'updateDueDate', formattedDate);
    }
  };

  const handleCompletionChange = async (value: number[]) => {
    setCompletionPercentage(value[0]);
    if (onTicketAction) {
      await onTicketAction(ticket.id, 'updateCompletionPercentage', value[0]);
    }
  };

  const handleEstimatedHoursChange = async () => {
    if (onTicketAction) {
      await onTicketAction(ticket.id, 'updateEstimatedHours', estimatedHours);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy h:mm a");
    } catch (error) {
      return timestamp;
    }
  };

  const handleLogTimeClick = () => {
    if (onLogTime) {
      onLogTime(ticket.id);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "todo":
      case "backlog":
        return "bg-gray-100 text-gray-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "review":
      case "in review":
        return "bg-yellow-100 text-yellow-800";
      case "done":
      case "closed":
        return "bg-green-100 text-green-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{ticket.title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => onClose && onClose()}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Status</h3>
              {userCanEditStatus ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleStatusChange("todo")}>
                      <Badge variant="outline" className={getStatusColor("todo")}>
                        Todo
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("in progress")}>
                      <Badge variant="outline" className={getStatusColor("in progress")}>
                        In Progress
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("review")}>
                      <Badge variant="outline" className={getStatusColor("review")}>
                        Review
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("done")}>
                      <Badge variant="outline" className={getStatusColor("done")}>
                        Done
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("blocked")}>
                      <Badge variant="outline" className={getStatusColor("blocked")}>
                        Blocked
                      </Badge>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Priority</h3>
              {userCanEditStatus ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handlePriorityChange("low")}>
                      <Badge variant="outline" className={getPriorityColor("low")}>
                        Low
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePriorityChange("medium")}>
                      <Badge variant="outline" className={getPriorityColor("medium")}>
                        Medium
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePriorityChange("high")}>
                      <Badge variant="outline" className={getPriorityColor("high")}>
                        High
                      </Badge>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Due Date</h3>
              {userCanEditDates ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {selectedDate ? format(selectedDate, "PPP") : "Set due date"}
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDueDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="flex items-center h-10 px-4 border rounded-md">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {ticket.due_date ? format(new Date(ticket.due_date), "PPP") : "Not set"}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <div className="p-4 border rounded-md">
              {ticket.description ? (
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              ) : (
                <p className="text-muted-foreground">No description provided</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Completion</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{completionPercentage}% complete</span>
                {userCanEditStatus && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCompletionChange([100])}
                  >
                    Mark as Complete
                  </Button>
                )}
              </div>
              {userCanEditStatus ? (
                <Slider
                  value={[completionPercentage]}
                  max={100}
                  step={5}
                  onValueCommit={handleCompletionChange}
                />
              ) : (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Estimated Hours</h3>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  min="0"
                  step="0.5"
                  className="w-20"
                  disabled={!userCanEditStatus}
                />
                {userCanEditStatus && (
                  <Button onClick={handleEstimatedHoursChange}>
                    Update
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Hours Logged</h3>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-2 border rounded-md">
                  {ticket.hours_logged || 0} hours
                </span>
                {onLogTime && (
                  <Button onClick={handleLogTimeClick}>
                    <Clock className="h-4 w-4 mr-2" />
                    Log Time
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Notes & Activity</h3>
            </div>
            <div className="border rounded-md">
              <div className="max-h-[200px] overflow-y-auto p-4 space-y-4">
                {(ticket.notes || []).length === 0 ? (
                  <p className="text-muted-foreground">No notes or activity yet</p>
                ) : (
                  (ticket.notes || []).map((note: any) => (
                    <div key={note.id} className="border-b pb-2 last:border-0">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{note.user}</span>
                        <span className="text-muted-foreground">
                          {formatTimestamp(note.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1">{note.comment}</p>
                    </div>
                  ))
                )}
              </div>
              {onTicketAction && (
                <div className="p-4 border-t">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="mb-2"
                  />
                  <Button 
                    onClick={handleAddNote} 
                    disabled={!newNote.trim() || isAddingNote}
                  >
                    Add Note
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
