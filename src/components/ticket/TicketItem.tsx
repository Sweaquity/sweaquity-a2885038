import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Clock } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TicketActionBar } from "@/components/ticket/TicketActionBar";
import { Ticket } from "@/types/types";

interface TicketItemProps {
  ticket: Ticket;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  onLogTime?: () => void;
  customActions?: React.ReactNode;
  userCanEditDates?: boolean;
  showEstimatedHours?: boolean;
}

export const TicketItem = ({
  ticket,
  isExpanded,
  onToggleExpand,
  onTicketAction,
  showTimeTracking = false,
  onLogTime,
  customActions,
  userCanEditDates = true,
  showEstimatedHours = false
}: TicketItemProps) => {
  return (
    <Card className="overflow-hidden">
      <div 
        className={`p-4 cursor-pointer ${
          ticket.priority === 'high' ? 'border-l-4 border-l-red-500' : 
          ticket.priority === 'medium' ? 'border-l-4 border-l-yellow-500' : 
          'border-l-4 border-l-blue-500'
        }`} 
        onClick={onToggleExpand}
      >
        <div className="flex justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">
                {ticket.title}
              </h3>
              <Badge variant={
                ticket.status === 'done' || ticket.status === 'closed' ? 'success' :
                ticket.status === 'in-progress' ? 'secondary' : 
                ticket.status === 'blocked' ? 'destructive' : 
                ticket.status === 'review' ? 'warning' : 'default'
              }>
                {ticket.status}
              </Badge>
              <Badge variant="outline">{ticket.ticket_type || ticket.type || "task"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {ticket.description}
            </p>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      <Collapsible open={isExpanded}>
        <CollapsibleContent className="p-4 pt-0 border-t">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Priority</Label>
                <div className="font-medium">
                  <Badge variant={
                    ticket.priority === 'high' ? 'destructive' :
                    ticket.priority === 'medium' ? 'warning' : 'default'
                  }>
                    {ticket.priority || 'medium'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <div className="font-medium">
                  {ticket.due_date ? new Date(ticket.due_date).toLocaleDateString() : 'Not set'}
                </div>
              </div>
              <div>
                <Label className="text-xs">Completion</Label>
                <div className="flex items-center gap-2">
                  <Progress value={ticket.completion_percentage || 0} className="h-2 w-20" />
                  <span className="text-sm">{ticket.completion_percentage || 0}%</span>
                </div>
              </div>
              {showEstimatedHours && (
                <div>
                  <Label className="text-xs">Estimated Hours</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      className="w-20 h-8" 
                      value={ticket.estimated_hours || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          onTicketAction(ticket.id, 'updateEstimatedHours', value);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <div className="p-3 bg-muted/30 rounded-md text-sm">
                {ticket.description || 'No description provided.'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Notes</Label>
              {ticket.notes && ticket.notes.length > 0 ? (
                ticket.notes.map((note, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-md text-sm">
                    <div className="font-medium">{note.user}</div>
                    <div className="text-xs text-muted-foreground">{new Date(note.timestamp).toLocaleString()}</div>
                    <div>{note.comment}</div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-muted/30 rounded-md text-sm">No notes provided.</div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {customActions}
              
              <TicketActionBar
                ticketId={ticket.id}
                status={ticket.status}
                priority={ticket.priority}
                dueDate={ticket.due_date}
                hasReporter={!!ticket.reporter}
                onStatusChange={(ticketId, newStatus) => onTicketAction(ticketId, 'updateStatus', newStatus)}
                onPriorityChange={(ticketId, newPriority) => onTicketAction(ticketId, 'updatePriority', newPriority)}
                onDueDateChange={(ticketId, newDueDate) => {
                  if (userCanEditDates) {
                    onTicketAction(ticketId, 'setDueDate', newDueDate)
                  }
                }}
                onReplyClick={() => {
                  // Handle reply action
                }}
              />
              
              {showTimeTracking && onLogTime && (
                <div className="ml-auto">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLogTime();
                    }}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Log Time
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
