import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { FileImage, FileText, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkStoragePermissions, getSecureFileUrl } from "@/utils/setupStorage";

interface TicketAttachmentsListProps {
  reporterId: string | undefined;
  ticketId: string;
  onAttachmentsLoaded?: (hasAttachments: boolean) => void;
  userType?: 'jobseeker' | 'business'; // Added userType prop to handle different permission scenarios
}

export const TicketAttachmentsList = ({ 
  reporterId, 
  ticketId,
  onAttachmentsLoaded,
  userType
}: TicketAttachmentsListProps) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrls, setFileUrls] = useState<{[key: string]: string}>({});
  const [loadingFiles, setLoadingFiles] = useState<{[key: string]: boolean}>({});
  const [fileErrors, setFileErrors] = useState<{[key: string]: string}>({});
  const [permissionsDetails, setPermissionsDetails] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Add these refs to prevent unnecessary re-renders and fetch loops
  const hasFetchedRef = useRef(false);
  const reporterIdRef = useRef(reporterId);
  const ticketIdRef = useRef(ticketId);
  const hasCalledCallbackRef = useRef(false);

  useEffect(() => {
    // Update refs when props change
    reporterIdRef.current = reporterId;
    ticketIdRef.current = ticketId;
  }, [reporterId, ticketId]);

  useEffect(() => {
    // Reset tracking states when retry is triggered
    if (retryCount > 0) {
      hasFetchedRef.current = false;
      hasCalledCallbackRef.current = false;
    }
  }, [retryCount]);

  useEffect(() => {
    const fetchAttachments = async () => {
      // Skip if already fetched or missing required data
      if (hasFetchedRef.current || !reporterId || !ticketId) {
        if (!reporterId || !ticketId) {
          setLoading(false);
          if (onAttachmentsLoaded && !hasCalledCallbackRef.current) {
            onAttachmentsLoaded(false);
            hasCalledCallbackRef.current = true;
          }
        }
        return;
      }

      hasFetchedRef.current = true; // Mark as fetched to prevent loops
      
      try {
        console.log(`Fetching attachments from path: ${reporterId}/${ticketId} for ${userType || 'unknown'} user`);
        
        // Check if we're authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated");
        }

        // First check storage permissions - apply different strategies based on user type
        const permissionCheck = await checkStoragePermissions(
          'ticket-attachments', 
          `${reporterId}/${ticketId}`,
          userType === 'jobseeker' ? { retryLimit: 1 } : undefined // Limit retries for jobseekers
        );
        
        setPermissionsDetails(permissionCheck);
        
        if (!permissionCheck.success) {
          console.error("Storage access denied:", permissionCheck);
          throw new Error(`Storage access denied: ${permissionCheck.error}`);
        }

        // Batch state updates to reduce render cycles
        const updatedState: any = {
          attachmentsData: [],
          urlsMap: {},
          loadingFilesMap: {},
          errorsMap: {}
        };

        const { data, error } = await supabase.storage
          .from('ticket-attachments')
          .list(`${reporterId}/${ticketId}`);

        if (error) {
          console.error("Storage list error:", error);
          throw error;
        }

        console.log("Attachments fetched:", data);
        updatedState.attachmentsData = data || [];
        
        if (data && data.length > 0) {
          // Pre-populate loading states
          const loadingStates: {[key: string]: boolean} = {};
          data.forEach(file => {
            loadingStates[file.name] = true;
          });
          updatedState.loadingFilesMap = loadingStates;
          
          // Set initial state before async operations
          setAttachments(updatedState.attachmentsData);
          setLoadingFiles(loadingStates);
          
          // Get URLs in parallel instead of sequentially
          const urlPromises = data.map(async (file) => {
            try {
              const result = await getSecureFileUrl(
                'ticket-attachments', 
                `${reporterId}/${ticketId}/${file.name}`
              );
              
              return {
                fileName: file.name,
                url: result.success ? result.url : null,
                error: !result.success ? result.error : null
              };
            } catch (err: any) {
              console.error(`Error getting URL for ${file.name}:`, err);
              return {
                fileName: file.name,
                url: null,
                error: err.message || "Failed to get URL"
              };
            }
          });
          
          // Process results
          const results = await Promise.all(urlPromises);
          
          const urlMap: {[key: string]: string} = {};
          const errorMap: {[key: string]: string} = {};
          const finalLoadingStates: {[key: string]: boolean} = {};
          
          results.forEach(result => {
            if (result.url) {
              urlMap[result.fileName] = result.url;
            }
            if (result.error) {
              errorMap[result.fileName] = result.error;
            }
            finalLoadingStates[result.fileName] = false;
          });
          
          // Update state with all results at once
          setFileUrls(urlMap);
          setFileErrors(errorMap);
          setLoadingFiles(finalLoadingStates);
        }
        
        // Call the callback after data is processed
        if (onAttachmentsLoaded && !hasCalledCallbackRef.current) {
          const hasAttachments = data && data.length > 0;
          onAttachmentsLoaded(hasAttachments);
          hasCalledCallbackRef.current = true;
        }
      } catch (err: any) {
        console.error("Error fetching attachments:", err);
        setError(err.message || "Failed to load attachments");
        
        // Call callback even on error
        if (onAttachmentsLoaded && !hasCalledCallbackRef.current) {
          onAttachmentsLoaded(false);
          hasCalledCallbackRef.current = true;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [reporterId, ticketId, onAttachmentsLoaded, retryCount, userType]);

  const handleRetry = () => {
    hasFetchedRef.current = false;
    hasCalledCallbackRef.current = false;
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
    setFileErrors(prev => ({ ...prev, [filename]: "Failed to load image preview" }));
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
          {userType === 'jobseeker' ? 
            "You may not have permission to view these attachments." : 
            "Check storage bucket permissions and RLS policies"}
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
        {permissionsDetails && userType !== 'jobseeker' && (
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
        {userType !== 'jobseeker' && (
          <div className="text-xs mt-1">
            Path: {reporterId}/{ticketId}
          </div>
        )}
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

export const checkTicketAttachments = async (
  reporterId?: string, 
  ticketId?: string,
  userType?: 'jobseeker' | 'business'
): Promise<boolean> => {
  if (!reporterId || !ticketId) return false;
  
  try {
    console.log(`Checking attachments at path: ${reporterId}/${ticketId} for ${userType || 'unknown'} user`);
    
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error("Not authenticated");
      return false;
    }
    
    // Add caching to prevent repeated checks
    const cacheKey = `attachments_${reporterId}_${ticketId}`;
    const cachedResult = sessionStorage.getItem(cacheKey);
    
    if (cachedResult !== null) {
      return cachedResult === 'true';
    }
    
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .list(`${reporterId}/${ticketId}`);

    if (error) {
      console.error("Error checking attachments:", error);
      throw error;
    }
    
    const hasAttachments = data && data.length > 0;
    
    // Cache the result for 5 minutes
    try {
      sessionStorage.setItem(cacheKey, hasAttachments ? 'true' : 'false');
      setTimeout(() => {
        sessionStorage.removeItem(cacheKey);
      }, 5 * 60 * 1000);
    } catch (e) {
      console.warn("Could not cache attachment check result", e);
    }
    
    return hasAttachments;
  } catch (err) {
    console.error("Error checking ticket attachments:", err);
    return false;
  }
};
