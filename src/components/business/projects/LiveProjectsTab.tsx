
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface LiveProjectsTabProps {
  businessId: string;
}

export const LiveProjectsTab = ({ businessId }: LiveProjectsTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>IGNORE</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This tab is deprecated and will be removed soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};
