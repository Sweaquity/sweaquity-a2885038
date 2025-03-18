
import { ProjectsOverview } from "@/components/job-seeker/ProjectsOverview";
import { DashboardContent } from "@/components/job-seeker/dashboard/DashboardContent";
import { EquityProject, JobApplication, Profile, Skill } from "@/types/jobSeeker";
import { CVFile } from "@/hooks/job-seeker/useCVData";
import { Notification, TicketMessage } from "@/types/dashboard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useMessaging } from "@/components/job-seeker/dashboard/applications/hooks/useMessaging";

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
}: DashboardTabProps) => {
  const { fetchMessages } = useMessaging();
  const [allTicketMessages, setAllTicketMessages] = useState<TicketMessage[]>(ticketMessages);
  
  useEffect(() => {
    if (activeTab === 'tickets' && userTickets.length > 0) {
      // Load messages for each ticket
      const loadAllTicketMessages = async () => {
        let allMessages: TicketMessage[] = [...ticketMessages];
        
        for (const ticket of userTickets) {
          if (ticket.id) {
            try {
              const messages = await fetchMessages(ticket.id);
              if (messages && messages.length > 0) {
                allMessages = [...allMessages, ...messages];
              }
            } catch (error) {
              console.error(`Error fetching messages for ticket ${ticket.id}:`, error);
            }
          }
        }
        
        setAllTicketMessages(allMessages);
      };
      
      loadAllTicketMessages();
    }
  }, [activeTab, userTickets, ticketMessages]);
  
  // Define a handler for ticket actions
  const handleTicketAction = async (ticketId: string, action: string, data?: any) => {
    // Perform the action using the provided handler
    await onTicketAction(ticketId, action, data);
    
    // If it's a reply action, refresh the messages
    if (action === 'reply' && ticketId) {
      const newMessages = await fetchMessages(ticketId);
      if (newMessages && newMessages.length > 0) {
        setAllTicketMessages(prev => [...prev, ...newMessages]);
      }
    }
  };

  return (
    <div className="space-y-6">
      <ProjectsOverview 
        currentProjects={equityProjects} 
        pastProjects={[]} 
        onDocumentAction={onDocumentAction}
      />
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
    </div>
  );
};
