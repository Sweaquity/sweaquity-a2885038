
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTicketManagement } from '@/hooks/useTicketManagement';
import { KanbanBoard } from '@/components/ticket/KanbanBoard';
import { CreateTicketDialog } from '@/components/ticket/CreateTicketDialog';
import TicketStats from '@/components/ticket/TicketStats';
import { supabase } from '@/lib/supabase';
import { Ticket } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab: React.FC<JobSeekerProjectsTabProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
  const { tickets, isLoading, error, onCreateTicket, onStatusChange, onTicketClick, expandedTicket, onReply } = useTicketManagement(userId);

  const handleCreateTicketOpen = () => {
    setIsCreateTicketDialogOpen(true);
  };

  const handleCreateTicketClose = () => {
    setIsCreateTicketDialogOpen(false);
  };

  const [projects, setProjects] = useState<Array<{ project_id: string; project_title?: string; title?: string }>>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('business_projects')
          .select('project_id, title')
          .eq('created_by', userId);

        if (error) {
          console.error("Error fetching projects:", error);
        }

        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, [userId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>View statistics and manage your projects.</CardDescription>
          </CardHeader>
          <CardContent>
            {userId ? (
              <TicketStats tickets={tickets} />
            ) : (
              <p>Please log in to view your project overview.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tickets" className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Tickets</h2>
            <Button onClick={handleCreateTicketOpen}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
        </div>
        {userId ? (
          <>
            <KanbanBoard
              tickets={tickets}
              onStatusChange={onStatusChange}
              onTicketClick={onTicketClick}
            />
            <CreateTicketDialog
              open={isCreateTicketDialogOpen}
              onClose={handleCreateTicketClose}
              onCreateTicket={onCreateTicket}
              projects={projects}
            />
          </>
        ) : (
          <p>Please log in to view your tickets.</p>
        )}
      </TabsContent>
    </Tabs>
  );
};
