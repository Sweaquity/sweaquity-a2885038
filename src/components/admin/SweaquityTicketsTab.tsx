
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Clock, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface BetaTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string;
  created_at: string;
  updated_at: string;
  reporter: {
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
  comments?: {
    id: string;
    content: string;
    created_at: string;
    user: {
      email: string;
    } | null;
  }[];
}

export function SweaquityTicketsTab() {
  const [betaTickets, setBetaTickets] = useState<BetaTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<BetaTicket | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  useEffect(() => {
    fetchBetaTickets();
  }, []);
  
  const fetchBetaTickets = async () => {
    try {
      setIsLoading(true);
      
      // First check if the beta ticket exists
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          reporter:profiles(email, first_name, last_name)
        `)
        .or('title.ilike.%Beta%,description.ilike.%Beta%,title.ilike.%Testing%')
        .order('created_at', { ascending: false });
        
      if (ticketError) {
        console.error("Error fetching beta tickets:", ticketError);
        toast.error("Failed to load beta tickets");
        return;
      }
      
      // Fetch all comments for these tickets
      if (ticketData && ticketData.length > 0) {
        const ticketIds = ticketData.map(ticket => ticket.id);
        
        const { data: commentsData, error: commentsError } = await supabase
          .from('ticket_comments')
          .select(`
            *,
            user:profiles(email)
          `)
          .in('ticket_id', ticketIds)
          .order('created_at', { ascending: true });
          
        if (commentsError) {
          console.error("Error fetching ticket comments:", commentsError);
        } else {
          // Group comments by ticket
          const ticketsWithComments = ticketData.map(ticket => ({
            ...ticket,
            comments: commentsData?.filter(comment => comment.ticket_id === ticket.id) || []
          }));
          
          setBetaTickets(ticketsWithComments);
        }
      } else {
        setBetaTickets([]);
      }
    } catch (error) {
      console.error("Error loading beta tickets:", error);
      toast.error("Error loading tickets");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddComment = async () => {
    if (!selectedTicket) return;
    
    if (!commentText.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to add comments");
        return;
      }
      
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          content: commentText
        });
        
      if (error) throw error;
      
      toast.success("Comment added successfully");
      setCommentText('');
      fetchBetaTickets();
      
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      toast.success("Ticket status updated");
      fetchBetaTickets();
      
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getFilteredTickets = () => {
    return betaTickets.filter(ticket => {
      // Apply status filter
      if (filterStatus !== 'all' && ticket.status.toLowerCase() !== filterStatus) {
        return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          ticket.title?.toLowerCase().includes(query) ||
          ticket.description?.toLowerCase().includes(query) ||
          ticket.reporter?.email?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };
  
  const filteredTickets = getFilteredTickets();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Beta Testing Tickets</h2>
        <Button onClick={fetchBetaTickets} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-md"></div>
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No beta testing tickets found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                  {filteredTickets.map(ticket => (
                    <div 
                      key={ticket.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium truncate flex-1" title={ticket.title}>
                          {ticket.title || 'Beta Testing Issue'}
                        </h3>
                        <Badge className={`ml-2 ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                        <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{selectedTicket.title || 'Beta Testing Issue'}</CardTitle>
                  <Select 
                    value={selectedTicket.status} 
                    onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-muted-foreground">Reported by</Label>
                    <p className="font-medium">
                      {selectedTicket.reporter?.email || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created on</Label>
                    <p className="font-medium">
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Label className="text-muted-foreground">Description</Label>
                  <div className="border rounded-md p-3 mt-1 bg-gray-50">
                    <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>
                
                <Label className="text-muted-foreground mb-2">Comments</Label>
                <div className="flex-1 overflow-y-auto border rounded-md p-3 mb-4 space-y-3">
                  {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                    selectedTicket.comments.map(comment => (
                      <div key={comment.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{comment.user?.email || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No comments yet
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAddComment} 
                      disabled={isSubmitting || !commentText.trim()}
                    >
                      {isSubmitting ? "Sending..." : "Add Comment"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Ticket Selected</h3>
                <p className="text-muted-foreground">
                  Select a ticket from the list to view its details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
