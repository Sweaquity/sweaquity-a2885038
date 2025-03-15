
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const TicketList = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('updated_desc');
  const [savingTicket, setSavingTicket] = useState<string | null>(null);
  const [editingTickets, setEditingTickets] = useState<Set<string>>(new Set());

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

  // Toggle edit mode for a ticket
  const toggleEdit = (ticketId: string) => {
    setEditingTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  // Update a ticket field
  const updateTicketField = async (ticketId: string, field: string, value: any) => {
    const ticketsCopy = [...tickets];
    const ticketIndex = ticketsCopy.findIndex(t => t.id === ticketId);
    
    if (ticketIndex !== -1) {
      ticketsCopy[ticketIndex] = {
        ...ticketsCopy[ticketIndex],
        [field]: value
      };
      setTickets(ticketsCopy);
    }
  };

  // Save ticket changes
  const saveTicketChanges = async (ticketId: string) => {
    setSavingTicket(ticketId);
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const { error } = await supabase
        .from('tickets')
        .update({
          status: ticket.status,
          priority: ticket.priority,
          health: ticket.health,
          due_date: ticket.due_date
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      toast.success("Ticket updated successfully");
      toggleEdit(ticketId);
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error("Failed to update ticket");
    } finally {
      setSavingTicket(null);
    }
  };

  // Group tickets by status
  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  // Enhanced TicketCard that includes editing capabilities
  const TicketCardWithEdit = ({ ticket, isEditing, onToggleEdit }: { 
    ticket: any, 
    isEditing: boolean, 
    onToggleEdit: () => void 
  }) => {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm mb-2">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg">{ticket.title}</h3>
          {isEditing ? (
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => saveTicketChanges(ticket.id)}
                disabled={savingTicket === ticket.id}
              >
                {savingTicket === ticket.id ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving</>
                ) : (
                  'Save'
                )}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onToggleEdit}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onToggleEdit}
            >
              Edit
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            {isEditing ? (
              <Select 
                value={ticket.status} 
                onValueChange={(value) => updateTicketField(ticket.id, 'status', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium capitalize">{ticket.status.replace('_', ' ')}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Priority</p>
            {isEditing ? (
              <Select 
                value={ticket.priority} 
                onValueChange={(value) => updateTicketField(ticket.id, 'priority', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium capitalize">{ticket.priority}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Health</p>
            {isEditing ? (
              <Select 
                value={ticket.health} 
                onValueChange={(value) => updateTicketField(ticket.id, 'health', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select health" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="amber">Amber</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className={`text-sm font-medium capitalize ${
                ticket.health === 'red' ? 'text-red-600' : 
                ticket.health === 'amber' ? 'text-amber-600' : 
                'text-green-600'
              }`}>
                {ticket.health}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            {isEditing ? (
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={ticket.due_date || ''}
                onChange={(e) => updateTicketField(ticket.id, 'due_date', e.target.value)}
              />
            ) : (
              <p className="text-sm font-medium">
                {ticket.due_date ? new Date(ticket.due_date).toLocaleDateString() : 'No due date'}
              </p>
            )}
          </div>
        </div>
        
        {ticket.project && (
          <div className="mb-2">
            <p className="text-sm text-gray-500">Project</p>
            <p className="text-sm font-medium">{ticket.project.title}</p>
          </div>
        )}
        
        <div>
          <p className="text-sm text-gray-500">Description</p>
          <p className="text-sm mt-1">{ticket.description || 'No description provided'}</p>
        </div>
      </div>
    );
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
              <TicketCardWithEdit 
                key={ticket.id} 
                ticket={ticket}
                isEditing={editingTickets.has(ticket.id)}
                onToggleEdit={() => toggleEdit(ticket.id)}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="backlog" className="space-y-2">
            {getTicketsByStatus('backlog').map(ticket => (
              <TicketCardWithEdit 
                key={ticket.id} 
                ticket={ticket}
                isEditing={editingTickets.has(ticket.id)}
                onToggleEdit={() => toggleEdit(ticket.id)}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="todo" className="space-y-2">
            {getTicketsByStatus('todo').map(ticket => (
              <TicketCardWithEdit 
                key={ticket.id} 
                ticket={ticket}
                isEditing={editingTickets.has(ticket.id)}
                onToggleEdit={() => toggleEdit(ticket.id)}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="in_progress" className="space-y-2">
            {getTicketsByStatus('in_progress').map(ticket => (
              <TicketCardWithEdit 
                key={ticket.id} 
                ticket={ticket}
                isEditing={editingTickets.has(ticket.id)}
                onToggleEdit={() => toggleEdit(ticket.id)}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="review" className="space-y-2">
            {getTicketsByStatus('review').map(ticket => (
              <TicketCardWithEdit 
                key={ticket.id} 
                ticket={ticket}
                isEditing={editingTickets.has(ticket.id)}
                onToggleEdit={() => toggleEdit(ticket.id)}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="done" className="space-y-2">
            {getTicketsByStatus('done').map(ticket => (
              <TicketCardWithEdit 
                key={ticket.id} 
                ticket={ticket}
                isEditing={editingTickets.has(ticket.id)}
                onToggleEdit={() => toggleEdit(ticket.id)}
              />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
