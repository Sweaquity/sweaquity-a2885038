
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketMessage } from "@/types/dashboard";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock, MessageCircle, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExpandedTicketDetailsProps {
  ticket: any;
  messages: TicketMessage[];
  onReply: (message: string) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange?: (priority: string) => void;
  onAssigneeChange?: (userId: string) => void;
  users?: Array<{id: string, first_name: string, last_name: string, email: string}>;
  projects?: Array<{project_id: string, title: string}>;
  tasks?: Array<{task_id: string, title: string}>;
}

export const ExpandedTicketDetails = ({
  ticket,
  messages,
  onReply,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  users = [],
  projects = [],
  tasks = []
}: ExpandedTicketDetailsProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date helpers
  const formatMessageDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Status options for ticket
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  // Helper functions for displaying status information (from TicketsList)
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'done':
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render health indicator (from TicketList)
  const renderHealthIndicator = (health: string) => {
    const colors = {
      red: 'bg-red-500',
      amber: 'bg-yellow-500',
      green: 'bg-green-500'
    };
    
    return (
      <span 
        className={`inline-block w-3 h-3 rounded-full ${colors[health as keyof typeof colors] || 'bg-gray-500'}`} 
        title={`Health: ${health}`}
      />
    );
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {ticket.health && renderHealthIndicator(ticket.health)}
            <CardTitle>{ticket.title}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(ticket.status)}>
              {getStatusIcon(ticket.status)}
              <span className="ml-1">{ticket.status}</span>
            </Badge>
            <Badge className={getPriorityColor(ticket.priority)}>
              {ticket.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="mb-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <h3 className="text-sm font-medium mb-2">Ticket Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Select
                      value={ticket.status}
                      onValueChange={onStatusChange}
                    >
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Priority:</span>
                    <Select
                      value={ticket.priority}
                      onValueChange={onPriorityChange}
                      disabled={!onPriorityChange}
                    >
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {onAssigneeChange && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Assigned to:</span>
                      <Select
                        value={ticket.assigned_to || ''}
                        onValueChange={onAssigneeChange}
                      >
                        <SelectTrigger className="w-32 h-7 text-xs">
                          <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.first_name} {user.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {ticket.health && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Health:</span>
                      <div className="flex items-center gap-1">
                        {renderHealthIndicator(ticket.health)}
                        <span className="text-sm">{ticket.health}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Related Information</h3>
                <div className="space-y-2">
                  {ticket.created_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created:</span>
                      <span className="text-sm">{formatDate(ticket.created_at)}</span>
                    </div>
                  )}
                  
                  {ticket.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Updated:</span>
                      <span className="text-sm">{formatDate(ticket.updated_at)}</span>
                    </div>
                  )}
                  
                  {ticket.due_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Due Date:</span>
                      <span className="text-sm">{formatDate(ticket.due_date)}</span>
                    </div>
                  )}
                  
                  {ticket.estimated_hours !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Est. Hours:</span>
                      <span className="text-sm">{ticket.estimated_hours}</span>
                    </div>
                  )}
                  
                  {ticket.project && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Project:</span>
                      <span className="text-sm">{ticket.project.title}</span>
                    </div>
                  )}
                  
                  {ticket.task && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Task:</span>
                      <span className="text-sm">{ticket.task.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="conversation">
            {/* Message thread */}
            <div className="space-y-4 mb-4">
              {messages && messages.length > 0 ? (
                messages.map((message, index) => (
                  <div key={message.id || index} className="flex gap-3 pb-3 border-b border-gray-100">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.sender?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                      {message.sender?.avatar && (
                        <AvatarImage src={message.sender.avatar} />
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">
                          {message.sender?.name || 'User'}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{message.message || message.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              )}
            </div>

            {/* Reply form */}
            <form onSubmit={handleSubmit} className="space-y-2 pt-2">
              <Textarea
                placeholder="Type your message here..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  type="submit"
                  disabled={isSubmitting || !newMessage.trim()}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {isSubmitting ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="activity">
            <div className="max-h-80 overflow-y-auto">
              {ticket.notes && Array.isArray(ticket.notes) && ticket.notes.length > 0 ? (
                <div className="space-y-2">
                  {ticket.notes.map((note: any, index: number) => (
                    <div key={index} className="py-2 border-b border-gray-100">
                      <div className="flex justify-between">
                        <span className="font-medium text-sm">
                          {note.type === 'status_change' ? 'Status changed' :
                          note.type === 'priority_change' ? 'Priority changed' :
                          note.type === 'assignee_change' ? 'Assignee changed' :
                          note.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {note.from !== undefined && note.to !== undefined && (
                        <div className="text-xs text-muted-foreground mt-1">
                          From <span className="font-medium">{note.from || 'none'}</span> to <span className="font-medium">{note.to || 'none'}</span>
                        </div>
                      )}
                      {note.message && (
                        <p className="mt-1 text-sm">{note.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity recorded.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
