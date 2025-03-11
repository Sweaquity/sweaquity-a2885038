import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import DocumentUploader from './DocumentUploader';
import DocumentList from './DocumentList';
import CommentSection from './CommentSection';

const TicketDetail = ({ ticketId }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [updatedTicket, setUpdatedTicket] = useState({});
  
  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);
  
  const fetchTicketDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          assigned_user:assigned_to(id, email),
          reporter_user:reporter(id, email),
          project:project_id(id, title)
        `)
        .eq('id', ticketId)
        .single();
        
      if (error) throw error;
      setTicket(data);
      setUpdatedTicket(data);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedTicket({
      ...updatedTicket,
      [name]: value
    });
  };
  
  const saveChanges = async () => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          title: updatedTicket.title,
          description: updatedTicket.description,
          status: updatedTicket.status,
          priority: updatedTicket.priority,
          health: updatedTicket.health,
          estimated_hours: updatedTicket.estimated_hours,
          due_date: updatedTicket.due_date,
          project_id: updatedTicket.project_id
        })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      setTicket(updatedTicket);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  if (loading) return <div className="text-center py-8">Loading ticket details...</div>;
  if (!ticket) return <div className="text-center py-8">Ticket not found</div>;
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          {editMode ? (
            <input
              type="text"
              name="title"
              value={updatedTicket.title || ''}
              onChange={handleInputChange}
              className="text-xl font-bold p-1 border rounded flex-1 mr-2"
            />
          ) : (
            <h1 className="text-xl font-bold">{ticket.title}</h1>
          )}
          
          {editMode ? (
            <div className="flex space-x-2">
              <button
                onClick={saveChanges}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Status Section */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              {editMode ? (
                <select
                  name="status"
                  value={updatedTicket.status || ''}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full border rounded"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <div className="mt-1 capitalize font-medium">{ticket.status.replace('_', ' ')}</div>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Priority</p>
              {editMode ? (
                <select
                  name="priority"
                  value={updatedTicket.priority || ''}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full border rounded"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              ) : (
                <div className="mt-1 capitalize font-medium">{ticket.priority}</div>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Health</p>
              {editMode ? (
                <select
                  name="health"
                  value={updatedTicket.health || ''}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full border rounded"
                >
                  <option value="green">Green</option>
                  <option value="amber">Amber</option>
                  <option value="red">Red</option>
                </select>
              ) : (
                <div className={`mt-1 capitalize font-medium ${
                  ticket.health === 'red' ? 'text-red-600' : 
                  ticket.health === 'amber' ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {ticket.health}
                </div>
              )}
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
            {editMode ? (
              <textarea
                name="description"
                value={updatedTicket.description || ''}
                onChange={handleInputChange}
                rows={6}
                className="w-full p-2 border rounded"
              />
            ) : (
              <div className="bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                {ticket.description || 'No description provided.'}
              </div>
            )}
          </div>
          
          {/* Details Section */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Assignee</p>
              <div className="mt-1">{ticket.assigned_user?.email || 'Unassigned'}</div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Reporter</p>
              <div className="mt-1">{ticket.reporter_user?.email || 'Unknown'}</div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Project</p>
              {editMode ? (
                <input
                  type="text"
                  name="project_id"
                  value={updatedTicket.project?.title || ''}
                  readOnly
                  className="mt-1 p-2 w-full border rounded bg-gray-100"
                  title="Project cannot be changed"
                />
              ) : (
                <div className="mt-1">{ticket.project?.title || 'None'}</div>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Due Date</p>
              {editMode ? (
                <input
                  type="date"
                  name="due_date"
                  value={updatedTicket.due_date || ''}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full border rounded"
                />
              ) : (
                <div className="mt-1">
                  {ticket.due_date ? new Date(ticket.due_date).toLocaleDateString() : 'No due date'}
                </div>
              )}
            </div>
          </div>
          
          {/* Documents */}
          <DocumentList ticketId={ticketId} />
          <DocumentUploader ticketId={ticketId} />
          
          {/* Comments */}
          <div className="mt-8">
            <CommentSection ticketId={ticketId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
