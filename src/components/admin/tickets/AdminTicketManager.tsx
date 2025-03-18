
import React from "react";
import { TicketCard } from "@/components/ticket/TicketCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const AdminTicketManager = () => {
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          assigned_user:assigned_to(email),
          reporter_user:reporter(email),
          project:project_id(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string, updates: any }) => {
      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      toast.success('Ticket updated successfully');
    },
    onError: (error) => {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets?.map((ticket) => (
        <TicketCard 
          key={ticket.id} 
          ticket={ticket}
          onTicketUpdated={(updates) => {
            updateTicketMutation.mutate({ 
              ticketId: ticket.id, 
              updates 
            });
          }}
        />
      ))}
      {!tickets?.length && (
        <div className="text-center py-8 text-muted-foreground">
          No tickets found
        </div>
      )}
    </div>
  );
};
