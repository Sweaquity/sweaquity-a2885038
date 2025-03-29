
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Image } from "lucide-react";

interface TicketAttachmentProps {
  attachments: string[];
  onViewAttachment?: (url: string) => void;
}

export const TicketAttachment: React.FC<TicketAttachmentProps> = ({
  attachments,
  onViewAttachment
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleViewAttachment = (url: string) => {
    if (onViewAttachment) {
      onViewAttachment(url);
    } else {
      setSelectedImage(url);
      setIsDialogOpen(true);
    }
  };

  return (
    <div>
      <p className="text-sm font-medium mb-2">Screenshots ({attachments.length})</p>
      <div className="grid grid-cols-2 gap-2">
        {attachments.map((url, i) => (
          <div key={i} className="relative group border rounded overflow-hidden h-36">
            <img 
              src={url} 
              alt={`Screenshot ${i+1}`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails to load, show placeholder
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                (e.target as HTMLImageElement).classList.add("p-8", "bg-gray-100");
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white"
                onClick={() => handleViewAttachment(url)}
              >
                View Full
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle>Screenshot Preview</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center items-center">
              <img 
                src={selectedImage} 
                alt="Full screenshot" 
                className="max-w-full max-h-[70vh]"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
