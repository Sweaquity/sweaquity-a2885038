
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FileImage, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TicketAttachmentsListProps {
  reporterId: string | undefined;
  ticketId: string;
}

export const TicketAttachmentsList = ({ reporterId, ticketId }: TicketAttachmentsListProps) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!reporterId || !ticketId) {
        setLoading(false);
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
      } catch (err: any) {
        console.error("Error fetching attachments:", err);
        setError(err.message || "Failed to load attachments");
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [reporterId, ticketId]);

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
          const fileUrl = getFileUrl(file.name);
          
          return (
            <div 
              key={file.id} 
              className="border rounded-md p-2 flex flex-col gap-1"
            >
              <div className="aspect-square bg-gray-100 rounded flex items-center justify-center overflow-hidden">
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
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-auto text-xs h-7"
                onClick={() => window.open(fileUrl, '_blank')}
              >
                View File
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
