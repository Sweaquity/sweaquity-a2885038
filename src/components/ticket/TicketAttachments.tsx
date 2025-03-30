
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { ImageIcon, FileIcon, ExternalLinkIcon, Download } from "lucide-react";
import { toast } from "sonner";

interface TicketAttachmentsProps {
  ticketId?: string;
  projectId?: string;
  attachmentUrls?: string[];
  label?: string;
}

export function TicketAttachments({ 
  ticketId, 
  projectId, 
  attachmentUrls, 
  label = "Attachments" 
}: TicketAttachmentsProps) {
  const [attachments, setAttachments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (attachmentUrls?.length) {
      setAttachments(attachmentUrls);
    } else if (ticketId && projectId) {
      fetchAttachments();
    }
  }, [ticketId, projectId, attachmentUrls]);

  const fetchAttachments = async () => {
    if (!ticketId || !projectId) return;
    
    try {
      setLoading(true);
      
      // First check if the ticket already has attachments in the database
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('attachments')
        .eq('id', ticketId)
        .single();
      
      if (ticketError) {
        console.error("Error fetching ticket data:", ticketError);
        return;
      }
      
      if (ticketData?.attachments && ticketData.attachments.length > 0) {
        setAttachments(ticketData.attachments);
        return;
      }
      
      // If no attachments in database, try to list from storage
      const storagePath = `${projectId}/${ticketId}`;
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('ticket-attachments')
        .list(storagePath);
      
      if (storageError) {
        console.error("Error listing attachments:", storageError);
        return;
      }
      
      if (storageData && storageData.length > 0) {
        const urls = storageData.map(file => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('ticket-attachments')
            .getPublicUrl(`${storagePath}/${file.name}`);
          
          return publicUrl;
        });
        
        setAttachments(urls);
        
        // Update the ticket with the attachment URLs
        await supabase
          .from('tickets')
          .update({ attachments: urls })
          .eq('id', ticketId);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create a download link
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      
      // Extract filename from URL
      const fileName = url.split('/').pop() || 'attachment';
      downloadLink.download = fileName;
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success("Downloading attachment");
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Failed to download attachment");
    }
  };

  if (!attachments.length && !loading) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
        >
          <FileIcon className="h-4 w-4" />
          <span>{label} ({loading ? "..." : attachments.length})</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <h4 className="text-sm font-medium mb-2">Attachments</h4>
        {loading ? (
          <div className="py-2 text-center text-sm text-gray-500">Loading attachments...</div>
        ) : attachments.length === 0 ? (
          <div className="py-2 text-center text-sm text-gray-500">No attachments found</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {attachments.map((url, index) => {
              const isImage = url.toLowerCase().endsWith('.png') || 
                             url.toLowerCase().endsWith('.jpg') || 
                             url.toLowerCase().endsWith('.jpeg') || 
                             url.toLowerCase().endsWith('.gif');
              
              return (
                <div key={index} className="relative group border rounded p-2">
                  <div className="flex items-center justify-center h-20 bg-gray-100 rounded mb-1">
                    {isImage ? (
                      <img 
                        src={url} 
                        alt={`Attachment ${index + 1}`} 
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <FileIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs truncate w-20">
                      Attachment {index + 1}
                    </span>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <ExternalLinkIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => handleDownload(url)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
