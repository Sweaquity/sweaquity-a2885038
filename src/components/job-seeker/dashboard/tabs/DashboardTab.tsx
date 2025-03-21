
import { ProjectsOverview } from "@/components/job-seeker/ProjectsOverview";
import { DashboardContent } from "@/components/job-seeker/dashboard/DashboardContent";
import { EquityProject, JobApplication, Profile, Skill } from "@/types/jobSeeker";
import { CVFile } from "@/hooks/job-seeker/useCVData";
import { Notification, TicketMessage, Task, TaskType } from "@/types/dashboard";
import { useEffect, useState } from "react";
import { useMessaging } from "@/components/job-seeker/dashboard/applications/hooks/useMessaging";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DragDropContext } from "react-beautiful-dnd";
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import React from "react";

// Components imports for the ticket UI
import { KanbanBoard, BetaTicket } from "@/components/shared/beta-testing/KanbanBoard";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
import { ExpandedTicketDetails } from "@/components/ticket/ExpandedTicketDetails";
import { AdminTicketManager } from "@/components/admin/tickets/AdminTicketManager";

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  due_date?: string;
  expanded?: boolean;
  task_id?: string;
  project_id?: string;
  description?: string;
}

interface TicketStats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
}

interface DashboardTabProps {
  activeTab: string;
  profile: Profile | null;
  cvUrl: string | null;
  parsedCvData: any;
  skills: Skill[] | null;
  applications: JobApplication[];
  equityProjects: EquityProject[];
  availableOpportunities: EquityProject[];
  userTickets?: any[];
  ticketMessages?: TicketMessage[];
  userNotifications?: Notification[];
  handleSkillsUpdate: (updatedSkills: Skill[]) => Promise<void>;
  refreshApplications: () => void;
  onDocumentAction: (projectId: string, action: 'edit' | 'approve') => void;
  onTicketAction?: (ticketId: string, action: string, data?: any) => void;
  userCVs?: CVFile[];
  onCvListUpdated?: () => void;
  refreshTickets?: () => void;
}

export const DashboardTab = ({
  activeTab,
  profile,
  cvUrl,
  parsedCvData,
  skills,
  applications,
  equityProjects,
  availableOpportunities,
  userTickets = [],
  ticketMessages = [],
  userNotifications = [],
  handleSkillsUpdate,
  refreshApplications,
  onDocumentAction,
  onTicketAction = () => {},
  userCVs = [],
  onCvListUpdated = () => {},
  refreshTickets = () => {},
}: DashboardTabProps) => {
  const { fetchMessages } = useMessaging();
  const [allTicketMessages, setAllTicketMessages] = useState<TicketMessage[]>(ticketMessages);
  // Track if we have already loaded messages for tickets
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  
  // State for ticket UI
  const [showKanban, setShowKanban] = useState(false);
  const [showGantt, setShowGantt] = useState(false);
  const [betaTickets, setBetaTickets] = useState<Ticket[]>([]);
  
  useEffect(() => {
    // Initialize with provided ticket messages
    setAllTicketMessages(ticketMessages);
  }, [ticketMessages]);
  
  useEffect(() => {
    // Only fetch messages if we're on the tickets tab and haven't loaded them yet
    if (activeTab === 'tickets' && userTickets.length > 0 && !messagesLoaded) {
      // Load messages for each ticket
      const loadAllTicketMessages = async () => {
        let allMessages: TicketMessage[] = [...allTicketMessages];
        const newMessages: TicketMessage[] = [];
        
        for (const ticket of userTickets) {
          if (ticket.id) {
            try {
              const messages = await fetchMessages(ticket.id);
              if (messages && messages.length > 0) {
                newMessages.push(...messages);
              }
            } catch (error) {
              console.error(`Error fetching messages for ticket ${ticket.id}:`, error);
            }
          }
        }
        
        // Add only new messages that aren't already in the state
        const existingIds = new Set(allMessages.map(msg => msg.id));
        const uniqueNewMessages = newMessages.filter(msg => msg.id && !existingIds.has(msg.id));
        
        if (uniqueNewMessages.length > 0) {
          setAllTicketMessages([...allMessages, ...uniqueNewMessages]);
        }
        
        setMessagesLoaded(true);
      };
      
      loadAllTicketMessages();
    }
  }, [activeTab, userTickets, allTicketMessages, messagesLoaded]);
  
  // Reset messages loaded state when tickets change
  useEffect(() => {
    setMessagesLoaded(false);
  }, [userTickets.length]);
  
  // Define a handler for ticket actions
  const handleTicketAction = async (ticketId: string, action: string, data?: any) => {
    // Perform the action using the provided handler
    await onTicketAction(ticketId, action, data);
    
    // If it's a reply action, refresh the messages for that specific ticket
    if ((action === 'reply' || action === 'update_status') && ticketId) {
      try {
        const newMessages = await fetchMessages(ticketId);
        if (newMessages && newMessages.length > 0) {
          // Get existing messages for other tickets
          const otherTicketsMessages = allTicketMessages.filter(msg => msg.ticketId !== ticketId);
          
          // Combine with new messages
          setAllTicketMessages([...otherTicketsMessages, ...newMessages]);
        }
      } catch (error) {
        console.error(`Error fetching messages after action for ticket ${ticketId}:`, error);
      }
    }
    
    // Refresh tickets after action if needed
    if (['create', 'update_status', 'delete'].includes(action)) {
      refreshTickets();
    }
  };

  // Transform userTickets into betaTickets with expanded property
  useEffect(() => {
    if (userTickets?.length > 0) {
      const formattedTickets = userTickets.map(ticket => ({
        ...ticket,
        expanded: false,
      }));
      setBetaTickets(formattedTickets);
    } else {
      setBetaTickets([]);
    }
  }, [userTickets]);

  // Calculate ticket statistics
  const ticketStats: TicketStats = React.useMemo(() => {
    return {
      totalTickets: betaTickets.length,
      openTickets: betaTickets.filter(t => t.status !== 'done').length,
      closedTickets: betaTickets.filter(t => t.status === 'done').length,
      highPriorityTickets: betaTickets.filter(t => t.priority === 'high').length,
    };
  }, [betaTickets]);

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  // Toggle expanded state for a ticket
  const toggleTicketExpanded = (ticketId: string) => {
    setBetaTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, expanded: !ticket.expanded } 
          : ticket
      )
    );
  };

  // Get tasks for Gantt chart
  const getGanttTasks = () => {
    return betaTickets.map(ticket => ({
      id: ticket.id,
      name: ticket.title,
      start: new Date(ticket.created_at),
      end: ticket.due_date ? new Date(ticket.due_date) : new Date(),
      progress: ticket.status === 'done' ? 100 : 
               ticket.status === 'review' ? 75 :
               ticket.status === 'in-progress' ? 50 :
               ticket.status === 'blocked' ? 25 : 0,
      type: 'task' as TaskType,
      isDisabled: false
    }));
  };

  // Render ticket management UI when activeTab is 'tickets'
  const renderTicketManagementUI = () => {
    if (activeTab !== 'tickets') return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Beta Testing Tickets</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKanban(!showKanban)}
              >
                {showKanban ? "Hide" : "Show"} Kanban Board
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGantt(!showGantt)}
              >
                {showGantt ? "Hide" : "Show"} Gantt Chart
              </Button>
            </div>
          </div>
          <CardDescription>Manage beta testing feedback and issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-blue-600">Total Tickets</p>
                  <p className="text-2xl font-bold">{ticketStats.totalTickets}</p>
                </div>
                <div className="p-1.5 bg-blue-100 rounded-full">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-amber-600">Open Tickets</p>
                  <p className="text-2xl font-bold">{ticketStats.openTickets}</p>
                </div>
                <div className="p-1.5 bg-amber-100 rounded-full">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-green-600">Closed Tickets</p>
                  <p className="text-2xl font-bold">{ticketStats.closedTickets}</p>
                </div>
                <div className="p-1.5 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-red-600">High Priority</p>
                  <p className="text-2xl font-bold">{ticketStats.highPriorityTickets}</p>
                </div>
                <div className="p-1.5 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </div>
          </div>
          
          {showKanban && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Ticket Board</h3>
              <div className="border rounded-lg overflow-hidden">
                <DragDropContext onDragEnd={(result) => {
                  // Handle drag end and update ticket status
                  if (!result.destination) return;
                  
                  const ticketId = result.draggableId;
                  const newStatus = result.destination.droppableId;
                  
                  // Update ticket status via onTicketAction
                  handleTicketAction(ticketId, 'update_status', { status: newStatus });
                  
                  // Update local state
                  setBetaTickets(prevTickets => 
                    prevTickets.map(ticket => 
                      ticket.id === ticketId 
                        ? { ...ticket, status: newStatus } 
                        : ticket
                    )
                  );
                }}>
                  <KanbanBoard 
                    tickets={betaTickets as BetaTicket[]} 
                    onStatusChange={(ticketId, newStatus) => 
                      handleTicketAction(ticketId, 'update_status', { status: newStatus })
                    }
                    onTicketClick={toggleTicketExpanded}
                  />
                </DragDropContext>
              </div>
            </div>
          )}
          
          {showGantt && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Timeline</h3>
              <div className="border rounded-lg overflow-hidden p-4">
                <GanttChartView tasks={getGanttTasks()} />
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium mb-4">All Tickets</h3>
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {betaTickets.length > 0 ? (
                  betaTickets.map(ticket => (
                    <React.Fragment key={ticket.id}>
                      <TableRow className="group">
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ticket.status === 'new' || ticket.status === 'todo' ? 'bg-blue-100 text-blue-800' :
                            ticket.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                            ticket.status === 'blocked' ? 'bg-red-100 text-red-800' :
                            ticket.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.status === 'done' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.priority}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(ticket.created_at)}</TableCell>
                        <TableCell>{ticket.due_date ? formatDate(ticket.due_date) : '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTicketExpanded(ticket.id)}
                          >
                            {ticket.expanded ? 'Collapse' : 'Expand'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {ticket.expanded && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0 border-t-0">
                            <ExpandedTicketDetails 
                              ticket={ticket} 
                              messages={allTicketMessages.filter(msg => msg.ticketId === ticket.id)}
                              onReply={(message) => handleTicketAction(ticket.id, 'reply', { message })}
                              onStatusChange={(status) => handleTicketAction(ticket.id, 'update_status', { status })}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No tickets found. Create tickets from the Projects section below.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <ProjectsOverview 
        currentProjects={equityProjects} 
        pastProjects={[]} 
        onDocumentAction={onDocumentAction}
        userTickets={userTickets}
        onTicketAction={handleTicketAction}
        refreshTickets={refreshTickets}
      />
      
      {/* Conditional render the ticket management UI */}
      {activeTab === 'tickets' && renderTicketManagementUI()}
      
      {/* Regular dashboard content */}
      <DashboardContent
        activeTab={activeTab}
        dashboardData={{
          profile,
          cvUrl,
          parsedCvData,
          setCvUrl: () => {},
          setParsedCvData: () => {},
          skills,
          handleSkillsUpdate,
          applications,
          availableOpportunities,
          equityProjects,
          logEffort: null,
          onLogEffort: () => {},
          onLogEffortChange: () => {},
          userCVs,
          onCvListUpdated,
          userTickets,
          ticketMessages: allTicketMessages,
          onTicketAction: handleTicketAction
        }}
        refreshApplications={refreshApplications}
      />
      
      {/* Render AdminTicketManager component if we're on the tickets tab */}
      {activeTab === 'tickets' && <AdminTicketManager />}
    </div>
  );
};
