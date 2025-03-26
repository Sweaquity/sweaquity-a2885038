
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MessageSquare, ClipboardList, CalendarIcon, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Accept optional onClose prop to make it reusable for dialogs
interface ExpandedTicketDetailsProps {
  ticket: any;
  onClose?: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
}

export const ExpandedTicketDetails: React.FC<ExpandedTicketDetailsProps> = ({
  ticket,
  onClose,
  onTicketAction,
  onLogTime,
  userCanEditStatus = true,
  userCanEditDates = true
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [replyText, setReplyText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(ticket.status);
  const [selectedPriority, setSelectedPriority] = useState(ticket.priority);
  const [estimatedHours, setEstimatedHours] = useState(ticket.estimated_hours || 0);
  const [completionPercentage, setCompletionPercentage] = useState(ticket.completion_percentage || 0);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    ticket.due_date ? new Date(ticket.due_date) : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedStatus(ticket.status);
    setSelectedPriority(ticket.priority);
    setEstimatedHours(ticket.estimated_hours || 0);
    setCompletionPercentage(ticket.completion_percentage || 0);
    setDueDate(ticket.due_date ? new Date(ticket.due_date) : undefined);
  }, [ticket]);

  const handleStatusChange = async () => {
    if (selectedStatus === ticket.status) return;
    setIsSubmitting(true);
    try {
      await onTicketAction(ticket.id, "updateStatus", selectedStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriorityChange = async () => {
    if (selectedPriority === ticket.priority) return;
    setIsSubmitting(true);
    try {
      await onTicketAction(ticket.id, "updatePriority", selectedPriority);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEstimatedHours = async () => {
    if (estimatedHours === ticket.estimated_hours) return;
    setIsSubmitting(true);
    try {
      await onTicketAction(ticket.id, "updateEstimatedHours", estimatedHours);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCompletionPercentage = async () => {
    if (completionPercentage === ticket.completion_percentage) return;
    setIsSubmitting(true);
    try {
      await onTicketAction(ticket.id, "updateCompletionPercentage", completionPercentage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDueDate = async (date: Date | undefined) => {
    if (!date) return;
    setDueDate(date);
    const formattedDate = format(date, "yyyy-MM-dd");
    setIsSubmitting(true);
    try {
      await onTicketAction(ticket.id, "updateDueDate", formattedDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await onTicketAction(ticket.id, "addReply", replyText);
      setReplyText("");
      setActiveTab("conversation"); // Switch to conversation tab after sending
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new": return "New";
      case "in-progress": return "In Progress";
      case "blocked": return "Blocked";
      case "review": return "In Review";
      case "done": return "Done";
      case "closed": return "Closed";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "in-progress": return "bg-yellow-100 text-yellow-800";
      case "blocked": return "bg-red-100 text-red-800";
      case "review": return "bg-purple-100 text-purple-800";
      case "done": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-blue-100 text-blue-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{ticket.title}</CardTitle>
              <CardDescription>Ticket ID: {ticket.id.split("-")[0]}</CardDescription>
            </div>
            {onClose && (
              <Button variant="ghost" onClick={onClose} size="sm">
                Close
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">
                <ClipboardList className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="conversation">
                <MessageSquare className="h-4 w-4 mr-2" />
                Conversation
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Clock className="h-4 w-4 mr-2" />
                Activity Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Status</h3>
                  <div className="flex items-center">
                    {userCanEditStatus ? (
                      <div className="w-full">
                        <select
                          className={`px-3 py-1 rounded text-sm w-full border ${getStatusColor(selectedStatus)}`}
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          onBlur={handleStatusChange}
                        >
                          <option value="new">New</option>
                          <option value="in-progress">In Progress</option>
                          <option value="blocked">Blocked</option>
                          <option value="review">In Review</option>
                          <option value="done">Done</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    ) : (
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusLabel(ticket.status)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Priority</h3>
                  <div className="flex items-center">
                    {userCanEditStatus ? (
                      <div className="w-full">
                        <select
                          className={`px-3 py-1 rounded text-sm w-full border ${getPriorityColor(selectedPriority)}`}
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value)}
                          onBlur={handlePriorityChange}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    ) : (
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Due Date</h3>
                  {userCanEditDates ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "No due date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={handleUpdateDueDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="text-sm">
                      {ticket.due_date ? formatDate(ticket.due_date) : "No due date set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Estimated Hours</h3>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                      onBlur={handleUpdateEstimatedHours}
                      className="w-20"
                    />
                    <span className="text-sm">hours</span>
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <h3 className="text-sm font-medium">Completion Percentage</h3>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={completionPercentage}
                      onChange={(e) => setCompletionPercentage(parseInt(e.target.value) || 0)}
                      onBlur={handleUpdateCompletionPercentage}
                      className="w-20"
                    />
                    <span className="text-sm">%</span>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <h3 className="text-sm font-medium">Description</h3>
                  <div className="text-sm p-3 border rounded bg-gray-50">
                    {ticket.description || "No description provided."}
                  </div>
                </div>

                {ticket.reproduction_steps && (
                  <div className="col-span-2 space-y-2">
                    <h3 className="text-sm font-medium">Steps to Reproduce</h3>
                    <div className="text-sm p-3 border rounded bg-gray-50">
                      {ticket.reproduction_steps}
                    </div>
                  </div>
                )}

                {onLogTime && (
                  <div className="col-span-2 mt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => onLogTime(ticket.id)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Log Time
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="conversation" className="space-y-4">
              <div className="border rounded-lg p-4 max-h-80 overflow-y-auto space-y-4">
                {(!ticket.replies || ticket.replies.length === 0) && (
                  <div className="text-center text-gray-500 py-8">
                    No conversation yet. Send a message to start.
                  </div>
                )}

                {ticket.replies && ticket.replies.map((reply: any, index: number) => (
                  <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{reply.sender?.name || "User"}</div>
                      <div className="text-xs text-gray-500">
                        {reply.createdAt ? formatDate(reply.createdAt) : "Unknown date"}
                      </div>
                    </div>
                    <div className="text-sm">{reply.content}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment or update..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleSendReply} 
                  disabled={isSubmitting || !replyText.trim()}
                  className="w-full"
                >
                  {isSubmitting ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="border rounded-lg p-4 max-h-80 overflow-y-auto space-y-4">
                {(!ticket.notes || ticket.notes.length === 0) && (
                  <div className="text-center text-gray-500 py-8">
                    No activity log entries yet.
                  </div>
                )}

                {ticket.notes && ticket.notes.map((note: any, index: number) => (
                  <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{note.user || "System"}</div>
                      <div className="text-xs text-gray-500">
                        {note.timestamp ? formatDate(note.timestamp) : "Unknown date"}
                      </div>
                    </div>
                    <div className="text-sm">{note.comment}</div>
                  </div>
                ))}

                {ticket.time_entries && ticket.time_entries.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Time Entries</h4>
                    {ticket.time_entries.map((entry: any, index: number) => (
                      <div key={index} className="border-b last:border-b-0 pb-2 last:pb-0 mb-2 last:mb-0 text-sm">
                        <div className="flex justify-between">
                          <span>{entry.hours_logged} hours</span>
                          <span className="text-gray-500 text-xs">
                            {entry.start_time ? formatDate(entry.start_time) : "Unknown date"}
                          </span>
                        </div>
                        <div className="text-gray-600">{entry.description || "No description"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
