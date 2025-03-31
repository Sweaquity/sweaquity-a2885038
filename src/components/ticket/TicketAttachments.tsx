
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Ticket } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Image as ImageIcon, FileArchive, File, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface TicketAttachmentsProps {
  ticket: Ticket;
}

export const TicketAttachments: React.FC<TicketAttachmentsProps> = ({ ticket }) => {
  const [attachments, setAttachments] = useState<Array<{ name: string, url: string, type: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticket?.id && ticket.reporter) {
      fetchAttachments();
    }
  }, [ticket]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      
      // Structure is reporter_id/ticket_id
      const path = `${ticket.reporter}/${ticket.id}`;
      
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .list(path, {
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Create signed URLs for each file
        const attachmentsWithUrls = await Promise.all(
          data.map(async (file) => {
            const { data: url } = await supabase.storage
              .from('ticket-attachments')
              .createSignedUrl(`${path}/${file.name}`, 3600); // 1 hour expiry
            
            return {
              name: file.name,
              url: url?.signedUrl || '',
              type: getFileType(file.name)
            };
          })
        );
        
        setAttachments(attachmentsWithUrls.filter(att => att.url));
      } else {
        setAttachments([]);
      }
    } catch (error) {
      console.error("Error fetching ticket attachments:", error);
      toast.error("Failed to load ticket attachments");
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
    
    if (imageExtensions.includes(extension)) return 'image';
    if (documentExtensions.includes(extension)) return 'document';
    if (archiveExtensions.includes(extension)) return 'archive';
    
    return 'other';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-10 w-10 text-blue-500" />;
      case 'document':
        return <FileText className="h-10 w-10 text-green-500" />;
      case 'archive':
        return <FileArchive className="h-10 w-10 text-amber-500" />;
      default:
        return <File className="h-10 w-10 text-gray-500" />;
    }
  };

  if (!ticket?.id || !ticket.reporter) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-3">Ticket Attachments</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No attachments found for this ticket
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {attachments.map((file, index) => (
              <div key={index} className="border rounded-md p-3 flex items-center group hover:bg-muted/50 transition-colors">
                <div className="mr-3 flex-shrink-0">
                  {file.type === 'image' ? (
                    <div className="h-12 w-12 rounded overflow-hidden bg-muted">
                      <img 
                        src={file.url} 
                        alt={file.name} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  ) : (
                    getFileIcon(file.type)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{file.type}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Open</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
