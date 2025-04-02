
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileIcon, Trash2Icon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TicketAttachmentsListProps {
  ticketId: string;
  reporterId?: string;
  attachmentUrls?: string[];
}

export const TicketAttachmentsList: React.FC<TicketAttachmentsListProps> = ({
  ticketId,
  reporterId,
  attachmentUrls = []
}) => {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDownload = async (url: string) => {
    try {
      // Extract filename from the URL
      const filename = url.split('/').pop() || 'download';
      
      // Fetch the file
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
      
      toast.success("File download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const handleDelete = async (url: string) => {
    try {
      setDeleting(url);
      
      // Update the ticket to remove this attachment URL
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          attachments: attachmentUrls.filter(a => a !== url)
        })
        .eq('id', ticketId);
      
      if (updateError) throw updateError;
      
      // Try to delete the file from storage if it's a Supabase storage URL
      if (url.includes('storage.googleapis.com') || url.includes('supabase')) {
        const filePath = url.split('/').slice(-2).join('/');
        await supabase.storage.from('attachments').remove([filePath]);
      }
      
      toast.success("Attachment deleted successfully");
      // You'll need to implement a callback to refresh the parent component
      // or handle the state update to remove the attachment from the list
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete attachment");
    } finally {
      setDeleting(null);
    }
  };

  if (!attachmentUrls || attachmentUrls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No attachments found for this ticket.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attachmentUrls.map((url, index) => (
            <div 
              key={`${url}-${index}`} 
              className="flex items-center justify-between p-2 border rounded-md hover:bg-accent/50"
            >
              <div className="flex items-center space-x-2">
                <FileIcon className="h-5 w-5 text-blue-500" />
                <span className="text-sm truncate max-w-[200px] md:max-w-[400px]">
                  {url.split('/').pop() || `Attachment ${index + 1}`}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDownload(url)}
                  title="Download"
                >
                  <DownloadIcon className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(url)}
                  disabled={deleting === url}
                  title="Delete"
                >
                  <Trash2Icon className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
