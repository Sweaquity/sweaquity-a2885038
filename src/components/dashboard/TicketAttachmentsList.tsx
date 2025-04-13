import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  
  // Use a ref to track the component mount state
  const isMounted = useRef(true);
  // Use ref for tracking fetch status to prevent duplicate fetches
  const isFetching = useRef(false);
  // Store retry counter in a ref to avoid unnecessary renders
  const retryCountRef = useRef(0);
  // Create stable refs for the props to compare for changes
  const prevReporterIdRef = useRef<string | undefined>(reporterId);
  const prevTicketIdRef = useRef<string>(ticketId);

  // Memoize the fetch path to prevent unnecessary effect triggers
  const fetchPath = useMemo(() => {
    return reporterId && ticketId ? `${reporterId}/${ticketId}` : null;
  }, [reporterId, ticketId]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Process files and get secure URLs
  const processFileUrls = useCallback(async (files: any[]) => {
    if (!fetchPath || !files.length || !isMounted.current) return;
    
    const urlMap: {[key: string]: string} = {};
    const loadingMap: {[key: string]: boolean} = {};
    const errorMap: {[key: string]: string} = {};
    
    // Initialize loading state for all files at once
    files.forEach(file => {
      loadingMap[file.name] = true;
    });
    
    if (isMounted.current) {
      setLoadingFiles(loadingMap);
    }
    
    // Process files in parallel using Promise.all
    const filePromises = files.map(async (file) => {
      try {
        const result = await getSecureFileUrl(
          'ticket-attachments', 
          `${fetchPath}/${file.name}`
        );
        
        if (!isMounted.current) return;
        
        if (result.success && result.url) {
          urlMap[file.name] = result.url;
        } else {
          errorMap[file.name] = `Failed to get URL: ${result.error}`;
        }
      } catch (err: any) {
        if (!isMounted.current) return;
        errorMap[file.name] = err.message || "Failed to get URL";
      } finally {
        if (isMounted.current) {
          loadingMap[file.name] = false;
        }
      }
    });
    
    // Wait for all promises to complete
    await Promise.all(filePromises);
    
    if (isMounted.current) {
      setFileUrls(urlMap);
      setFileErrors(errorMap);
      setLoadingFiles(loadingMap);
    }
  }, [fetchPath]);

  // Memoized fetch function to prevent recreating on each render
  const fetchAttachments = useCallback(async () => {
    // Skip if no valid path or already fetching
    if (!fetchPath || isFetching.current) return;
    
    // Set fetching flag to prevent simultaneous calls
    isFetching.current = true;
    
    try {
      console.log(`Fetching attachments from path: ${fetchPath}`);
      
      // Check if we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Check storage permissions
      const permissionCheck = await checkStoragePermissions('ticket-attachments', fetchPath);
      
      if (!isMounted.current) return; 
      
      setPermissionsDetails(permissionCheck);
      
      if (!permissionCheck.success) {
        console.error("Storage access denied:", permissionCheck);
        throw new Error(`Storage access denied: ${permissionCheck.error}`);
      }

      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .list(fetchPath);

      if (error) {
        console.error("Storage list error:", error);
        throw error;
      }

      if (!isMounted.current) return;

      console.log("Attachments fetched:", data);
      
      const fileList = data || [];
      setAttachments(fileList);
      
      // Process file URLs if we have attachments
      if (fileList.length > 0) {
        await processFileUrls(fileList);
      }
      
      // Notify parent component about attachment state
      if (isMounted.current && onAttachmentsLoaded) {
        onAttachmentsLoaded(fileList.length > 0);
      }
    } catch (err: any) {
      if (isMounted.current) {
        console.error("Error fetching attachments:", err);
        setError(err.message || "Failed to load attachments");
        if (onAttachmentsLoaded) onAttachmentsLoaded(false);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      // Reset the fetching flag immediately to allow retries if needed
      isFetching.current = false;
    }
  }, [fetchPath, onAttachmentsLoaded, processFileUrls]);

  // Only fetch when necessary - when path has changed or on retry
  useEffect(() => {
    // Check if reporterId or ticketId has actually changed
    const hasPathChanged = prevReporterIdRef.current !== reporterId || prevTicketIdRef.current !== ticketId;
    
    // Only fetch if we have a valid path and either the path changed or we're doing a manual retry
    if (fetchPath && (hasPathChanged || retryCountRef.current > 0)) {
      // Update ref values
      prevReporterIdRef.current = reporterId;
      prevTicketIdRef.current = ticketId;
      
      setLoading(true);
      setError(null);
      fetchAttachments();
      
      // Reset retry counter after fetch attempt
      retryCountRef.current = 0;
    }
  }, [fetchPath, fetchAttachments]);

  const handleRetry = () => {
    // Increment retry counter to trigger a fetch
    retryCountRef.current += 1;
    setLoading(true);
    setError(null);
    setFileErrors({});
    // Force reset the fetching flag to ensure we can retry
    isFetching.current = false;
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
    setFileErrors(prev => ({...prev, [filename]: "Failed to load image preview"}));
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
