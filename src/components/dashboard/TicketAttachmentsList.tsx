import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FileImage, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TicketAttachmentsListProps {
  reporterId: string | undefined;
  ticketId: string;
  attachmentUrls?: string[];
  onAttachmentsLoaded?: (hasAttachments: boolean) => void;
}

export const TicketAttachmentsList = ({ 
  reporterId, 
  ticketId,
  attachmentUrls,
  onAttachmentsLoaded
}: TicketAttachmentsListProps) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  useEffect(() => {
    if (attachmentUrls && attachmentUrls.length > 0) {
      const processedAttachments = attachmentUrls.map((url, index) => {
        const fileName = url.split('/').pop() || `attachment-${index}.png`;
        const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
        let mimetype = 'application/octet-stream';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
          mimetype = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
        } else if (fileExt === 'pdf') {
          mimetype = 'application/pdf';
        } else if (['doc', 'docx'].includes(fileExt)) {
          mimetype = 'application/msword';
        }

        return {
          id: `url-${index}`,
          name: fileName,
          metadata: { mimetype },
          url: url,
          isDirectUrl: true
        };
      });
      
      setAttachments(processedAttachments);
      setLoading(false);
      
      if (onAttachmentsLoaded) {
        onAttachmentsLoaded(processedAttachments.length > 0);
      }
      return;
    }
    
    const fetchAttachments = async () => {
      if (!reporterId || !ticketId) {
        setLoading(false);
        if (onAttachmentsLoaded) onAttachmentsLoaded(false);
        return;
      }

      try {
        const { data, error } = await supabase.storage
          .from('ticket-attachments')
          .list(`${reporterId}/${ticketId}`);

        if (error) {
          throw error;
        }

        setAttachments(data || []);
        
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
  }, [reporterId, ticketId, attachmentUrls, onAttachmentsLoaded]);

  const getFileUrl = (file: any) => {
    if (file.isDirectUrl) {
      return file.url;
    }
    
    return supabase.storage
      .from('ticket-attachments')
      .getPublicUrl(`${reporterId}/${ticketId}/${file.name}`).data.publicUrl;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const openPreview = (file: any) => {
    const isImage = file.metadata?.mimetype?.startsWith('image/');
    const fileUrl = getFileUrl(file);
    
    setPreviewUrl(fileUrl);
    setPreviewType(file.metadata?.mimetype || '');
    setPreviewName(file.name);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl(null);
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
      <h4 className="text-sm font-medium">Attachments ({attachments.length})</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {attachments.map((file) => {
          const isImage = file.metadata?.mimetype?.startsWith('image/');
          const fileUrl = getFileUrl(file);
          
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
                  Preview
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  Download
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
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closePreview}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const checkTicketAttachments = async (reporterId?: string, ticketId?: string): Promise<boolean> => {
  if (!reporterId || !ticketId) return false;
  
  try {
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select('attachments')
      .eq('id', ticketId)
      .single();
    
    if (ticketError) throw ticketError;
    
    if (ticketData?.attachments && ticketData.attachments.length > 0) {
      return true;
    }
    
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
