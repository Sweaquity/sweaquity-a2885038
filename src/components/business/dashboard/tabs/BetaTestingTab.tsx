
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobSeekerProjectsTab } from "@/components/job-seeker/dashboard/tabs/JobSeekerProjectsTab";
import { TaskCompletionReview } from "../../projects/TaskCompletionReview";
import { BetaTestingTab as SharedBetaTestingTab } from "@/components/shared/beta-testing/BetaTestingTab";

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
              <TabsTrigger value="tickets">All Tickets</TabsTrigger>
              <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
              <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
              <TabsTrigger value="beta-tickets">Beta Testing Tickets</TabsTrigger>
              <TabsTrigger value="task-review">Task Completion Review</TabsTrigger>
            </TabsList>
            
            {/* Use JobSeekerProjectsTab for consistent UI and functionality */}
            <TabsContent value="tickets">
              <JobSeekerProjectsTab userId={userId} initialTabValue="all-tickets" />
            </TabsContent>
            
            <TabsContent value="project-tasks">
              <JobSeekerProjectsTab userId={userId} initialTabValue="project-tasks" />
            </TabsContent>
            
            <TabsContent value="project-tickets">
              <JobSeekerProjectsTab userId={userId} initialTabValue="project-tickets" />
            </TabsContent>
            
            <TabsContent value="beta-tickets">
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
