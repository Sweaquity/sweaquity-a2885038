
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { toast } from "sonner";

interface ProfileSectionProps {
  cvUrl: string | null;
  parsedCvData: any;
  skills: string[];
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileSection = ({
  cvUrl,
  parsedCvData,
  skills,
  handleFileUpload,
}: ProfileSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
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

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CV Management</CardTitle>
          <CardDescription>
            Upload your CV to automatically extract your skills and experience
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
              <p className="font-medium">Current CV</p>
              <Button asChild variant="outline">
                <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                  View CV
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            Skills extracted from your CV and additional skills you've added
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div 
                key={index} 
                className="bg-secondary px-3 py-1 rounded-full text-sm hover:bg-secondary/80 transition-colors"
              >
                {skill}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {parsedCvData?.career_history && (
        <Card>
          <CardHeader>
            <CardTitle>Career History</CardTitle>
            <CardDescription>
              Experience extracted from your CV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {parsedCvData.career_history.map((position: any, index: number) => (
                <div key={index} className="border p-4 rounded-lg">
                  <h4 className="font-medium">{position.title}</h4>
                  <p className="text-sm text-muted-foreground">{position.company}</p>
                  {position.duration && (
                    <p className="text-sm text-muted-foreground mt-1">{position.duration}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
