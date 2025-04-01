
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Trash, X } from "lucide-react";

interface TicketAttachmentProps {
  attachments: string[];
  onViewAttachment?: (url: string) => void;
  onDeleteAttachment?: (url: string) => void;
}

export const TicketAttachment: React.FC<TicketAttachmentProps> = ({
  attachments,
  onViewAttachment,
  onDeleteAttachment
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handlePreview = (url: string) => {
    if (onViewAttachment) {
      onViewAttachment(url);
    } else {
      setPreviewUrl(url);
      setPreviewOpen(true);
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const confirmDelete = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAttachmentToDelete(url);
    setConfirmDeleteOpen(true);
  };

  const handleDelete = () => {
    if (attachmentToDelete && onDeleteAttachment) {
      onDeleteAttachment(attachmentToDelete);
      setAttachmentToDelete(null);
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div>
      <p className="text-sm font-medium mb-2">Screenshots ({attachments.length})</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {attachments.map((url, i) => (
          <div key={i} className="relative group border rounded overflow-hidden h-36">
            <img 
              src={url} 
              alt={`Screenshot ${i+1}`} 
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => handlePreview(url)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white"
                onClick={() => handlePreview(url)}
              >
                View Full
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white"
                onClick={() => handleDownload(url)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {onDeleteAttachment && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-red-300"
                  onClick={(e) => confirmDelete(url, e)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Dialog */}
      {previewOpen && previewUrl && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Image Preview</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => setPreviewOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="relative max-h-[70vh] overflow-auto flex justify-center">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full h-auto object-contain"
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => handleDownload(previewUrl)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              {onDeleteAttachment && (
                <Button 
                  variant="destructive" 
                  onClick={(e) => confirmDelete(previewUrl, e)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDeleteOpen && (
        <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Attachment</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this attachment? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  setAttachmentToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
