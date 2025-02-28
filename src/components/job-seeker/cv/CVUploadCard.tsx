
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { FileText, File, Trash2 } from "lucide-react";

interface CVUploadCardProps {
  cvUrl: string | null;
  parsedCvData: any;
}

export const CVUploadCard = ({
  cvUrl,
  parsedCvData,
}: CVUploadCardProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCVs, setSelectedCVs] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState(false);
  const [storedCVs, setStoredCVs] = useState<{path: string, url: string, name: string}[]>([]);
  const [isFetchingCVs, setIsFetchingCVs] = useState(false);

  useEffect(() => {
    fetchStoredCVs();
  }, []);

  const fetchStoredCVs = async () => {
    try {
      setIsFetchingCVs(true);
      
      // Check if the storage bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const cvsBucketExists = buckets?.some(bucket => bucket.name === 'cvs');
      
      if (!cvsBucketExists) {
        console.log("CV storage bucket doesn't exist, attempting to create it");
        try {
          const { error: bucketError } = await supabase.storage.createBucket('cvs', {
            public: true
          });
          
          if (bucketError) {
            console.error("Error creating cvs bucket:", bucketError);
            return;
          } else {
            console.log("Successfully created cvs bucket");
          }
        } catch (bucketErr) {
          console.error("Error creating storage bucket:", bucketErr);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      // Get all files for this user
      const { data: files, error } = await supabase.storage
        .from('cvs')
        .list(`${session.user.id}`);

      if (error) {
        console.error("Error fetching stored CVs:", error);
        return;
      }

      if (!files || files.length === 0) {
        return;
      }

      console.log("Found stored CVs:", files);

      // Generate public URLs
      const cvFiles = files.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('cvs')
          .getPublicUrl(`${session.user.id}/${file.name}`);
          
        return {
          path: `${session.user.id}/${file.name}`,
          url: publicUrl,
          name: file.name.split('-').slice(1).join('-') // Remove timestamp prefix
        };
      });

      setStoredCVs(cvFiles);

      // If we have a current CV URL, check if it matches any of the stored CVs
      if (cvUrl) {
        const matchingCV = cvFiles.find(cv => cv.url === cvUrl);
        if (matchingCV) {
          setSelectedCVs([matchingCV.url]);
        }
      }
    } catch (error) {
      console.error("Error fetching stored CVs:", error);
    } finally {
      setIsFetchingCVs(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(fileType)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size should be less than 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to upload a CV");
        return;
      }

      // Check if the bucket exists, if not create it
      const { data: buckets } = await supabase.storage.listBuckets();
      const cvsBucketExists = buckets?.some(bucket => bucket.name === 'cvs');
      
      if (!cvsBucketExists) {
        console.log("CV storage bucket doesn't exist, attempting to create it");
        const { error: bucketError } = await supabase.storage.createBucket('cvs', {
          public: true
        });
        
        if (bucketError) {
          console.error("Error creating cvs bucket:", bucketError);
          toast.error("Failed to create storage for CVs");
          return;
        }
      }

      // Upload file to Supabase Storage
      const fileName = `${session.user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cvs')
        .getPublicUrl(fileName);

      // Update profile with CV URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cv_url: urlData.publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Also add to cv_parsed_data if it doesn't exist
      const { data: cvData } = await supabase
        .from('cv_parsed_data')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
        
      if (!cvData) {
        await supabase
          .from('cv_parsed_data')
          .insert({
            user_id: session.user.id,
            cv_url: urlData.publicUrl,
            cv_upload_date: new Date().toISOString()
          });
      } else {
        await supabase
          .from('cv_parsed_data')
          .update({
            cv_url: urlData.publicUrl,
            cv_upload_date: new Date().toISOString()
          })
          .eq('user_id', session.user.id);
      }

      toast.success("CV uploaded successfully");
      
      // Refresh the list of stored CVs
      await fetchStoredCVs();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload CV");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadCV = async (cvUrl: string) => {
    try {
      if (!cvUrl) return;

      // Extract file path from URL
      const urlObj = new URL(cvUrl);
      const pathSegments = urlObj.pathname.split('/');
      const bucketName = 'cvs';
      const filePathArray = pathSegments.slice(pathSegments.indexOf('cvs') + 1);
      const filePath = filePathArray.join('/');
      
      console.log("Downloading file:", bucketName, filePath);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60);

      if (error) throw error;

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = filePath.split('/').pop() || 'cv.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download CV");
    }
  };

  const handleDeleteCV = async (cvUrl: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Find the corresponding CV file
      const cv = storedCVs.find(cv => cv.url === cvUrl);
      if (!cv) {
        toast.error("CV not found");
        return;
      }

      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from('cvs')
        .remove([cv.path]);

      if (storageError) throw storageError;

      // Update profile if this was the active CV
      if (cvUrl === this.cvUrl) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ cv_url: null })
          .eq('id', session.user.id);
          
        if (profileError) throw profileError;
        
        // Also update cv_parsed_data
        const { error: cvDataError } = await supabase
          .from('cv_parsed_data')
          .update({ cv_url: null })
          .eq('user_id', session.user.id);
          
        if (cvDataError) throw cvDataError;
      }

      toast.success("CV deleted successfully");
      
      // Refresh the list
      await fetchStoredCVs();
      setSelectedCVs([]);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete CV");
    }
  };

  const handleSetAsActive = async (cvUrl: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Update profile with the selected CV URL
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ cv_url: cvUrl })
        .eq('id', session.user.id);
        
      if (profileError) throw profileError;
      
      // Also update cv_parsed_data
      const { data: cvData, error: cvCheckError } = await supabase
        .from('cv_parsed_data')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
        
      if (cvCheckError && cvCheckError.code !== 'PGRST116') {
        // PGRST116 is the error code for no rows returned
        throw cvCheckError;
      }
      
      if (cvData) {
        const { error: cvUpdateError } = await supabase
          .from('cv_parsed_data')
          .update({ cv_url: cvUrl })
          .eq('user_id', session.user.id);
          
        if (cvUpdateError) throw cvUpdateError;
      } else {
        const { error: cvInsertError } = await supabase
          .from('cv_parsed_data')
          .insert({
            user_id: session.user.id,
            cv_url: cvUrl,
            cv_upload_date: new Date().toISOString()
          });
          
        if (cvInsertError) throw cvInsertError;
      }
      
      toast.success("CV set as active");
      
      // Update URL in the component
      window.location.reload();
    } catch (error) {
      console.error('Error setting active CV:', error);
      toast.error("Failed to set CV as active");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CV Management</CardTitle>
        <CardDescription>
          Upload your CV or select from previously uploaded files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cv-upload">Upload New CV</Label>
          <Input
            id="cv-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="mt-2"
          />
          {isUploading && (
            <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
          )}
          {parsedCvData?.cv_upload_date && (
            <p className="text-sm text-muted-foreground mt-2">
              Last uploaded: {new Date(parsedCvData.cv_upload_date).toLocaleDateString()}
            </p>
          )}
        </div>
        
        {isFetchingCVs ? (
          <p className="text-sm text-muted-foreground">Loading stored CVs...</p>
        ) : storedCVs.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Your Stored CVs</h3>
            <div className="space-y-2">
              {storedCVs.map((cv, index) => (
                <div 
                  key={index}
                  className={`
                    flex items-center justify-between p-3 rounded-md border
                    ${cv.url === cvUrl ? 'border-primary bg-primary/5' : 'border-border'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{cv.name}</p>
                      {cv.url === cvUrl && (
                        <Badge variant="secondary" className="text-xs mt-1">Active</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadCV(cv.url)}
                    >
                      Download
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Preview</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>CV Preview</DialogTitle>
                          <DialogDescription>
                            {cv.name}
                          </DialogDescription>
                        </DialogHeader>
                        <iframe 
                          src={`https://docs.google.com/viewer?url=${encodeURIComponent(cv.url)}&embedded=true`}
                          width="100%"
                          height="100%"
                          className="rounded-md"
                          onError={() => setPreviewError(true)}
                        />
                      </DialogContent>
                    </Dialog>
                    
                    {cv.url !== cvUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSetAsActive(cv.url)}
                      >
                        Set as Active
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteCV(cv.url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center">
            <File className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No CVs uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
