
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Plus, RefreshCw } from 'lucide-react';
import { KanbanBoard } from './KanbanBoard';
import { Badge } from '@/components/ui/badge';
import TicketDashboard from '@/components/ticket/TicketDashboard';
import { TicketService } from '@/components/ticket/TicketService';
import { Ticket } from '@/types/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TicketDetails from '@/components/ticket/TicketDetails';

const dummyTickets: Ticket[] = [
  {
    id: '1',
    title: 'Fix authentication bug',
    description: 'Users are unable to login after password reset',
    status: 'new',
    priority: 'high',
    created_at: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    reporter: 'user123',
    assignee: 'dev456',
    health: 'red',
    project_id: 'proj1'
  },
  {
    id: '2',
    title: 'Update landing page design',
    description: 'Implement the new landing page design from Figma',
    status: 'in-progress',
    priority: 'medium',
    created_at: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    reporter: 'user123',
    assignee: 'dev789',
    health: 'amber',
    project_id: 'proj1'
  },
  {
    id: '3',
    title: 'Optimize database queries',
    description: 'Several queries are taking too long to execute',
    status: 'review',
    priority: 'medium',
    created_at: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    reporter: 'user456',
    assignee: 'dev456',
    health: 'green',
    project_id: 'proj1'
  },
  {
    id: '4',
    title: 'Add new payment method',
    description: 'Integrate with Stripe for Apple Pay',
    status: 'done',
    priority: 'low',
    created_at: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    due_date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    reporter: 'user789',
    assignee: 'dev123',
    health: 'green',
    project_id: 'proj1'
  }
];

export const BetaTestingTab = () => {
  const [showKanban, setShowKanban] = useState(true);
  const [showGantt, setShowGantt] = useState(true);
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Ticket statistics
  const ticketStats = {
    total: tickets.length,
    todo: tickets.filter(t => t.status === 'new' || t.status === 'todo').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    review: tickets.filter(t => t.status === 'review').length,
    done: tickets.filter(t => t.status === 'done').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    highPriority: tickets.filter(t => t.priority === 'high').length
  };

  useEffect(() => {
    // In a real app, we would load tickets from an API
    // For now, we'll just use dummy data after a small delay to simulate loading
    const loadTickets = async () => {
      setLoading(true);
      try {
        // Comment out actual API call for now
        // const loadedTickets = await TicketService.getTickets();
        // setTickets(loadedTickets);
        
        // Use dummy data instead
        setTimeout(() => {
          setTickets(dummyTickets);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error loading tickets:', error);
        setTickets(dummyTickets); // Fallback to dummy data
        setLoading(false);
      }
    };
    
    loadTickets();
  }, []);

  const handleTicketClick = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setIsDetailsOpen(true);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // In a real app, we would refresh from the API
      // const refreshedTickets = await TicketService.getTickets();
      // setTickets(refreshedTickets);
      
      // For demo, just shuffle the array to simulate new data
      setTickets([...tickets].sort(() => Math.random() - 0.5));
    } catch (error) {
      console.error('Error refreshing tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTicketStats = () => {
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.total}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.todo}</div>
              <p className="text-sm text-muted-foreground">To Do</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.inProgress}</div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.review}</div>
              <p className="text-sm text-muted-foreground">In Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.done}</div>
              <p className="text-sm text-muted-foreground">Done</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.closed}</div>
              <p className="text-sm text-muted-foreground">Closed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{ticketStats.highPriority}</div>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderBasicTicketBoard = () => {
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Project Tickets</CardTitle>
              <CardDescription>Manage and track tickets for all your projects</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowKanban(!showKanban)}
              >
                {showKanban ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showKanban ? "Hide Board" : "Show Board"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setShowFullDashboard(true)}
              >
                Full Dashboard
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {showKanban && (
                <div className="overflow-x-auto pb-4">
                  <KanbanBoard 
                    tickets={tickets} 
                    onStatusChange={(ticketId, newStatus) => {
                      // In a real app, we'd update the status via API
                      console.log(`Changing ticket ${ticketId} status to ${newStatus}`);
                      setTickets(tickets.map(ticket => 
                        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
                      ));
                    }}
                    onTicketClick={handleTicketClick}
                  />
                </div>
              )}
              
              <div className="mt-6 space-y-4">
                <h3 className="font-medium">All Tickets</h3>
                {tickets.map(ticket => (
                  <div 
                    key={ticket.id}
                    className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleTicketClick(ticket.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{ticket.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{ticket.status}</Badge>
                        <Badge className={
                          ticket.priority === 'high' ? 'bg-red-500' : 
                          ticket.priority === 'medium' ? 'bg-amber-500' : 
                          'bg-green-500'
                        }>
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Beta Testing Dashboard</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Overview</CardTitle>
          <CardDescription>Key metrics about your project tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            renderTicketStats()
          )}
        </CardContent>
      </Card>

      {showFullDashboard ? (
        <TicketDashboard 
          initialTickets={tickets} 
          onRefresh={handleRefresh}
        />
      ) : (
        renderBasicTicketBoard()
      )}

      {/* Ticket details dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[90%] max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <TicketDetails 
              ticket={selectedTicket} 
              onClose={() => setIsDetailsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BetaTestingTab;
