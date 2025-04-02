
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/types";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab: React.FC<JobSeekerProjectsTabProps> = ({ userId }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userId) {
      loadTickets();
    }
  }, [userId]);

  const loadTickets = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Get tickets assigned to this user
      const { data: ticketsData, error } = await supabase
        .from('tickets')
        .select('*')
        .or(`assigned_to.eq.${userId},reporter.eq.${userId}`)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setTickets(ticketsData || []);
    } catch (err) {
      console.error("Error loading tickets:", err);
      toast.error("Failed to load project tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      if (action === 'updateStatus') {
        const { error } = await supabase
          .from('tickets')
          .update({ status: data.status })
          .eq('id', ticketId);
          
        if (error) throw error;
        
        toast.success("Ticket status updated");
        loadTickets();
      }
    } catch (err) {
      console.error("Error handling ticket action:", err);
      toast.error("Failed to perform action on ticket");
    }
  };
  
  const toggleTicketExpansion = (ticketId: string) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p>Loading your project tickets...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You don't have any active project tickets yet. When you join projects, your tasks will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Project Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketDashboard 
            initialTickets={tickets}
            onRefresh={loadTickets}
            onTicketAction={handleTicketAction}
            userId={userId}
            expandedTickets={expandedTickets}
            toggleTicketExpansion={toggleTicketExpansion}
          />
        </CardContent>
      </Card>
    </div>
  );
};
