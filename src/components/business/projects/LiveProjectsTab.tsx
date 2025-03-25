
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BetaTestingTab } from "@/components/shared/beta-testing/BetaTestingTab";

interface LiveProjectsTabProps {
  businessId: string;
}

export const LiveProjectsTab = ({ businessId }: LiveProjectsTabProps) => {
  return (
    <div>
      <BetaTestingTab 
        userType="business" 
        userId={businessId} 
        includeProjectTickets={true} 
      />
    </div>
  );
};
