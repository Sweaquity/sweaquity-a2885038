import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TicketForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('backlog');
  const [priority, setPriority] = useState('medium');
  const [health, setHealth] = useState('green');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('none'); // Changed from empty string to 'none'
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchUserProjects();
  }, []);
  
  const fetchUserProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser(); // Updated auth method
      
      if (!user) throw new Error("User not authenticated");
      
      // Fetch projects that belong to the current user
      const { data, error } = await supabase
        .from('business_projects')
        .select('id, title')
        .eq('user_id', user.id);
        
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser(); // Updated auth method
      
      if (!user) throw new Error("User not authenticated");
      
      // Create the new ticket
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title,
          description,
          status,
          priority,
          health,
          estimated_hours: estimatedHours || null,
          due_date: dueDate || null,
          project_id: projectId !== 'none' ? projectId : null, // Use null if 'none' is selected
          reporter: user.id,
          assigned_to: user.id // Default to self-assigned
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setMessage('Ticket created successfully!');
      // Reset form
      setTitle('');
      setDescription('');
      setStatus('backlog');
      setPriority('medium');
      setHealth('green');
      setEstimatedHours('');
      setDueDate('');
      setProjectId('none'); // Reset to 'none' instead of empty string
    } catch (error) {
      console.error('Error creating ticket:', error);
      setMessage(`Error: ${error.message || 'An unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Create New Ticket</h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">Health</label>
            <select
              value={health}
              onChange={(e) => setHealth(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="green">Green</option>
              <option value="amber">Amber</option>
              <option value="red">Red</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Estimated Hours</label>
            <input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              min="0"
              step="0.25"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Project (Optional)</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="none">-- None --</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Creating...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  );
};

export default TicketForm;
