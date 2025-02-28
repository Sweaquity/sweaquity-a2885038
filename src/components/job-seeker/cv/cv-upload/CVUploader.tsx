
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileUp, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CVUploaderProps {
  bucketReady: boolean;
  onUploadSuccess: () => Promise<void>;
}

export const CVUploader = ({ bucketReady, onUploadSuccess }: CVUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
        const increment = prev < 30 ? 5 : prev < 70 ? 10 : 2;
        const newValue = Math.min(prev + increment, 90);
        
        if (newValue >= 90) {
          clearInterval(interval);
        }
        
        return newValue;
      });
    }, 300);
    
    return interval;
  };

  const uploadCV = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    
    if (!bucketReady) {
      toast.error("CV storage is not available yet. Please try refreshing bucket status.");
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
        setIsUploading(false);
        return;
      }
      
      const userId = session.user.id;
      
      // Sanitize the filename to remove non-ASCII characters
      const fileName = file.name;
      const sanitizedFileName = fileName.replace(/[^\x00-\x7F]/g, '_');
      
      // Get file extension (default to pdf if not found)
      const fileExt = fileName.split('.').pop() || 'pdf';
      
      // Create a unique filename with timestamp if needed
      const finalFileName = fileName !== sanitizedFileName 
        ? `cv_${Date.now()}.${fileExt}` 
        : sanitizedFileName;
      
      // Set the file path to include the user ID as a folder
      const filePath = `${userId}/${finalFileName}`;
      
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
        console.error("Upload error:", error);
        throw error;
      }
      
      // Set progress to 100% when upload is done
      setUploadProgress(100);
      
      // Create a public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('cvs')
        .getPublicUrl(filePath);
        
      const publicUrl = publicUrlData.publicUrl;
      
      // Check if this is the first CV
      const { data: profileData } = await supabase
        .from('profiles')
        .select('cv_url')
        .eq('id', userId)
        .maybeSingle();
      
      // If this is the first CV or no default CV exists, set it as default
      if (!profileData?.cv_url) {
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
      }
      
      toast.success("CV uploaded successfully");
      
      // Callback to reload the list of CVs
      await onUploadSuccess();
      
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

  return (
    <div>
      <Label htmlFor="cv-upload">Upload new CV</Label>
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
            disabled={!bucketReady || isUploading}
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
  );
};
