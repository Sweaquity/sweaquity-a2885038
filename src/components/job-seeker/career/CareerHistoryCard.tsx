
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";

interface CareerHistoryCardProps {
  careerHistory: Array<{
    title: string;
    company: string;
    duration?: string;
  }>;
}

export const CareerHistoryCard = ({ careerHistory }: CareerHistoryCardProps) => {
  if (!careerHistory || careerHistory.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Career History</CardTitle>
        <CardDescription>
          Experience extracted from your CV
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {careerHistory.map((position, index) => (
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
  );
};
