
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { FileImage, FileText, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkStoragePermissions, getSecureFileUrl } from "@/utils/setupStorage";

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
  const [permissionsDetails, setPermissionsDetails] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [fetchComplete, setFetchComplete] = useState(false);

  const fetchAttachments = useCallback(async () => {
    if (!reporterId || !ticketId || fetchComplete) {
      setLoading(false);
      return;
    }

    try {
      console.log(`Fetching attachments from path: ${reporterId}/${ticketId}`);
      
      // Check if we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // First check storage permissions
      const permissionCheck = await checkStoragePermissions('ticket-attachments', `${reporterId}/${ticketId}`);
      setPermissionsDetails(permissionCheck);
      
      if (!permissionCheck.success) {
        console.error("Storage access denied:", permissionCheck);
        throw new Error(`Storage access denied: ${permissionCheck.error}`);
      }

      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .list(`${reporterId}/${ticketId}`);

      if (error) {
        console.error("Storage list error:", error);
        throw error;
      }

      console.log("Attachments fetched:", data);
      setAttachments(data || []);
      
      if (data && data.length > 0) {
        const urlMap: {[key: string]: string} = {};
        
        for (const file of data) {
          try {
            // Show loading state for this file
            setLoadingFiles(prev => ({ ...prev, [file.name]: true }));
            
            // Get a signed URL for the file
            const result = await getSecureFileUrl(
              'ticket-attachments', 
              `${reporterId}/${ticketId}/${file.name}`
            );
            
            if (result.success && result.url) {
              urlMap[file.name] = result.url;
            } else {
              setFileErrors(prev => ({ 
                ...prev, 
                [file.name]: `Failed to get URL: ${result.error}` 
              }));
            }
          } catch (err: any) {
            console.error(`Error getting URL for ${file.name}:`, err);
            setFileErrors(prev => ({ ...prev, [file.name]: err.message || "Failed to get URL" }));
          } finally {
            setLoadingFiles(prev => ({ ...prev, [file.name]: false }));
          }
        }
        
        setFileUrls(urlMap);
      }
      
      if (onAttachmentsLoaded) {
        onAttachmentsLoaded(data && data.length > 0);
      }
      
      setFetchComplete(true);
    } catch (err: any) {
      console.error("Error fetching attachments:", err);
      setError(err.message || "Failed to load attachments");
      if (onAttachmentsLoaded) onAttachmentsLoaded(false);
    } finally {
      setLoading(false);
    }
  }, [reporterId, ticketId, onAttachmentsLoaded, fetchComplete]);

  useEffect(() => {
    setFetchComplete(false);
    setLoading(true);
    setError(null);
    fetchAttachments();
  }, [fetchAttachments, reporterId, ticketId, retryCount]);

  const handleRetry = () => {
    setFetchComplete(false);
    setLoading(true);
    setError(null);
    setFileErrors({});
    setRetryCount(prev => prev + 1);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const isImageFile = (file: any) => {
    if (file.metadata?.mimetype?.startsWith('image/')) return true;
    
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
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry}
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
        {permissionsDetails && (
          <div className="text-xs mt-2 bg-gray-100 p-2 rounded max-w-full overflow-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(permissionsDetails, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-2">
        No attachments found for this ticket.
        <div className="text-xs mt-1">
          Path: {reporterId}/{ticketId}
        </div>
      </div>
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
          const isLoading = loadingFiles[file.name];
          
          return (
            <div 
              key={file.id} 
              className="border rounded-md p-2 flex flex-col gap-1"
            >
              <div className="aspect-square bg-gray-100 rounded flex items-center justify-center overflow-hidden relative">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                ) : isImage && fileUrl ? (
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
                  disabled={!fileUrl || isLoading}
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "View"}
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
                  disabled={!fileUrl || isLoading}
                >
                  Download
                </Button>
              </div>
              {hasError && !isLoading && (
                <div className="text-xs text-red-500 mt-1">
                  {hasError}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const checkTicketAttachments = async (reporterId?: string, ticketId?: string): Promise<boolean> => {
  if (!reporterId || !ticketId) return false;
  
  try {
    console.log(`Checking attachments at path: ${reporterId}/${ticketId}`);
    
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error("Not authenticated");
      return false;
    }
    
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .list(`${reporterId}/${ticketId}`);

    if (error) {
      console.error("Error checking attachments:", error);
      throw error;
    }
    
    return data && data.length > 0;
  } catch (err) {
    console.error("Error checking ticket attachments:", err);
    return false;
  }
};
