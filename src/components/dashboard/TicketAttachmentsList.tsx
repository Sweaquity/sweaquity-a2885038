
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FileImage, FileText, Loader2, X, Download, Trash, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

interface TicketAttachmentsListProps {
  reporterId: string | undefined;
  ticketId: string;
  onAttachmentsLoaded?: (hasAttachments: boolean) => void;
  onViewAttachment?: (url: string) => void;
  onDeleteAttachment?: (url: string) => void;
  attachmentUrls?: string[];
}

export const TicketAttachmentsList = ({ 
  reporterId, 
  ticketId,
  onAttachmentsLoaded,
  onViewAttachment,
  onDeleteAttachment,
  attachmentUrls = []
}: TicketAttachmentsListProps) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!reporterId || !ticketId) {
        setLoading(false);
        if (onAttachmentsLoaded) onAttachmentsLoaded(false);
        return;
      }

      try {
        // Using the path format: reporterId/ticketId/*
        const { data, error } = await supabase.storage
          .from('ticket-attachments')
          .list(`${reporterId}/${ticketId}`);

        if (error) {
          throw error;
        }

        setAttachments(data || []);
        
        // Notify parent component about attachment status
        if (onAttachmentsLoaded) {
          onAttachmentsLoaded(data && data.length > 0);
        }
      } catch (err: any) {
        console.error("Error fetching attachments:", err);
        setError(err.message || "Failed to load attachments");
        if (onAttachmentsLoaded) onAttachmentsLoaded(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [reporterId, ticketId, onAttachmentsLoaded]);

  const getFileUrl = (filePath: string) => {
    return supabase.storage
      .from('ticket-attachments')
      .getPublicUrl(`${reporterId}/${ticketId}/${filePath}`).data.publicUrl;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const openPreview = (file: any) => {
    if (onViewAttachment) {
      const fileUrl = getFileUrl(file.name);
      onViewAttachment(fileUrl);
    } else {
      const isImage = file.metadata?.mimetype?.startsWith('image/');
      const fileUrl = getFileUrl(file.name);
      
      setPreviewUrl(fileUrl);
      setPreviewType(file.metadata?.mimetype || '');
      setPreviewName(file.name);
      setPreviewOpen(true);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl(null);
  };

  const handleDeleteAttachment = async (file: any) => {
    try {
      const filePath = `${reporterId}/${ticketId}/${file.name}`;
      const { error } = await supabase.storage
        .from('ticket-attachments')
        .remove([filePath]);
        
      if (error) throw error;
      
      // Remove from local state
      setAttachments(prevAttachments => 
        prevAttachments.filter(a => a.id !== file.id)
      );
      
      toast.success("Attachment deleted successfully");
      setConfirmDeleteOpen(false);
      setAttachmentToDelete(null);
      
      // Call parent handler if provided
      if (onDeleteAttachment) {
        const fileUrl = getFileUrl(file.name);
        onDeleteAttachment(fileUrl);
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    }
  };

  const confirmDelete = (file: any) => {
    setAttachmentToDelete(file);
    setConfirmDeleteOpen(true);
  };

  const renderPreviewContent = () => {
    if (!previewUrl) return null;
    
    if (previewType?.startsWith('image/')) {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <img 
            src={previewUrl} 
            alt={previewName || 'Preview'} 
            className="max-w-full max-h-[70vh] object-contain" 
          />
        </div>
      );
    } else if (previewType?.startsWith('application/pdf')) {
      return (
        <iframe 
          src={`${previewUrl}#view=FitH`} 
          className="w-full h-[70vh]" 
          title={previewName || 'PDF Preview'}
        />
      );
    } else {
      return (
        <div className="text-center py-10">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p>This file type cannot be previewed directly.</p>
          <Button 
            className="mt-4"
            onClick={() => window.open(previewUrl, '_blank')}
          >
            Open in New Tab
          </Button>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 py-2">{error}</div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-2">No attachments found for this ticket.</div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Attachments from Storage ({attachments.length})</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {attachments.map((file) => {
          const isImage = file.metadata?.mimetype?.startsWith('image/');
          const fileUrl = getFileUrl(file.name);
          
          return (
            <div 
              key={file.id} 
              className="border rounded-md p-2 flex flex-col gap-1"
            >
              <div 
                className="aspect-square bg-gray-100 rounded flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => openPreview(file)}
              >
                {isImage ? (
                  <img 
                    src={fileUrl} 
                    alt={file.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getFileIcon(file.metadata?.mimetype || '')
                )}
              </div>
              <div className="text-xs truncate" title={file.name}>
                {file.name}
              </div>
              <div className="flex gap-1 mt-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7 flex-1"
                  onClick={() => openPreview(file)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7 text-red-500 hover:text-red-700"
                  onClick={() => confirmDelete(file)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium truncate max-w-[80%]">{previewName}</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(previewUrl || '', '_blank')}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={closePreview}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      {confirmDeleteOpen && attachmentToDelete && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Delete Attachment</h3>
            <p className="mb-6">Are you sure you want to delete this attachment? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setConfirmDeleteOpen(false);
                setAttachmentToDelete(null);
              }}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteAttachment(attachmentToDelete)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to check if a ticket has attachments
export const checkTicketAttachments = async (reporterId?: string, ticketId?: string): Promise<boolean> => {
  if (!reporterId || !ticketId) return false;
  
  try {
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .list(`${reporterId}/${ticketId}`);

    if (error) throw error;
    
    return data && data.length > 0;
  } catch (err) {
    console.error("Error checking ticket attachments:", err);
    return false;
  }
};
