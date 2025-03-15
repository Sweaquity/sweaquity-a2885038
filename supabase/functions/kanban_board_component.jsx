import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';

const KanbanBoard = ({ projectId }) => {
  const [columns, setColumns] = useState({
    'backlog': { id: 'backlog', title: 'Backlog', ticketIds: [] },
    'todo': { id: 'todo', title: 'To Do', ticketIds: [] },
    'in_progress': { id: 'in_progress', title: 'In Progress', ticketIds: [] },
    'review': { id: 'review', title: 'Review', ticketIds: [] },
    'done': { id: 'done', title: 'Done', ticketIds: [] }
  });
  const [tickets, setTickets] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [projectId]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      // Process the tickets into the format needed for the Kanban board
      const newTickets = {};
      const newColumns = {
        'backlog': { id: 'backlog', title: 'Backlog', ticketIds: [] },
        'todo': { id: 'todo', title: 'To Do', ticketIds: [] },
        'in_progress': { id: 'in_progress', title: 'In Progress', ticketIds: [] },
        'review': { id: 'review', title: 'Review', ticketIds: [] },
        'done': { id: 'done', title: 'Done', ticketIds: [] }
      };

      data.forEach(ticket => {
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
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
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
        // Revert the UI change if the database update fails
        fetchTickets();
      }
    }
  };

  // Function to determine ticket color based on health
  const getHealthColor = (health) => {
    switch(health) {
      case 'red': return 'bg-red-100 border-red-500';
      case 'amber': return 'bg-yellow-100 border-yellow-500';
      case 'green': return 'bg-green-100 border-green-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  if (loading) return <div>Loading tickets...</div>;

  return (
    <div className="flex overflow-x-auto p-4 space-x-4">
      <DragDropContext onDragEnd={onDragEnd}>
        {Object.values(columns).map(column => (
          <div key={column.id} className="min-w-[250px] bg-gray-100 rounded-md p-2">
            <h3 className="font-bold mb-2">{column.title} ({column.ticketIds.length})</h3>
            
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-h-[500px]"
                >
                  {column.ticketIds.map((ticketId, index) => {
                    const ticket = tickets[ticketId];
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
                            className={`p-2 mb-2 rounded border-l-4 ${getHealthColor(ticket.health)} shadow-sm bg-white`}
                          >
                            <h4 className="font-semibold">{ticket.title}</h4>
                            <div className="text-sm text-gray-600 truncate">
                              {ticket.description}
                            </div>
                            <div className="flex justify-between mt-2 text-xs">
                              <span>{ticket.priority}</span>
                              <span>{ticket.estimated_hours ? `${ticket.estimated_hours}h` : ''}</span>
                            </div>
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
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
