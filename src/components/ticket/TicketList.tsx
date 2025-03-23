
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Filter, 
  MoreHorizontal, 
  User 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const TicketList = ({ projectId }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTickets();
    fetchUsers();
    fetchProjects();
  }, [filter, projectId]);

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          project:project_id(title, project_id),
          task:task_id(title, task_id),
          assigned_user:assigned_to(first_name, last_name, email, id)
        `)
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      // Apply filters
      if (filter === 'mine') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          query = query.eq('assigned_to', session.user.id);
        }
      } else if (filter === 'open') {
        query = query.not('status', 'eq', 'done');
      } else if (filter === 'done') {
        query = query.eq('status', 'done');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      console.log("Tickets data:", data);
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('business_projects')
        .select('project_id, title');
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('project_sub_tasks')
        .select('task_id, title')
        .eq('project_id', projectId);
      
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleUpdateTicket = async (ticketData) => {
    try {
      const { data: oldTicket, error: fetchError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketData.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Track changes for notes
      const changes = [];
      
      if (oldTicket.status !== ticketData.status) {
        changes.push({
          type: 'status_change',
          from: oldTicket.status,
          to: ticketData.status,
          timestamp: new Date().toISOString()
        });
      }
      
      if (oldTicket.priority !== ticketData.priority) {
        changes.push({
          type: 'priority_change',
          from: oldTicket.priority,
          to: ticketData.priority,
          timestamp: new Date().toISOString()
        });
      }
      
      if (oldTicket.assigned_to !== ticketData.assigned_to) {
        changes.push({
          type: 'assignee_change',
          from: oldTicket.assigned_to,
          to: ticketData.assigned_to,
          timestamp: new Date().toISOString()
        });
      }
      
      // Prepare notes
      let notes = oldTicket.notes || [];
      if (typeof notes === 'string') {
        try {
          notes = JSON.parse(notes);
        } catch (e) {
          notes = [];
        }
      }
      if (!Array.isArray(notes)) {
        notes = [];
      }
      
      const updatedNotes = [...notes, ...changes];
      
      // Update the ticket
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          ...ticketData,
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketData.id);
        
      if (updateError) throw updateError;
      
      toast.success("Ticket updated successfully");
      fetchTickets();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error("Failed to update ticket");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);
        
      if (error) throw error;
      
      toast.success("Ticket deleted successfully");
      fetchTickets();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error("Failed to delete ticket");
    }
  };

  const toggleExpandTicket = (ticketId) => {
    setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId);
  };

  const openEditDialog = (ticket) => {
    setCurrentTicket(ticket);
    setEditDialogOpen(true);
    
    // If ticket is associated with a project, load its tasks
    if (ticket.project_id) {
      fetchTasks(ticket.project_id);
    }
  };

  const renderHealthIndicator = (health) => {
    const colors = {
      red: 'bg-red-500',
      amber: 'bg-yellow-500',
      green: 'bg-green-500'
    };
    
    return (
      <span 
        className={`inline-block w-3 h-3 rounded-full ${colors[health] || 'bg-gray-500'}`} 
        title={`Health: ${health}`}
      />
    );
  };

  const renderStatusBadge = (status) => {
    const badges = {
      backlog: 'bg-gray-100 text-gray-800',
      todo: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      review: 'bg-purple-100 text-purple-800',
      done: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <p>Loading tickets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Tickets</CardTitle>
          <div className="flex items-center gap-2">
            <Select defaultValue={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter tickets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="mine">My Tickets</SelectItem>
                <SelectItem value="open">Open Tickets</SelectItem>
                <SelectItem value="done">Completed Tickets</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tickets found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(ticket => (
                <React.Fragment key={ticket.id}>
                  <TableRow className={expandedTicketId === ticket.id ? 'bg-gray-50' : ''}>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleExpandTicket(ticket.id)}
                      >
                        {expandedTicketId === ticket.id ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                        }
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium flex items-center gap-2">
                      {renderHealthIndicator(ticket.health)}
                      {ticket.title}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(ticket.status)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        ticket.priority === 'high' ? 'destructive' :
                        ticket.priority === 'medium' ? 'secondary' :
                        'outline'
                      }>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.project?.title || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {ticket.task?.title || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {ticket.assigned_user ? 
                        `${ticket.assigned_user.first_name} ${ticket.assigned_user.last_name}` : 
                        'Unassigned'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(ticket)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => handleDeleteTicket(ticket.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  
                  {expandedTicketId === ticket.id && (
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={9} className="p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-1">Description</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {ticket.description || 'No description provided.'}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-1">Details</h4>
                              <dl className="grid grid-cols-2 gap-2 text-sm">
                                {ticket.due_date && (
                                  <>
                                    <dt className="text-muted-foreground">Due Date:</dt>
                                    <dd>{new Date(ticket.due_date).toLocaleDateString()}</dd>
                                  </>
                                )}
                                {ticket.estimated_hours !== null && (
                                  <>
                                    <dt className="text-muted-foreground">Estimated Hours:</dt>
                                    <dd>{ticket.estimated_hours}h</dd>
                                  </>
                                )}
                                {ticket.ticket_type && (
                                  <>
                                    <dt className="text-muted-foreground">Type:</dt>
                                    <dd>{ticket.ticket_type}</dd>
                                  </>
                                )}
                                {ticket.equity_points !== null && (
                                  <>
                                    <dt className="text-muted-foreground">Equity Points:</dt>
                                    <dd>{ticket.equity_points}</dd>
                                  </>
                                )}
                              </dl>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-1">Activity</h4>
                              <div className="text-sm space-y-2 max-h-[200px] overflow-y-auto">
                                {ticket.notes && Array.isArray(ticket.notes) && ticket.notes.length > 0 ? (
                                  ticket.notes.map((note, index) => (
                                    <div key={index} className="py-1 border-b border-gray-100">
                                      <div className="flex justify-between">
                                        <span className="font-medium">
                                          {note.type === 'status_change' ? 'Status changed' :
                                           note.type === 'priority_change' ? 'Priority changed' :
                                           note.type === 'assignee_change' ? 'Assignee changed' :
                                           note.type}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(note.timestamp).toLocaleString()}
                                        </span>
                                      </div>
                                      {note.from !== undefined && note.to !== undefined && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          From <span className="font-medium">{note.from || 'none'}</span> to <span className="font-medium">{note.to || 'none'}</span>
                                        </div>
                                      )}
                                      {note.message && (
                                        <p className="mt-1">{note.message}</p>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground">No activity recorded.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>
              Make changes to the ticket details below.
            </DialogDescription>
          </DialogHeader>
          
          {currentTicket && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateTicket(currentTicket);
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={currentTicket.title || ''}
                    onChange={(e) => setCurrentTicket({...currentTicket, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={currentTicket.description || ''}
                    onChange={(e) => setCurrentTicket({...currentTicket, description: e.target.value})}
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={currentTicket.status || ''}
                      onValueChange={(value) => setCurrentTicket({...currentTicket, status: value})}
                    >
                      <SelectTrigger>
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
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={currentTicket.priority || ''}
                      onValueChange={(value) => setCurrentTicket({...currentTicket, priority: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project">Project</Label>
                    <Select
                      value={currentTicket.project_id || ''}
                      onValueChange={(value) => {
                        setCurrentTicket({...currentTicket, project_id: value});
                        fetchTasks(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.project_id} value={project.project_id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="task">Task</Label>
                    <Select
                      value={currentTicket.task_id || ''}
                      onValueChange={(value) => setCurrentTicket({...currentTicket, task_id: value})}
                      disabled={!currentTicket.project_id || tasks.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select task" />
                      </SelectTrigger>
                      <SelectContent>
                        {tasks.map(task => (
                          <SelectItem key={task.task_id} value={task.task_id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="assignee">Assigned To</Label>
                    <Select
                      value={currentTicket.assigned_to || ''}
                      onValueChange={(value) => setCurrentTicket({...currentTicket, assigned_to: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="health">Health</Label>
                    <Select
                      value={currentTicket.health || ''}
                      onValueChange={(value) => setCurrentTicket({...currentTicket, health: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select health" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="amber">Amber</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={currentTicket.due_date ? new Date(currentTicket.due_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => setCurrentTicket({...currentTicket, due_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="estimated_hours">Estimated Hours</Label>
                    <Input
                      id="estimated_hours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={currentTicket.estimated_hours || ''}
                      onChange={(e) => setCurrentTicket({...currentTicket, estimated_hours: e.target.value ? parseFloat(e.target.value) : null})}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
