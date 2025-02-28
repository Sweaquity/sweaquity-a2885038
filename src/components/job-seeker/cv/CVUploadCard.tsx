
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { 
  FileUp, 
  Loader2, 
  FileX, 
  ExternalLink, 
  AlertCircle, 
  Download, 
  Trash2, 
  Check,
  Eye
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { 
  setupCvStorageBucket, 
  downloadCV,
  deleteCV,
  previewCV,
  setDefaultCV
} from "@/utils/setupStorage";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CVFile } from "@/hooks/job-seeker/useCVData";

interface CVUploadCardProps {
  cvUrl: string | null;
  parsedCvData?: any;
  userCVs?: CVFile[];
  onCvListUpdated?: () => void;
}

export const CVUploadCard = ({ cvUrl, parsedCvData, userCVs = [], onCvListUpdated }: CVUploadCardProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [bucketReady, setBucketReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<{type: string, fileName: string} | null>(null);

  useEffect(() => {
    if (cvUrl) {
      setDisplayUrl(cvUrl);
    }
    
    // Check if the CV storage bucket exists
    const checkStorage = async () => {
      try {
        const ready = await setupCvStorageBucket();
        setBucketReady(ready);
        if (!ready) {
          setStorageError("CV storage is not ready yet. Please try again later or contact support.");
          console.log("CV storage bucket not ready");
        }
      } catch (error) {
        console.error("Error checking storage:", error);
        setStorageError("Error checking CV storage availability.");
      }
    };
    
    checkStorage();
  }, [cvUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      // Only accept PDF files
      if (selectedFile.type !== 'application/pdf') {
        toast.error("Please upload a PDF file");
        return;
      }
      setFile(selectedFile);
    }
  };

  // Helper function to simulate progress updates
  const simulateProgress = () => {
    // Reset progress
    setUploadProgress(0);
    
    // Simulate progress updates
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        // Start slow, accelerate in the middle, then slow down approaching 90%
        const increment = prev < 30 ? 5 : prev < 70 ? 10 : 2;
        const newValue = Math.min(prev + increment, 90);
        
        // Stop at 90% - the final 10% will be set after upload completes
        if (newValue >= 90) {
          clearInterval(interval);
        }
        
        return newValue;
      });
    }, 300);
    
    // Return the interval ID so it can be cleared
    return interval;
  };

  const uploadCV = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    
    if (!bucketReady) {
      toast.error("CV storage is not available yet. Please try again later or contact support.");
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Start simulating progress updates
      const progressInterval = simulateProgress();
      
      // Get the current user's ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        clearInterval(progressInterval);
        toast.error("You must be logged in to upload a CV");
        return;
      }
      
      const userId = session.user.id;
      
      // Set the file path to include the user ID as a folder
      const filePath = `${userId}/${file.name}`;
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from('cvs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      // Clear the progress simulation interval
      clearInterval(progressInterval);
        
      if (error) {
        throw error;
      }
      
      // Set progress to 100% when upload is done
      setUploadProgress(100);
      
      // Create a public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('cvs')
        .getPublicUrl(filePath);
        
      const publicUrl = publicUrlData.publicUrl;
      
      // If this is the first CV, set it as default
      if (!cvUrl) {
        // Save the CV URL to the profile
        await supabase
          .from('profiles')
          .update({ cv_url: publicUrl })
          .eq('id', userId);
          
        // Check if we need to create a CV parsed data entry
        const { data: existingData } = await supabase
          .from('cv_parsed_data')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (!existingData) {
          await supabase
            .from('cv_parsed_data')
            .insert({
              user_id: userId,
              cv_url: publicUrl
            });
        } else {
          await supabase
            .from('cv_parsed_data')
            .update({ cv_url: publicUrl })
            .eq('user_id', userId);
        }
        
        // Trigger CV parsing function (if available)
        try {
          await supabase.functions.invoke('parse-cv', {
            body: { userId, cvUrl: publicUrl }
          });
        } catch (parseError) {
          console.error("CV parsing function error:", parseError);
          // Continue even if parsing fails
        }
        
        setDisplayUrl(publicUrl);
      }
      
      toast.success("CV uploaded successfully");
      
      if (onCvListUpdated) {
        onCvListUpdated();
      }
      
    } catch (error: any) {
      console.error("Error uploading CV:", error);
      toast.error(error.message || "Failed to upload CV");
    } finally {
      setIsUploading(false);
      setFile(null);
      
      // Reset the progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
      
      // Reset the file input
      const fileInput = document.getElementById('cv-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const handleDownload = async (fileName: string) => {
    setProcessingAction({ type: 'downloading', fileName });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to download CVs");
        return;
      }

      await downloadCV(session.user.id, fileName);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      setProcessingAction({ type: 'deleting', fileName });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast.error("You must be logged in to delete CVs");
          return;
        }

        const success = await deleteCV(session.user.id, fileName);
        if (success && onCvListUpdated) {
          onCvListUpdated();
        }
      } finally {
        setProcessingAction(null);
      }
    }
  };

  const handlePreview = async (fileName: string) => {
    setProcessingAction({ type: 'previewing', fileName });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to preview CVs");
        return;
      }

      await previewCV(session.user.id, fileName);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSetDefault = async (fileName: string) => {
    setProcessingAction({ type: 'setting-default', fileName });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to set default CV");
        return;
      }

      const newUrl = await setDefaultCV(session.user.id, fileName);
      if (newUrl) {
        setDisplayUrl(newUrl);
        if (onCvListUpdated) {
          onCvListUpdated();
        }
      }
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CV / Resume</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {storageError && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{storageError}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          {displayUrl && (
            <div>
              <Label className="text-muted-foreground">Default CV</Label>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm truncate max-w-[250px]">{displayUrl.split('/').pop()}</p>
                <Button variant="outline" onClick={() => handlePreview(displayUrl.split('/').pop() || '')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View CV
                </Button>
              </div>
            </div>
          )}
          
          <div>
            <Label>Upload new CV</Label>
            <div className="mt-2 flex items-end gap-3">
              <div className="flex-1">
                <input
                  id="cv-upload"
                  type="file"
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90"
                  onChange={handleFileChange}
                  accept="application/pdf"
                  disabled={!bucketReady}
                />
              </div>
              <Button 
                onClick={uploadCV} 
                disabled={!file || isUploading || !bucketReady}
                variant="secondary"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadProgress}%
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            
            {/* Show progress bar when uploading */}
            {isUploading && (
              <div className="mt-2">
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        </div>
        
        {/* Show list of user's CVs */}
        {userCVs.length > 0 && (
          <div className="mt-6">
            <Label>My CV Library</Label>
            <div className="mt-2 border rounded-md divide-y">
              {userCVs.map((cv) => (
                <div key={cv.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`default-${cv.id}`}
                      checked={cv.isDefault}
                      onCheckedChange={() => {
                        if (!cv.isDefault) {
                          handleSetDefault(cv.name);
                        }
                      }}
                      disabled={cv.isDefault || Boolean(processingAction)}
                    />
                    <Label 
                      htmlFor={`default-${cv.id}`}
                      className={`text-sm ${cv.isDefault ? 'font-semibold' : ''}`}
                    >
                      {cv.name}
                      {cv.isDefault && <span className="text-xs text-muted-foreground ml-2">(Default)</span>}
                    </Label>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePreview(cv.name)}
                      disabled={Boolean(processingAction)}
                    >
                      {processingAction?.type === 'previewing' && processingAction.fileName === cv.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownload(cv.name)}
                      disabled={Boolean(processingAction)}
                    >
                      {processingAction?.type === 'downloading' && processingAction.fileName === cv.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(cv.name)}
                      disabled={Boolean(processingAction)}
                      className="text-destructive hover:text-destructive"
                    >
                      {processingAction?.type === 'deleting' && processingAction.fileName === cv.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!bucketReady && (
          <div className="text-sm text-yellow-600 flex items-center gap-2 p-2 bg-yellow-50 rounded-md">
            <FileX className="h-4 w-4" />
            <span>CV storage is not available yet. Please check back later or contact support.</span>
          </div>
        )}
        
        {bucketReady && userCVs.length === 0 && !displayUrl && (
          <div className="text-sm text-muted-foreground">
            <p>Upload your CV to help us understand your skills and experience. We'll automatically extract information to enhance your profile.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
