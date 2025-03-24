import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "./KanbanBoard";
import { DragDropContext } from "react-beautiful-dnd";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Ticket, TicketStatistics, UserData, BetaTicket } from "@/types/types";
import TicketStats from "@/components/ticket/TicketStats";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";

interface JobApplication {
  task_id?: string;
  project_id?: string;
  user_id: string;
  job_app_id?: string;
}

interface ExtendedBetaTicket extends BetaTicket {
  job_applications?: JobApplication | null;
  job_app_id?: string;
  isTaskTicket?: boolean;
  time_entries?: any[];
  total_hours_logged?: number;
}

interface BetaTestingTabProps {
  userType: "job_seeker" | "business";
  userId?: string;
  includeProjectTickets?: boolean;
}

export const BetaTestingTab = ({ 
  userType, 
  userId, 
  includeProjectTickets = false 
}: BetaTestingTabProps) => {
  const [tickets, setTickets] = useState<ExtendedBetaTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectTickets, setProjectTickets] = useState<ExtendedBetaTicket[]>([]);
  const [showKanban, setShowKanban] = useState(true);
  const [showDashboard, setShowDashboard] = useState(true);
  const [ticketStatistics, setTicketStatistics] = useState<TicketStatistics>({
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    byStatus: {},
    byPriority: {}
  });
  const [dashboardKey, setDashboardKey] = useState(0);
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  // Existing methods (createTicket, loadTickets, etc.) remain the same as in the previous implementation

  const addTicketNote = async (ticketId: string, note: string) => {
    if (!userId || !note.trim()) return;
    
    try {
      // Find the ticket to check if it's a task ticket
      const ticket = [...tickets, ...projectTickets].find(t => t.id === ticketId);
      if (!ticket) {
        toast.error("Ticket not found");
        return;
      }
  
      // Get current notes for the ticket
      const { data: ticketData, error: getError } = await supabase
        .from('tickets')
        .select('notes')
        .eq('id', ticketId)
        .single();
      
      if (getError) throw getError;
      
      const currentNotes = ticketData.notes || [];
      
      // Get username based on user type
      let userName = '';
      
      try {
        if (userType === 'job_seeker') {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();
            
          if (profileData) {
            userName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
          }
        } else {
          const { data: businessData } = await supabase
            .from('businesses')
            .select('company_name')
            .eq('businesses_id', userId)
            .single();
            
          if (businessData) {
            userName = businessData.company_name || '';
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        userName = userType === 'job_seeker' ? 'Job Seeker' : 'Business';
      }
      
      // Create new note object
      const newNote = {
        action: 'Note added',
        user: userName || 'User',
        timestamp: new Date().toISOString(),
        comment: note
      };
      
      const updatedNotes = [...currentNotes, newNote];
      
      // Update the ticket
      const { error } = await supabase
        .from('tickets')
        .update({ 
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      // If it's a task ticket and has a task_id, update the task's last activity timestamp
      if (ticket.isTaskTicket && ticket.task_id) {
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({ 
            last_activity_at: new Date().toISOString()
          })
          .eq('task_id', ticket.task_id);
        
        if (taskError) {
          console.error('Error updating task last activity:', taskError);
        }
      }
      
      toast.success("Note added successfully");
      
      // Reload tickets to refresh the UI
      await loadTickets();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error("Failed to add note");
    }
  };

  // Rest of the component remains the same as in the previous implementation

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Live Projects</CardTitle>
              <CardDescription>View and manage your project tasks</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowKanban(!showKanban)}
                size="sm"
              >
                {showKanban ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showKanban ? "Hide Kanban" : "Show Kanban"}
              </Button>
              <Button
                variant="outline" 
                onClick={() => setShowDashboard(!showDashboard)}
                size="sm"
              >
                {showDashboard ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showDashboard ? "Hide Dashboard" : "Show Dashboard"}
              </Button>
              <Button onClick={handleRefresh}>Refresh</Button>
              <Button onClick={createTicket}>Create Test Ticket</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              Loading tickets...
            </div>
          ) : allTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No tickets found.</p>
              <Button onClick={createTicket}>Create a test ticket</Button>
            </div>
          ) : (
            <>
              <TicketStats
                totalTickets={ticketStatistics.totalTickets || 0}
                openTickets={ticketStatistics.openTickets || 0}
                closedTickets={ticketStatistics.closedTickets || 0}
                highPriorityTickets={ticketStatistics.highPriorityTickets || 0}
                byStatus={ticketStatistics.byStatus || {}}
                byPriority={ticketStatistics.byPriority || {}}
              />
              
              {showKanban && (
                <DragDropContext onDragEnd={(result) => {
                  if (!result.destination) return;
                  const { draggableId, destination } = result;
                  
                  // Ensure we never pass an empty string as a status
                  const newStatus = destination.droppableId || 'new';
                  updateTicketStatus(draggableId, newStatus);
                }}>
                  <KanbanBoard 
                    tickets={allTickets} 
                    onStatusChange={(id, status) => {
                      // Ensure status is never an empty string
                      updateTicketStatus(id, status || 'new');
                    }}
                    onTicketClick={() => {}}
                  />
                </DragDropContext>
              )}
              
              {showDashboard && (
                <TicketDashboard
                  key={dashboardKey}
                  initialTickets={allTickets}
                  onRefresh={handleRefresh}
                  onTicketExpand={handleToggleTicket}
                  onTicketAction={handleTicketAction}
                  showTimeTracking={userType === 'job_seeker'}
                  currentUserId={userId}
                  onAddNote={addTicketNote}  // Add this prop to pass the note adding function
                />
              )}
              
              {/* TimeTracker section updated to show conditionally */}
              {userType === 'job_seeker' && selectedTicket && (
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Time Tracking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedTicket && userId && (
                        <TimeTracker 
                          ticketId={selectedTicket} 
                          userId={userId} 
                          jobAppId={(allTickets.find(t => t.id === selectedTicket) as ExtendedBetaTicket)?.job_app_id}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
