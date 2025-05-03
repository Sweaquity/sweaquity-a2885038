import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Edit, Check, X } from "lucide-react";

interface TicketDescriptionProps {
  description: string | null | undefined;
  disabled?: boolean;
  onSave: (description: string) => Promise<void> | void;
}

export const TicketDescription: React.FC<TicketDescriptionProps> = ({
  description,
  disabled = false,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableDescription, setEditableDescription] = useState(description || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setEditableDescription(description || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditableDescription(description || "");
  };

  const handleSave = async () => {
    if (disabled) return;
    
    setIsSaving(true);
    try {
      await onSave(editableDescription);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving description:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2 border rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Description</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Check className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        <Textarea
          value={editableDescription}
          onChange={(e) => setEditableDescription(e.target.value)}
          placeholder="Enter ticket description..."
          className="min-h-[150px] resize-vertical"
          disabled={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 border rounded-md p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Description</h3>
        {!disabled && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </div>
      <div className="prose prose-sm max-w-none">
        {description ? (
          <div className="whitespace-pre-wrap">{description}</div>
        ) : (
          <p className="text-gray-500 italic">No description provided.</p>
        )}
      </div>
    </div>
  );
};
