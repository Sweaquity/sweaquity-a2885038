
import { useState } from "react";
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

interface CVUploadCardProps {
  cvUrl: string | null;
  parsedCvData: any;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CVUploadCard = ({
  cvUrl,
  parsedCvData,
  handleFileUpload,
}: CVUploadCardProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCVs, setSelectedCVs] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      await handleFileUpload(event);
      toast.success("CV uploaded successfully");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload CV");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadCV = async () => {
    try {
      if (!cvUrl) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const filePathMatch = cvUrl.match(/cvs\/([^?]+)/);
      if (!filePathMatch) {
        toast.error("Invalid CV URL");
        return;
      }

      const filePath = filePathMatch[1];

      const { data, error } = await supabase.storage
        .from('cvs')
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

  const handleDeleteCV = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const filePathMatch = cvUrl?.match(/cvs\/([^?]+)/);
      if (!filePathMatch) {
        toast.error("Invalid CV URL");
        return;
      }

      const filePath = filePathMatch[1];

      const { error: storageError } = await supabase.storage
        .from('cvs')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('cv_parsed_data')
        .delete()
        .eq('user_id', session.user.id);

      if (dbError) throw dbError;

      toast.success("CV deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete CV");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CV Management</CardTitle>
        <CardDescription>
          Upload your CV and if possible this will automatically extract your skills and experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cv-upload">Upload CV</Label>
          <Input
            id="cv-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            disabled={isUploading}
            className="mt-2"
          />
          {parsedCvData?.cv_upload_date && (
            <p className="text-sm text-muted-foreground mt-2">
              Last uploaded: {new Date(parsedCvData.cv_upload_date).toLocaleDateString()}
            </p>
          )}
        </div>
        {cvUrl && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cv-select"
                checked={selectedCVs.includes(cvUrl)}
                onCheckedChange={(checked) => {
                  setSelectedCVs(checked ? [cvUrl] : []);
                }}
              />
              <Label htmlFor="cv-select">Current CV</Label>
            </div>
            <div className="flex space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Preview CV</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>CV Preview</DialogTitle>
                    <DialogDescription>
                      Your uploaded CV document
                    </DialogDescription>
                  </DialogHeader>
                  {!previewError ? (
                    <iframe 
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(cvUrl)}&embedded=true`}
                      width="100%"
                      height="100%"
                      className="rounded-md"
                      onError={() => setPreviewError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <p className="text-muted-foreground">Preview not available</p>
                      <Button 
                        variant="outline"
                        onClick={() => window.open(cvUrl, '_blank')}
                      >
                        Open CV in new tab
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline"
                onClick={handleDownloadCV}
              >
                Download CV
              </Button>
              {selectedCVs.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteCV}
                >
                  Delete CV
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
