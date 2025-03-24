
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BetaTestingTab as SharedBetaTestingTab } from "@/components/shared/beta-testing/BetaTestingTab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCompletionReview } from "../../projects/TaskCompletionReview";

export const BetaTestingTab = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tickets");

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    getCurrentUser();
  }, []);

  if (!userId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="task-review">Task Completion Review</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tickets">
              <SharedBetaTestingTab 
                userType="business" 
                userId={userId} 
                includeProjectTickets={true} 
              />
            </TabsContent>
            
            <TabsContent value="task-review">
              <TaskCompletionReview businessId={userId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
