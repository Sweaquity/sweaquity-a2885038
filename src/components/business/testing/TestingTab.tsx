
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "./KanbanBoard";
import { GanttChartView } from "./GanttChartView";
import { TimeTracker } from "./TimeTracker";

export function TestingTab() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Project Management Tools</h2>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="kanban" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
            <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="kanban" className="space-y-4">
            <KanbanBoard 
              projectId={selectedProjectId} 
              onTicketSelect={(ticketId) => setSelectedTicketId(ticketId)}
            />
          </TabsContent>
          
          <TabsContent value="gantt" className="space-y-4">
            <GanttChartView projectId={selectedProjectId} />
          </TabsContent>
          
          <TabsContent value="time-tracking" className="space-y-4">
            <TimeTracker 
              ticketId={selectedTicketId || ""} 
              userId="" // This will be populated with the current user's ID
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
