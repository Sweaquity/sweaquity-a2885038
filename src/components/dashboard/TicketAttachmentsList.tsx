import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FileImage, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TicketAttachmentsListProps {
  reporterId: string | undefined;
  ticketId: string;
  onAttachmentsLoaded?: (hasAttachments: boolean) => void;
}

export const TicketAttachmentsList = ({ 
  reporterId, 
  ticketId,
  onAttachmentsLoaded
}: TicketAttachmentsListProps) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrls, setFileUrls] = useState<{[key: string]: string}>({});
  const [loadingFiles, setLoadingFiles] = useState<{[key: string]: boolean}>({});
  const [fileErrors, setFileErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!reporterId || !ticketId) {
        setLoading(false);
        if (onAttachmentsLoaded) onAttachmentsLoaded(false);
        return;
      }

      try {
        console.log(`Fetching attachments from path: ${reporterId}/${ticketId}`);
        
        // Using the path format: reporterId/ticketId/*
        const { data, error } = await supabase.storage
          .from('ticket-attachments')
          .list(`${reporterId}/${ticketId}`);

        if (error) {
          throw error;
        }

        console.log("Attachments fetched:", data);
        setAttachments(data || []);
        
        // Prepare URLs for each attachment
        if (data && data.length > 0) {
          const urlPromises = data.map(async (file) => {
            return getFileUrl(file.name);
          });
          
          // Load all URLs at once
          const urls = await Promise.all(urlPromises);
          
          // Create a map of filename to URL
          const urlMap = data.reduce((map, file, index) => {
            map[file.name] = urls[index];
            return map;
          }, {} as {[key: string]: string});
          
          setFileUrls(urlMap);
        }
        
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

  const getFileUrl = async (filePath: string) => {
    try {
      // Try signed URL first for better security
      const { data: signedData, error: signedError } = await supabase.storage
        .from('ticket-attachments')
        .createSignedUrl(`${reporterId}/${ticketId}/${filePath}`, 3600); // 1 hour expiry
      
      if (signedError) {
        console.warn("Couldn't create signed URL, falling back to public URL:", signedError);
        
        // Fall back to public URL if signed URL fails
        const { data: publicData } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(`${reporterId}/${ticketId}/${filePath}`);
          
        return publicData.publicUrl;
      }
      
      return signedData.signedUrl;
    } catch (err: any) {
      console.error("Error getting file URL:", err, filePath);
      return '';
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const isImageFile = (file: any) => {
    // Check if file is an image based on mimetype or extension
    if (file.metadata?.mimetype?.startsWith('image/')) return true;
    
    // Check common image extensions
    const imageSuffixes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic'];
    return imageSuffixes.some(suffix => file.name.toLowerCase().endsWith(suffix));
  };

  const handleImageError = (filename: string) => {
    setFileErrors({...fileErrors, [filename]: "Failed to load image preview"});
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
      <div className="flex flex-col items-center justify-center py-4 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <div className="text-sm">{error}</div>
        <div className="text-xs mt-2">
          Check storage bucket permissions and RLS policies
        </div>
      </div>
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
          const isImage = isImageFile(file);
          const fileUrl = fileUrls[file.name] || '';
          const hasError = fileErrors[file.name];
          
          return (
            <div 
              key={file.id} 
              className="border rounded-md p-2 flex flex-col gap-1"
            >
              <div className="aspect-square bg-gray-100 rounded flex items-center justify-center overflow-hidden relative">
                {isImage && fileUrl ? (
                  <>
                    <img 
                      src={fileUrl} 
                      alt={file.name} 
                      className="h-full w-full object-cover"
                      onError={() => handleImageError(file.name)}
                    />
                    {hasError && (
                      <div className="absolute inset-0 bg-gray-100 bg-opacity-80 flex flex-col items-center justify-center p-2">
                        <AlertCircle className="h-5 w-5 text-red-500 mb-1" />
                        <span className="text-xs text-center text-red-500">Preview not available</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    {getFileIcon(file.metadata?.mimetype || '')}
                    <span className="text-xs text-gray-500 mt-1">
                      {file.metadata?.size ? `${Math.round(file.metadata.size / 1024)} KB` : ''}
                    </span>
                  </div>
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
                  onClick={() => window.open(fileUrl, '_blank')}
                  disabled={!fileUrl}
                >
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7 flex-1"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = fileUrl;
                    a.download = file.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  disabled={!fileUrl}
                >
                  Download
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function to check if a ticket has attachments
export const checkTicketAttachments = async (reporterId?: string, ticketId?: string): Promise<boolean> => {
  if (!reporterId || !ticketId) return false;
  
  try {
    console.log(`Checking attachments at path: ${reporterId}/${ticketId}`);
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
