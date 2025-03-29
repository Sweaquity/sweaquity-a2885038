
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

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
