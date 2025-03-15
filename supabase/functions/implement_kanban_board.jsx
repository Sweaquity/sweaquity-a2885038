import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

const KanbanBoard = () => {
  const [columns, setColumns] = useState({
    'open': { id: 'open', title: 'Open', ticketIds: [] },
    'in_progress': { id: 'in_progress', title: 'In Progress', ticketIds: [] },
    'resolved': { id: 'resolved', title: 'Resolved', ticketIds: [] },
    'closed': { id: 'closed', title: 'Closed', ticketIds: [] }
  });
  const [tickets, setTickets] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser();
  }, []);
  
  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);
  
  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };
  
  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Get tickets created by the user or assigned to them
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          project:project_id(title)
        `)
        .or(`reporter.eq.${user.id},assigned_to.eq.${user.id}`);
        
      if (error) throw error;
      
      // Format data for Kanban board
      const newTickets = {};
      const newColumns = {
        'open': { id: 'open', title: 'Open', ticketIds: [] },
        'in_progress': { id: 'in_progress', title: 'In Progress', ticketIds: [] },
        'resolved': { id: 'resolved', title: 'Resolved', ticketIds: [] },
        'closed': { id: 'closed', title: 'Closed', ticketIds: [] }
      };
      
      data.forEach(ticket => {
        newTickets[ticket.id] = ticket;
        if (newColumns[ticket.status]) {
          newColumns[ticket.status].ticketIds.push(ticket.id);
        } else {
          // If status doesn't match columns, put in open
          newColumns['open'].ticketIds.push(ticket.id);
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
    
    // If no destination or dropped in same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    const startColumn = columns[source.droppableId];
    const endColumn = columns[destination.droppableId];
    
    // Update the UI immediately for better UX
    if (startColumn === endColumn) {
      // Moving within same column
      const newTicketIds = Array.from(startColumn.ticketIds);
      newTicketIds.splice(source.index, 1);
      newTicketIds.splice(destination.index, 0, draggableId);
      
      setColumns({
        ...columns,
        [startColumn.id]: {
          ...startColumn,
          ticketIds: newTicketIds
        }
      });
    } else {
      // Moving between columns
      const startTicketIds = Array.from(startColumn.ticketIds);
      startTicketIds.splice(source.index, 1);
      
      const endTicketIds = Array.from(endColumn.ticketIds);
      endTicketIds.splice(destination.index, 0, draggableId);
      
      setColumns({
        ...columns,
        [startColumn.id]: {
          ...startColumn,
          ticketIds: startTicketIds
        },
        [endColumn.id]: {
          ...endColumn,
          ticketIds: endTicketIds
        }
      });
      
      // Update the database
      try {
        const { error } = await supabase
          .from('tickets')
          .update({ status: destination.droppableId })
          .eq('id', draggableId);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error updating ticket status:', error);
        // Revert UI changes if database update fails
        fetchTickets();
      }
    }
  };
  
  // Get color for health indicator
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
    <div className="p-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Ticket Board</h1>
        <Link 
          to="/tickets/new" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Ticket
        </Link>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {Object.values(columns).map(column => (
            <div 
              key={column.id}
              className="bg-gray-50 rounded-lg p-2 min-h-[500px]"
            >
              <h2 className="font-bold p-2 mb-2">
                {column.title} ({column.ticketIds.length})
              </h2>
              
              <Droppable droppableId={column
