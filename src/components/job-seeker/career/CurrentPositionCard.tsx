
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseIcon } from "lucide-react";

interface CurrentPositionCardProps {
  currentPosition: {
    title?: string;
    company?: string;
    duration?: string;
    description?: string;
  } | null;
}

export const CurrentPositionCard = ({ currentPosition }: CurrentPositionCardProps) => {
  if (!currentPosition) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center">
          <BriefcaseIcon className="h-5 w-5 mr-2" />
          Current Position
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentPosition.title && (
            <div>
              <h3 className="font-semibold text-lg">{currentPosition.title}</h3>
              {currentPosition.company && (
                <p className="text-muted-foreground">{currentPosition.company}</p>
              )}
              {currentPosition.duration && (
                <p className="text-sm text-muted-foreground">{currentPosition.duration}</p>
              )}
            </div>
          )}
          {currentPosition.description && (
            <p className="text-sm">{currentPosition.description}</p>
          )}
          {(!currentPosition.title && !currentPosition.description) && (
            <p className="text-muted-foreground italic">No current position information available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
