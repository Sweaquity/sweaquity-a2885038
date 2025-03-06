
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface CVUploadFormProps {
  cvUrl: string | null;
  onUploadComplete: () => void;
}

export const CVUploadForm = ({ cvUrl, onUploadComplete }: CVUploadFormProps) => {
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

  const parseCV = async (userId: string, cvUrl: string) => {
    try {
      toast.info("Analysing your CV for skills and experience...");
      
      console.log("Processing CV for parsing:", cvUrl);
      
      // Create FormData with just the userId and cvUrl
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('cvUrl', cvUrl);
      
      console.log("Calling parse-cv function with userId and cvUrl");
      
      // Call the parse-cv function with userId and cvUrl
      const { data, error } = await supabase.functions.invoke('parse-cv', {
        body: formData
      });
      
      if (error) {
        console.error("CV parsing function error:", error);
        throw error;
      }
      
      console.log("CV parsed successfully:", data);
      toast.success("CV analysed successfully! Your skills have been updated.");
      
      // Refresh the page after a short delay to show the parsed data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error("Error parsing CV:", error);
      toast.error("Failed to analyse CV. Please try again later.");
    }
  };

  const uploadCV = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
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
      }
      
      toast.success("CV uploaded successfully");
      
      // Now trigger the CV parsing function
      await parseCV(userId, publicUrl);
      
      onUploadComplete();
      
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
          />
        </div>
        <Button 
          onClick={uploadCV} 
          disabled={!file || isUploading}
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
