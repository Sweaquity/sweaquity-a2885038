
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PaperclipIcon, Clock, ArrowRight, Check, ChevronDown, ChevronUp, ClipboardList, Calendar } from "lucide-react";
import { format } from 'date-fns';
import { TicketDashboardProps } from '@/types/ticket';
import { Ticket } from '@/types/types';

export function TicketDashboard({
  initialTickets,
  onRefresh,
  onTicketAction,
  showTimeTracking = false,
  userId,
  onLogTime,
  expandedTickets = new Set(),
  toggleTicketExpansion,
  userCanEditDates = false,
  userCanEditStatus = false,
  renderTicketActions,
  loading = false
}: TicketDashboardProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [currentAttachmentUrl, setCurrentAttachmentUrl] = useState<string | null>(null);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    let color = 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'new':
      case 'todo':
      case 'backlog':
        color = 'bg-blue-100 text-blue-800';
        break;
      case 'in_progress':
      case 'in-progress':
        color = 'bg-yellow-100 text-yellow-800';
        break;
      case 'review':
        color = 'bg-purple-100 text-purple-800';
        break;
      case 'done':
      case 'closed':
        color = 'bg-green-100 text-green-800';
        break;
      case 'blocked':
        color = 'bg-red-100 text-red-800';
        break;
    }
    
    return (
      <Badge className={`${color} capitalize`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const handleViewAttachment = (attachmentUrl: string) => {
    setCurrentAttachmentUrl(attachmentUrl);
    setShowAttachmentDialog(true);
  };

  const hasAttachments = (ticket: Ticket) => {
    return ticket.attachments && Array.isArray(ticket.attachments) && ticket.attachments.length > 0;
  };

  const isExpanded = (ticketId: string) => {
    if (expandedTickets instanceof Set) {
      return expandedTickets.has(ticketId);
    } else if (typeof expandedTickets === 'object') {
      return expandedTickets[ticketId];
    }
    return false;
  };

  const handleToggleTicket = (ticketId: string) => {
    if (toggleTicketExpansion) {
      toggleTicketExpansion(ticketId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <ClipboardList className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No tickets found</h3>
          <p className="text-muted-foreground text-center mt-2">
            There are no tickets to display for this category.
          </p>
          <Button variant="outline" className="mt-4" onClick={onRefresh}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
            onClick={() => handleToggleTicket(ticket.id)}
          >
            <div className="flex-1">
              <div className="flex justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-base flex items-center">
                    {ticket.title}
                    {hasAttachments(ticket) && (
                      <PaperclipIcon className="h-4 w-4 ml-2 text-gray-400" />
                    )}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    {getStatusBadge(ticket.status)}
                    <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                    </span>
                    {ticket.ticket_type === 'beta_testing' && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                        Beta Testing
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  {isExpanded(ticket.id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {isExpanded(ticket.id) && (
            <CardContent className="border-t pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {ticket.description || "No description provided."}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Assigned To</h4>
                    <p className="text-sm text-gray-600">
                      {ticket.assigned_to === userId ? 'You' : (ticket.assigned_to || 'Unassigned')}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Created By</h4>
                    <p className="text-sm text-gray-600">
                      {ticket.reporter === userId ? 'You' : (ticket.reporter || 'Unknown')}
                    </p>
                  </div>
                  
                  {ticket.due_date && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Due Date</h4>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {format(new Date(ticket.due_date), 'PPP')}
                      </p>
                    </div>
                  )}
                  
                  {ticket.estimated_hours && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Estimated Hours</h4>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {ticket.estimated_hours} hours
                      </p>
                    </div>
                  )}
                </div>

                {/* Attachments section */}
                {hasAttachments(ticket) && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((url, index) => (
                        <Button 
                          key={index} 
                          variant="outline" 
                          size="sm"
                          className="flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAttachment(url);
                          }}
                        >
                          <PaperclipIcon className="h-4 w-4 mr-1" />
                          View Attachment {index + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {showTimeTracking && onLogTime && (
                  <div className="flex justify-end mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLogTime(ticket.id);
                      }}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Log Time
                    </Button>
                  </div>
                )}
                
                {renderTicketActions && renderTicketActions(ticket)}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Attachment Dialog */}
      <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Attachment</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col items-center">
            {currentAttachmentUrl && (
              <>
                {currentAttachmentUrl.toLowerCase().endsWith('.jpg') || 
                 currentAttachmentUrl.toLowerCase().endsWith('.jpeg') || 
                 currentAttachmentUrl.toLowerCase().endsWith('.png') || 
                 currentAttachmentUrl.toLowerCase().endsWith('.gif') ? (
                  <img 
                    src={currentAttachmentUrl} 
                    alt="Attachment" 
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-lg w-full">
                    <PaperclipIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="mb-4">This attachment may not be viewable in the browser.</p>
                    <Button 
                      variant="default" 
                      onClick={() => window.open(currentAttachmentUrl, '_blank')}
                    >
                      Download or Open in New Tab
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
