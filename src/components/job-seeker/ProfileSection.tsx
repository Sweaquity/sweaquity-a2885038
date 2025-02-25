
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4">CV & Portfolio Management</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cv-upload">Upload CV</Label>
            <Input
              id="cv-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
            {parsedCvData?.cv_upload_date && (
              <p className="text-sm text-muted-foreground mt-1">
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
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <div key={index} className="bg-secondary px-3 py-1 rounded-full text-sm">
              {skill}
            </div>
          ))}
        </div>
      </div>

      {parsedCvData?.career_history && (
        <div>
          <h3 className="font-medium mb-2">Career History</h3>
          <div className="space-y-4">
            {parsedCvData.career_history.map((position: any, index: number) => (
              <div key={index} className="border p-4 rounded-lg">
                <h4 className="font-medium">{position.title}</h4>
                <p className="text-sm text-muted-foreground">{position.company}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
