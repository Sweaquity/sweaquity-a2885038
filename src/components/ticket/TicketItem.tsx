
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/types/types";
import { 
  Clock, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2 
} from "lucide-react";
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface TicketItemProps {
  ticket: Ticket;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  userCanEditDates?: boolean;
  showEstimatedHours?: boolean;
}

export const TicketItem: React.FC<TicketItemProps> = ({
  ticket,
  onTicketAction,
  onLogTime,
  renderTicketActions,
  userCanEditDates = false,
  showEstimatedHours = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [newDueDate, setNewDueDate] = useState(ticket.due_date || '');
  const [editingEstimatedHours, setEditingEstimatedHours] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState(ticket.estimated_hours?.toString() || '');

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
      case 'todo':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
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

  const handleDueDateSave = async () => {
    try {
      if (onTicketAction) {
        await onTicketAction(ticket.id, 'updateDueDate', newDueDate);
        setIsEditingDueDate(false);
        toast.success("Due date updated");
      }
    } catch (error) {
      console.error("Error updating due date:", error);
      toast.error("Failed to update due date");
    }
  };

  const handleEstimatedHoursSave = async () => {
    try {
      if (onTicketAction) {
        const hours = parseFloat(estimatedHours);
        if (isNaN(hours)) {
          toast.error("Please enter a valid number");
          return;
        }
        await onTicketAction(ticket.id, 'updateEstimatedHours', hours);
        setEditingEstimatedHours(false);
        toast.success("Estimated hours updated");
      }
    } catch (error) {
      console.error("Error updating estimated hours:", error);
      toast.error("Failed to update estimated hours");
    }
  };

  const renderTypeIndicator = () => {
    const type = ticket.ticket_type || ticket.type || 'task';
    switch (type.toLowerCase()) {
      case 'beta-test':
      case 'beta_test':
      case 'beta_testing':
        return <Badge variant="outline" className="bg-pink-100 text-pink-800">Beta Test</Badge>;
      case 'bug':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Bug</Badge>;
      case 'feature':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Feature</Badge>;
      case 'task':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Task</Badge>;
      case 'ticket':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Ticket</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">{type}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-start space-x-2">
            <div className="flex-1">
              <h3 className="text-lg font-medium truncate">{ticket.title}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {renderTypeIndicator()}
                <Badge variant="outline" className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                <Badge variant="outline" className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                {ticket.due_date && !isEditingDueDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(ticket.due_date) < new Date() 
                      ? <span className="text-red-600">Overdue: {format(new Date(ticket.due_date), 'MMM dd, yyyy')}</span>
                      : format(new Date(ticket.due_date), 'MMM dd, yyyy')
                    }
                  </Badge>
                )}
                {isEditingDueDate && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-40 h-8"
                    />
                    <Button size="sm" onClick={handleDueDateSave}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingDueDate(false)}>Cancel</Button>
                  </div>
                )}
                {!isEditingDueDate && userCanEditDates && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setNewDueDate(ticket.due_date || '');
                      setIsEditingDueDate(true);
                    }}
                  >
                    {ticket.due_date ? 'Edit Due Date' : 'Set Due Date'}
                  </Button>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleExpanded}>
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            {showEstimatedHours && (
              <div className="flex items-center gap-2">
                {!editingEstimatedHours ? (
                  <div className="flex items-center">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ticket.estimated_hours ? `${ticket.estimated_hours} hrs` : 'No estimate'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setEstimatedHours(ticket.estimated_hours?.toString() || '');
                        setEditingEstimatedHours(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      className="w-20 h-8"
                      min="0"
                      step="0.5"
                    />
                    <span>hrs</span>
                    <Button size="sm" onClick={handleEstimatedHoursSave}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingEstimatedHours(false)}>Cancel</Button>
                  </div>
                )}
              </div>
            )}
            
            {ticket.status === "review" && ticket.completion_percentage === 100 && onTicketAction && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onTicketAction(ticket.id, 'updateStatus', 'done')}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Review
              </Button>
            )}
            
            {onLogTime && ticket.status !== "done" && ticket.status !== "closed" && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onLogTime(ticket.id)}
              >
                <Clock className="h-4 w-4 mr-1" /> Log Time
              </Button>
            )}
            
            {renderTicketActions && renderTicketActions(ticket)}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t pt-4">
            <div className="text-sm text-gray-600 whitespace-pre-wrap">
              {ticket.description}
            </div>
            
            {ticket.notes && ticket.notes.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium mb-2">Notes & Updates</h4>
                <div className="space-y-2">
                  {ticket.notes.map((note, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{note.user}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{note.comment || note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
