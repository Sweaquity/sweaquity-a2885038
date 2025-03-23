import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { TicketAttachment } from "./TicketAttachment";

interface TicketFormData {
  id?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  reproduction_steps?: string;
  attachments?: string[];
}

interface TicketFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TicketFormData;
  onSubmit: (data: TicketFormData) => Promise<void>;
  mode: 'create' | 'edit';
}

export const TicketForm: React.FC<TicketFormProps> = ({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  mode
}) => {
  const defaultData: TicketFormData = {
    title: '',
    description: '',
    status: 'new',
    priority: 'medium',
    due_date: '',
    reproduction_steps: '',
    attachments: []
  };

  const [formData, setFormData] = useState<TicketFormData>(initialData || defaultData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      // Show validation error
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      // Reset form if create mode
      if (mode === 'create') {
        setFormData(defaultData);
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    if (!formData.attachments) return;
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index)
    }));
  };

  const handleAddAttachment = (url: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), url]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Ticket' : 'Edit Ticket'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new ticket to track issues or feedback' 
              : 'Update the details of this ticket'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="ticket-title">Title</Label>
            <Input
              id="ticket-title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Brief title describing the issue"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description of the issue"
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="reproduction-steps">Steps to Reproduce</Label>
            <Textarea
              id="reproduction-steps"
              value={formData.reproduction_steps || ''}
              onChange={(e) => handleChange('reproduction_steps', e.target.value)}
              placeholder="Step by step instructions to reproduce the issue"
              className="min-h-[80px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ticket-status">Status</Label>
              <Select
                value={formData.status || "new"}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger id="ticket-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="ticket-priority">Priority</Label>
              <Select
                value={formData.priority || "medium"}
                onValueChange={(value) => handleChange('priority', value)}
              >
                <SelectTrigger id="ticket-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="ticket-due-date">Due Date</Label>
            <Input
              id="ticket-due-date"
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => handleChange('due_date', e.target.value)}
            />
          </div>
          
          <div>
            <Label className="mb-2 block">Attachments</Label>
            {formData.attachments && formData.attachments.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {formData.attachments.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Attachment ${index + 1}`} 
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-2">No attachments</p>
            )}
            
            <Button 
              variant="outline" 
              type="button"
              onClick={() => {
                // In a real implementation, this would open a file upload dialog
                // For this example, we'll just add a placeholder URL
                handleAddAttachment(`https://placeholder.com/ticket-attachment-${Date.now()}`);
              }}
              className="w-full"
            >
              Add Attachment
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (mode === 'create' ? 'Creating...' : 'Updating...') 
              : (mode === 'create' ? 'Create Ticket' : 'Update Ticket')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
