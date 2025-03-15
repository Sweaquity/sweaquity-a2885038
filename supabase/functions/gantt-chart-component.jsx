import React, { useState, useEffect } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { supabase } from '../supabaseClient';

const GanttChart = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(ViewMode.Month);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      // Fetch tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId);
      
      if (ticketsError) throw ticketsError;
      
      // Fetch epics
      const { data: epics, error: epicsError } = await supabase
        .from('epics')
        .select('*')
        .eq('project_id', projectId);
      
      if (epicsError) throw epicsError;
      
      // Fetch milestones
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId);
      
      if (milestonesError) throw milestonesError;

      // Process data for the Gantt chart
      const ganttTasks = [];
      
      // Add project as the root task
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;

      // Start with project as the root
      ganttTasks.push({
        id: project.id,
        name: project.name,
        type: 'project',
        start: new Date(project.created_at),
        end: calculateEndDate(tickets, epics, milestones),
        progress: calculateProgress(tickets),
        hideChildren: false,
      });

      // Add epics as second level
      epics.forEach(epic => {
        const epicTickets = tickets.filter(ticket => ticket.epic_id === epic.id);
        const epicStartDate = new Date(epic.created_at);
        const epicEndDate = epic.due_date ? new Date(epic.due_date) : calculateTicketsEndDate(epicTickets);
        
        ganttTasks.push({
          id: `epic-${epic.id}`,
          name: epic.title,
          type: 'epic',
          start: epicStartDate,
          end: epicEndDate,
          progress: calculateEpicProgress(epicTickets),
          project: project.id,
          dependencies: [project.id]
        });
        
        // Add tickets for this epic
        epicTickets.forEach(ticket => {
          const startDate = new Date(ticket.created_at);
          let endDate;
          
          if (ticket.due_date) {
            endDate = new Date(ticket.due_date);
          } else if (ticket.estimated_hours) {
            // If no due date but has estimated hours, set end date based on that
            endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + ticket.estimated_hours);
          } else {
            // Default to 1 day if no due date or estimated hours
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
          }
          
          ganttTasks.push({
            id: `ticket-${ticket.id}`,
            name: ticket.title,
            type: 'task',
            start: startDate,
            end: endDate,
            progress: getTicketProgress(ticket.status),
            project: project.id,
            dependencies: [`epic-${epic.id}`]
          });
        });
      });
      
      // Add orphaned tickets (not part of any epic)
      const orphanedTickets = tickets.filter(ticket => !ticket.epic_id);
      orphanedTickets.forEach(ticket => {
        const startDate = new Date(ticket.created_at);
        let endDate;
        
        if (ticket.due_date) {
          endDate = new Date(ticket.due_date);
        } else if (ticket.estimated_hours) {
          endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + ticket.estimated_hours);
        } else {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
        }
        
        ganttTasks.push({
          id: `ticket-${ticket.id}`,
          name: ticket.title,
          type: 'task',
          start: startDate,
          end: endDate,
          progress: getTicketProgress(ticket.status),
          project: project.id,
          dependencies: [project.id]
        });
      });
      
      // Add milestones
      milestones.forEach(milestone => {
        const milestoneDate = new Date(milestone.due_date);
        
        ganttTasks.push({
          id: `milestone-${milestone.id}`,
          name: milestone.title,
          type: 'milestone',
          start: milestoneDate,
          end: milestoneDate,
          progress: getMilestoneProgress(milestone.status),
          project: project.id,
          dependencies: [project.id]
        });
      });
      
      setTasks(ganttTasks);
    } catch (error) {
      console.error('Error fetching project data for Gantt chart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate the latest end date among all items
  const calculateEndDate = (tickets, epics, milestones) => {
    let latestDate = new Date();
    
    // Check tickets
    tickets.forEach(ticket => {
      if (ticket.due_date) {
        const dueDate = new Date(ticket.due_date);
        if (dueDate > latestDate) latestDate = dueDate;
      }
    });
    
    // Check epics
    epics.forEach(epic => {
      if (epic.due_date) {
        const dueDate = new Date(epic.due_date);
        if (dueDate > latestDate) latestDate = dueDate;
      }
    });
    
    // Check milestones
    milestones.forEach(milestone => {
      if (milestone.due_date) {
        const dueDate = new Date(milestone.due_date);
        if (dueDate > latestDate) latestDate = dueDate;
      }
    });
    
    // Add a little buffer
    latestDate.setDate(latestDate.getDate() + 7);
    
    return latestDate;
  };

  // Helper function to calculate the end date for a group of tickets
  const calculateTicketsEndDate = (tickets) => {
    if (!tickets || tickets.length === 0) return new Date();
    
    let latestDate = new Date();
    
    tickets.forEach(ticket => {
      if (ticket.due_date) {
        const dueDate = new Date(ticket.due_date);
        if (dueDate > latestDate) latestDate = dueDate;
      }
    });
    
    return latestDate;
  };

  // Calculate overall project progress based on ticket completion
  const calculateProgress = (tickets) => {
    if (!tickets || tickets.length === 0) return 0;
    
    const completedTickets = tickets.filter(t => t.status === 'done').length;
    return Math.round((completedTickets / tickets.length) * 100) / 100; // Convert to decimal
  };

  // Calculate epic progress based on its tickets
  const calculateEpicProgress = (tickets) => {
    if (!tickets || tickets.length === 0) return 0;
    
    const completedTickets = tickets.filter(t => t.status === 'done').length;
    return Math.round((completedTickets / tickets.length) * 100) / 100;
  };

  // Map ticket status to progress percentage
  const getTicketProgress = (status) => {
    switch(status) {
      case 'backlog': return 0;
      case 'todo': return 0;
      case 'in_progress': return 0.5;
      case 'review': return 0.8;
      case 'done': return 1;
      default: return 0;
    }
  };

  // Map milestone status to progress percentage
  const getMilestoneProgress = (status) => {
    switch(status) {
      case 'not_started': return 0;
      case 'in_progress': return 0.5;
      case 'completed': return 1;
      default: return 0;
    }
  };

  // Handle view mode changes
  const handleViewModeChange = (e) => {
    setViewMode(e.target.value);
  };

  if (loading) return <div>Loading Gantt chart data...</div>;

  return (
    <div className="mt-4">
      <div className="mb-4">
        <label htmlFor="viewMode" className="mr-2">View Mode:</label>
        <select 
          id="viewMode" 
          value={viewMode} 
          onChange={handleViewModeChange}
          className="p-2 border rounded"
        >
          <option value={ViewMode.Day}>Day</option>
          <option value={ViewMode.Week}>Week</option>
          <option value={ViewMode.Month}>Month</option>
          <option value={ViewMode.Year}>Year</option>
        </select>
      </div>
      
      <div className="gantt-container" style={{ height: '500px' }}>
        <Gantt
          tasks={tasks}
          viewMode={viewMode}
          onDateChange={(task) => console.log("Date changed", task)}
          onProgressChange={(task) => console.log("Progress changed", task)}
          onDoubleClick={(task) => console.log("Task clicked", task)}
          listCellWidth="250px"
          columnWidth={viewMode === ViewMode.Year ? 350 : viewMode === ViewMode.Month ? 300 : 200}
        />
      </div>
    </div>
  );
};

export default GanttChart;
