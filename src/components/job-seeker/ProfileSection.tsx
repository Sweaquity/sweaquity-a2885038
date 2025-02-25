
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ProfileSectionProps {
  cvUrl: string | null;
  parsedCvData: any;
  skills: string[];
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSkillsUpdate: (skills: string[]) => void;
}

export const ProfileSection = ({
  cvUrl,
  parsedCvData,
  skills,
  handleFileUpload,
  onSkillsUpdate,
}: ProfileSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [bulkSkills, setBulkSkills] = useState("");

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
    const maxSize = 10 * 1024 * 1024;
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

  const handleBulkSkillsSubmit = () => {
    if (!bulkSkills.trim()) {
      toast.error("Please enter some skills");
      return;
    }

    const newSkills = bulkSkills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    const uniqueSkills = Array.from(new Set([...skills, ...newSkills]));
    onSkillsUpdate(uniqueSkills);
    setBulkSkills("");
    toast.success("Skills updated successfully");
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
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Preview CV</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[80vh]">
                    <iframe 
                      src={cvUrl} 
                      className="w-full h-full"
                      title="CV Preview"
                    />
                  </DialogContent>
                </Dialog>
                <Button asChild variant="outline">
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                    Download CV
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            Add your skills manually or they will be automatically extracted from your CV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bulk-skills">Add Multiple Skills (comma-separated)</Label>
            <Textarea
              id="bulk-skills"
              placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)"
              value={bulkSkills}
              onChange={(e) => setBulkSkills(e.target.value)}
              className="mt-2"
            />
            <Button 
              onClick={handleBulkSkillsSubmit}
              className="mt-2"
            >
              Add Skills
            </Button>
          </div>
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
