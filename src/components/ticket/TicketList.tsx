
import { useState, useEffect } from "react";
import { TicketCard } from "./TicketCard";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TicketList = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('updated_desc');

  useEffect(() => {
    loadTickets();
  }, [filter, sort]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          assigned_user:assigned_to(id, email),
          reporter_user:reporter(id, email),
          project:project_id(id, title)
        `);

      // Apply filters
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Apply sorting
      switch (sort) {
        case 'updated_desc':
          query = query.order('updated_at', { ascending: false });
          break;
        case 'updated_asc':
          query = query.order('updated_at', { ascending: true });
          break;
        case 'priority_desc':
          query = query.order('priority', { ascending: false });
          break;
        case 'priority_asc':
          query = query.order('priority', { ascending: true });
          break;
        case 'due_date_asc':
          query = query.order('due_date', { ascending: true });
          break;
        case 'due_date_desc':
          query = query.order('due_date', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  // Group tickets by status
  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Project Tickets</h2>
        
        <div className="flex gap-2">
          <Select
            value={sort}
            onValueChange={setSort}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_desc">Recently Updated</SelectItem>
              <SelectItem value="updated_asc">Oldest Updated</SelectItem>
              <SelectItem value="priority_desc">Highest Priority</SelectItem>
              <SelectItem value="priority_asc">Lowest Priority</SelectItem>
              <SelectItem value="due_date_asc">Earliest Due</SelectItem>
              <SelectItem value="due_date_desc">Latest Due</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filter}
            onValueChange={setFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">In Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-lg">
          <p className="text-gray-500">No tickets found</p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              All ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="backlog">
              Backlog ({getTicketsByStatus('backlog').length})
            </TabsTrigger>
            <TabsTrigger value="todo">
              To Do ({getTicketsByStatus('todo').length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({getTicketsByStatus('in_progress').length})
            </TabsTrigger>
            <TabsTrigger value="review">
              Review ({getTicketsByStatus('review').length})
            </TabsTrigger>
            <TabsTrigger value="done">
              Done ({getTicketsByStatus('done').length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-2">
            {tickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onTicketUpdated={loadTickets}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="backlog" className="space-y-2">
            {getTicketsByStatus('backlog').map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onTicketUpdated={loadTickets}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="todo" className="space-y-2">
            {getTicketsByStatus('todo').map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onTicketUpdated={loadTickets}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="in_progress" className="space-y-2">
            {getTicketsByStatus('in_progress').map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onTicketUpdated={loadTickets}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="review" className="space-y-2">
            {getTicketsByStatus('review').map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onTicketUpdated={loadTickets}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="done" className="space-y-2">
            {getTicketsByStatus('done').map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onTicketUpdated={loadTickets}
              />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
