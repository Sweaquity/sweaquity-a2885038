
import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, MessageSquare, Calendar, CheckCircle } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistance } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface TicketCardProps {
  ticket: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    health: string;
    assigned_to?: string;
    reporter?: string;
    due_date?: string;
    created_at: string;
    updated_at: string;
    estimated_hours?: number;
    equity_points?: number;
    assigned_user?: {
      email?: string;
    };
    reporter_user?: {
      email?: string;
    };
    project?: {
      title?: string;
    };
  };
  onTicketUpdated?: (updates: any) => void;
}

export const TicketCard = ({ ticket, onTicketUpdated }: TicketCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const toggleExpand = async () => {
    setIsExpanded(!isExpanded);
    
    if (!isExpanded && comments.length === 0) {
      await loadComments();
    }
  };
  
  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id(first_name, last_name, email)
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  const handleStatusChange = async (newValue: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newValue })
        .eq('id', ticket.id);
        
      if (error) throw error;
      toast.success("Ticket status updated");
      if (onTicketUpdated) onTicketUpdated({ status: newValue });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error("Failed to update ticket status");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handlePriorityChange = async (newValue: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newValue })
        .eq('id', ticket.id);
        
      if (error) throw error;
      toast.success("Ticket priority updated");
      if (onTicketUpdated) onTicketUpdated({ priority: newValue });
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      toast.error("Failed to update ticket priority");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleHealthChange = async (newValue: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ health: newValue })
        .eq('id', ticket.id);
        
      if (error) throw error;
      toast.success("Ticket health updated");
      if (onTicketUpdated) onTicketUpdated({ health: newValue });
    } catch (error) {
      console.error('Error updating ticket health:', error);
      toast.error("Failed to update ticket health");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to add comments");
        return;
      }
      
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          content: newComment,
          user_id: session.user.id
        });
        
      if (error) throw error;
      
      setNewComment("");
      toast.success("Comment added");
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Failed to add comment");
    }
  };

  const getHealthBadgeClass = (health: string) => {
    switch (health.toLowerCase()) {
      case 'green': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'amber': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'red': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
    }
  };
  
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'low': return 'bg-green-100 text-green-800 hover:bg-green-200';
      default: return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'backlog': return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
      case 'todo': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'done': return 'bg-green-100 text-green-800 hover:bg-green-200';
      default: return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };
  
  const timeAgo = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="border rounded-lg shadow-sm mb-4 bg-white"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-auto">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <span className="font-medium truncate max-w-[300px]">{ticket.title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div>
            <Badge className={getHealthBadgeClass(ticket.health)}>
              {ticket.health}
            </Badge>
          </div>
          
          <div>
            <Badge className={getPriorityBadgeClass(ticket.priority)}>
              {ticket.priority}
            </Badge>
          </div>
          
          <div>
            <Badge className={getStatusBadgeClass(ticket.status)}>
              {ticket.status.replace('_', ' ')}
            </Badge>
          </div>
          
          {ticket.due_date && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(ticket.due_date)}
            </div>
          )}
        </div>
      </div>
      
      <CollapsibleContent>
        <div className="border-t p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <div className="bg-slate-50 rounded p-3 text-sm whitespace-pre-wrap">
                {ticket.description || "No description provided."}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <Select
                      value={ticket.status}
                      onValueChange={handleStatusChange}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
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
                  
                  <div>
                    <p className="text-xs text-gray-500">Priority</p>
                    <Select
                      value={ticket.priority}
                      onValueChange={handlePriorityChange}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Health</p>
                    <Select
                      value={ticket.health}
                      onValueChange={handleHealthChange}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="amber">Amber</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Assignee</p>
                    <p className="text-sm truncate">{ticket.assigned_user?.email || "Unassigned"}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Reporter</p>
                    <p className="text-sm truncate">{ticket.reporter_user?.email || "Unknown"}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Project</p>
                    <p className="text-sm truncate">{ticket.project?.title || "None"}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm">{timeAgo(ticket.created_at)}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className="text-sm">{formatDate(ticket.due_date)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Comments</h3>
                <div className="bg-slate-50 rounded p-3 max-h-60 overflow-y-auto space-y-3">
                  {isLoadingComments ? (
                    <p className="text-center text-sm py-2">Loading comments...</p>
                  ) : comments.length > 0 ? (
                    comments.map(comment => (
                      <div key={comment.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-medium">
                            {comment.profiles?.first_name || comment.profiles?.email || "User"}
                          </p>
                          <p className="text-xs text-gray-500">{timeAgo(comment.created_at)}</p>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm py-2 text-gray-500">No comments yet</p>
                  )}
                </div>
                
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-1 text-sm border rounded"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddComment}
                    className="h-8"
                    disabled={!newComment.trim()}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
