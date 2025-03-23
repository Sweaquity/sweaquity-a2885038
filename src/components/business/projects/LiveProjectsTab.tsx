// Modify only the getGanttTasks function and Gantt display section to fix type errors
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/types";
import { toast } from "sonner";
import { FilterBar } from "@/components/ticket/FilterBar";
import { KanbanBoard } from "@/components/ticket/KanbanBoard";
import { TaskCompletionReview } from "../projects/TaskCompletionReview";
import { GanttChartView } from "../testing/GanttChartView";
import { DragDropContext } from "react-beautiful-dnd";

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  description?: string;
  due_date?: string;
  assigned_to?: string;
  reporter?: string;
  task_id?: string;
}

export const LiveProjectsTab = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .not('project_id', 'is', null);

      if (error) throw error;
      setTickets(data || []);
      setFilteredTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success("Ticket status updated");
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error("Failed to update ticket status");
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (newFilters: any) => {
    let filtered = [...tickets];

    if (newFilters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === newFilters.status);
    }

    if (newFilters.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === newFilters.priority);
    }

    setFilteredTickets(filtered);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    updateTicketStatus(draggableId, destination.droppableId);
  };

  const handleTicketClick = async (ticket: Ticket) => {
    if (!ticket.task_id) return;

    try {
      const { data, error } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('task_id', ticket.task_id)
        .single();

      if (error) throw error;
      setSelectedTask(data);
      setShowReviewDialog(true);
    } catch (error) {
      console.error('Error fetching task details:', error);
      toast.error("Failed to load task details");
    }
  };

  const approveTaskCompletion = async () => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from('project_sub_tasks')
        .update({ task_status: 'completed' })
        .eq('task_id', selectedTask.task_id);

      if (error) throw error;
      toast.success("Task completion approved!");
      setShowReviewDialog(false);
      fetchTickets();
    } catch (error) {
      console.error('Error approving task completion:', error);
      toast.error("Failed to approve task completion");
    }
  };

  const rejectTaskCompletion = async () => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from('project_sub_tasks')
        .update({ task_status: 'in_progress' })
        .eq('task_id', selectedTask.task_id);

      if (error) throw error;
      toast.success("Task completion rejected");
      setShowReviewDialog(false);
      fetchTickets();
    } catch (error) {
      console.error('Error rejecting task completion:', error);
      toast.error("Failed to reject task completion");
    }
  };

  const getGanttTasks = (): any[] => {
    return tickets.map(ticket => ({
      id: ticket.id,
      name: ticket.title, // Add name property for gantt-task-react
      title: ticket.title,
      start: new Date(new Date().setDate(new Date().getDate() - 3)),
      end: ticket.due_date ? new Date(ticket.due_date) : new Date(new Date().setDate(new Date().getDate() + 4)),
      progress: ticket.status === 'done' ? 100 :
               ticket.status === 'review' ? 75 :
               ticket.status === 'in-progress' ? 50 :
               ticket.status === 'blocked' ? 25 : 0,
      type: 'task', // Use string instead of TaskType enum
      isDisabled: false
    }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Tickets</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={fetchTickets}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="kanban">
            <TabsList className="mb-4">
              <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
              <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
            </TabsList>
            
            <TabsContent value="kanban">
              <FilterBar 
                onFilterChange={handleFilterChange} 
                statuses={['all', 'todo', 'in-progress', 'review', 'done', 'closed']}
                priorities={['all', 'low', 'medium', 'high', 'urgent']}
              />
              
              <div className="mt-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <KanbanBoard 
                    tickets={filteredTickets} 
                    onStatusChange={updateTicketStatus}
                    onTicketClick={handleTicketClick}
                  />
                </DragDropContext>
              </div>
            </TabsContent>
            
            <TabsContent value="gantt">
              {/* Cast gantt tasks to any to avoid type errors */}
              <GanttChartView tasks={getGanttTasks()} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Task review dialog */}
      {selectedTask && (
        <TaskCompletionReview
          isOpen={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          task={selectedTask}
          onApprove={approveTaskCompletion}
          onReject={rejectTaskCompletion}
        />
      )}
    </div>
  );
};
