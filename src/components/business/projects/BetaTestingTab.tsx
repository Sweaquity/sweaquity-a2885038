import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanBoard } from '@/components/business/testing/KanbanBoard';
import { GanttChartView } from '@/components/business/testing/GanttChartView';
import { TimeTracker } from '@/components/business/testing/TimeTracker';
import { Ticket, Task } from '@/types/types';
import { toast } from 'sonner';
// Fix the import path for TaskCompletionReview
import { TaskCompletionReview } from '@/components/business/projects/TaskCompletionReview';

interface BetaTestingTabProps {
  projectId: string;
  tickets: Ticket[];
  tasks: Task[];
  onTicketUpdate: (updatedTicket: Ticket) => void;
  onTicketCreate: (newTicket: Partial<Ticket>) => void;
  onTaskUpdate: (updatedTask: Task) => void;
  isLoading: boolean;
}

export const BetaTestingTab = ({
  projectId,
  tickets,
  tasks,
  onTicketUpdate,
  onTicketCreate,
  onTaskUpdate,
  isLoading
}: BetaTestingTabProps) => {
  const [activeTab, setActiveTab] = useState('kanban');
  const [openCompletionReview, setOpenCompletionReview] = useState(false);
  const [selectedTicketForReview, setSelectedTicketForReview] = useState<Ticket | null>(null);

  const handleTicketStatusChange = (ticketId: string, newStatus: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      onTicketUpdate({
        ...ticket,
        status: newStatus
      });
    }
  };

  const handleTaskProgressChange = (taskId: string, progress: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      onTaskUpdate({
        ...task,
        progress,
        completion: progress
      });
    }
  };

  const handleCompletionReview = (ticket: Ticket) => {
    setSelectedTicketForReview(ticket);
    setOpenCompletionReview(true);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard 
            tickets={tickets}
            onStatusChange={handleTicketStatusChange}
            onTicketCreate={onTicketCreate}
            projectId={projectId}
            isLoading={isLoading}
            onCompletionReview={handleCompletionReview}
          />
        </TabsContent>
        
        <TabsContent value="gantt" className="mt-4">
          <GanttChartView 
            tasks={tasks}
            onProgressChange={handleTaskProgressChange}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="time" className="mt-4">
          <TimeTracker 
            tickets={tickets}
            projectId={projectId}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      <TaskCompletionReview
        ticket={selectedTicketForReview}
        open={openCompletionReview}
        onOpenChange={setOpenCompletionReview}
        onUpdate={() => {
          // Refresh tickets after update
          if (selectedTicketForReview) {
            toast.success(`Updated completion for ${selectedTicketForReview.title}`);
          }
        }}
      />
    </div>
  );
};
