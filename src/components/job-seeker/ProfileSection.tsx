
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
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
  const [selectedCVs, setSelectedCVs] = useState<string[]>([]);

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

  const handleDeleteSkill = (skillToDelete: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToDelete);
    onSkillsUpdate(updatedSkills);
    toast.success(`Removed skill: ${skillToDelete}`);
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

  const handleDeleteCV = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Extract the file path from the URL
      const filePathMatch = cvUrl?.match(/cvs\/([^?]+)/);
      if (!filePathMatch) {
        toast.error("Invalid CV URL");
        return;
      }

      const filePath = filePathMatch[1];

      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('cvs')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Clear CV data from cv_parsed_data
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
                    </DialogHeader>
                    <object 
                      data={cvUrl} 
                      type="application/pdf" 
                      width="100%" 
                      height="100%"
                      className="rounded-md"
                    >
                      <iframe 
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(cvUrl)}&embedded=true`}
                        width="100%"
                        height="100%"
                        title="CV Preview"
                      />
                    </object>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline"
                  onClick={() => window.open(cvUrl, '_blank')}
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
                className="group bg-secondary px-3 py-1 rounded-full text-sm hover:bg-secondary/80 transition-colors flex items-center gap-2"
              >
                {skill}
                <button
                  onClick={() => handleDeleteSkill(skill)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                  aria-label={`Delete ${skill} skill`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {parsedCvData?.career_history && parsedCvData.career_history.length > 0 && (
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
