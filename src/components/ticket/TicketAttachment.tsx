import React from "react";
import { Button } from "@/components/ui/button";

interface TicketAttachmentProps {
  attachments: string[];
  onViewAttachment?: (url: string) => void;
}

export const TicketAttachment: React.FC<TicketAttachmentProps> = ({
  attachments,
  onViewAttachment
}) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

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
                onClick={() => onViewAttachment ? onViewAttachment(url) : window.open(url, '_blank')}
              >
                View Full
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
