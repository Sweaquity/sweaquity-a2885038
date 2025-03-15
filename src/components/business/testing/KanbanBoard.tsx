
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface KanbanBoardProps {
  projectId: string | null;
  onTicketSelect?: (ticketId: string) => void;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string;
  estimated_hours?: number;
  due_date?: string;
}

interface Column {
  id: string;
  title: string;
  ticketIds: string[];
}

interface ColumnsState {
  [key: string]: Column;
}

export function KanbanBoard({ projectId, onTicketSelect }: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnsState>({
    'backlog': { id: 'backlog', title: 'Backlog', ticketIds: [] },
    'todo': { id: 'todo', title: 'To Do', ticketIds: [] },
    'in_progress': { id: 'in_progress', title: 'In Progress', ticketIds: [] },
    'review': { id: 'review', title: 'Review', ticketIds: [] },
    'done': { id: 'done', title: 'Done', ticketIds: [] }
  });
  const [tickets, setTickets] = useState<Record<string, Ticket>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [projectId]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process the tickets into the format needed for the Kanban board
      const newTickets: Record<string, Ticket> = {};
      const newColumns = {
        'backlog': { id: 'backlog', title: 'Backlog', ticketIds: [] },
        'todo': { id: 'todo', title: 'To Do', ticketIds: [] },
        'in_progress': { id: 'in_progress', title: 'In Progress', ticketIds: [] },
        'review': { id: 'review', title: 'Review', ticketIds: [] },
        'done': { id: 'done', title: 'Done', ticketIds: [] }
      };

      data?.forEach(ticket => {
        newTickets[ticket.id] = ticket;
        if (newColumns[ticket.status]) {
          newColumns[ticket.status].ticketIds.push(ticket.id);
        } else {
          // If status doesn't match our columns, put in backlog
          newColumns['backlog'].ticketIds.push(ticket.id);
        }
      });

      setTickets(newTickets);
      setColumns(newColumns);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped back in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    const startColumn = columns[source.droppableId];
    const endColumn = columns[destination.droppableId];

    // Moving within the same column
    if (startColumn === endColumn) {
      const newTicketIds = Array.from(startColumn.ticketIds);
      newTicketIds.splice(source.index, 1);
      newTicketIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        ticketIds: newTicketIds
      };

      setColumns({
        ...columns,
        [newColumn.id]: newColumn
      });
    } else {
      // Moving from one column to another
      const startTicketIds = Array.from(startColumn.ticketIds);
      startTicketIds.splice(source.index, 1);
      
      const newStartColumn = {
        ...startColumn,
        ticketIds: startTicketIds
      };

      const endTicketIds = Array.from(endColumn.ticketIds);
      endTicketIds.splice(destination.index, 0, draggableId);
      
      const newEndColumn = {
        ...endColumn,
        ticketIds: endTicketIds
      };

      setColumns({
        ...columns,
        [newStartColumn.id]: newStartColumn,
        [newEndColumn.id]: newEndColumn
      });

      // Update the ticket's status in the database
      try {
        const { error } = await supabase
          .from('tickets')
          .update({ status: destination.droppableId })
          .eq('id', draggableId);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating ticket status:', error);
        toast.error("Failed to update ticket status");
        // Revert the UI change if the database update fails
        fetchTickets();
      }
    }
  };

  // Function to determine ticket color based on health
  const getHealthColor = (health: string) => {
    switch(health) {
      case 'red': return 'border-l-4 border-l-red-500 bg-red-50';
      case 'amber': return 'border-l-4 border-l-amber-500 bg-amber-50';
      case 'green': return 'border-l-4 border-l-green-500 bg-green-50';
      default: return 'border-l-4 border-l-gray-500 bg-gray-50';
    }
  };

  // Function to determine priority badge color
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'urgent': return <Badge className="bg-red-500">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-500">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low': return <Badge className="bg-green-500">Low</Badge>;
      default: return <Badge>Medium</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading tickets...</div>;

  if (!projectId) return <div className="text-center p-8">Please select a project to view the Kanban board.</div>;

  return (
    <div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-8">
          {Object.values(columns).map(column => (
            <div key={column.id} className="min-w-[250px] bg-gray-100 rounded-md p-2 h-[600px] flex flex-col">
              <h3 className="font-bold mb-2 p-2 flex justify-between items-center">
                {column.title} 
                <span className="text-sm bg-gray-200 px-2 py-1 rounded-full">{column.ticketIds.length}</span>
              </h3>
              
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 overflow-y-auto"
                  >
                    {column.ticketIds.map((ticketId, index) => {
                      const ticket = tickets[ticketId];
                      if (!ticket) return null;
                      
                      return (
                        <Draggable 
                          key={ticket.id} 
                          draggableId={ticket.id} 
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 mb-2 rounded shadow-sm ${getHealthColor(ticket.health)} cursor-pointer`}
                              onClick={() => onTicketSelect && onTicketSelect(ticket.id)}
                            >
                              <h4 className="font-semibold text-sm mb-1">{ticket.title}</h4>
                              <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {ticket.description}
                              </div>
                              <div className="flex justify-between items-center mt-2 text-xs">
                                <div>{getPriorityBadge(ticket.priority)}</div>
                                {ticket.due_date && (
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    <span>{new Date(ticket.due_date).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                              {ticket.estimated_hours && (
                                <div className="mt-1 text-xs text-right text-gray-500">
                                  Est: {ticket.estimated_hours}h
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
