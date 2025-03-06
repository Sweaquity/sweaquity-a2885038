
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";

interface EducationCardProps {
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
}

export const EducationCard = ({ education }: EducationCardProps) => {
  if (!education || education.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Education</CardTitle>
        <CardDescription>
          Education background extracted from your CV
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {education.map((edu, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <h4 className="font-medium">{edu.degree}</h4>
              <p className="text-sm text-muted-foreground">{edu.institution}</p>
              {edu.year && (
                <p className="text-sm text-muted-foreground mt-1">{edu.year}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
