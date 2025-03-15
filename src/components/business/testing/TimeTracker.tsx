
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Play, Square } from 'lucide-react';

interface TimeTrackerProps {
  ticketId: string;
  userId: string;
}

interface TimeEntry {
  id: string;
  ticket_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  hours_logged?: number;
  description: string;
}

export function TimeTracker({ ticketId, userId }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
      fetchTimeEntries();
    } else {
      setLoading(false);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;
    
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
        
      if (error) throw error;
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const fetchTimeEntries = async () => {
    if (!ticketId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      setTimeEntries(data || []);
      
      // Calculate total hours
      const total = data?.reduce((sum, entry) => {
        return sum + (entry.hours_logged || 0);
      }, 0) || 0;
      
      setTotalHours(total);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error("Failed to load time entries");
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async () => {
    if (!ticketId || !userId) {
      toast.error("Please select a ticket first");
      return;
    }
    
    const now = new Date();
    setStartTime(now);
    setIsTracking(true);
    
    // Create a new time entry
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          start_time: now.toISOString(),
          description: description
        })
        .select()
        .single();

      if (error) throw error;
      
      setTimeEntryId(data.id);
      
      // Start the timer to update elapsed time
      const intervalId = window.setInterval(() => {
        const currentTime = new Date();
        const elapsed = (currentTime.getTime() - now.getTime()) / 1000; // seconds
        setElapsedTime(elapsed);
      }, 1000);
      
      setTimer(intervalId);
    } catch (error) {
      console.error('Error starting time tracking:', error);
      toast.error("Failed to start time tracking");
      setIsTracking(false);
      setStartTime(null);
    }
  };

  const stopTracking = async () => {
    if (!isTracking || !timeEntryId || !startTime) return;
    
    const endTime = new Date();
    const hoursLogged = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // Convert ms to hours
    
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          hours_logged: hoursLogged,
          description: description
        })
        .eq('id', timeEntryId);

      if (error) throw error;
      
      // Clear timer
      if (timer) clearInterval(timer);
      setTimer(null);
      
      // Reset state
      setIsTracking(false);
      setStartTime(null);
      setTimeEntryId(null);
      setDescription('');
      setElapsedTime(0);
      
      toast.success("Time entry saved successfully");
      
      // Refresh time entries
      fetchTimeEntries();
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      toast.error("Failed to stop time tracking");
    }
  };

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="flex justify-center p-8">Loading time tracking data...</div>;

  if (!ticketId) return <div className="text-center p-8">Please select a ticket to track time.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Time Tracker {ticket && `- ${ticket.title}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-lg font-semibold">
              Total time logged: <span className="text-blue-600">{totalHours.toFixed(2)} hours</span>
            </p>
          </div>
          
          <div className="mb-4">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="w-full p-2 border rounded-md mb-2"
              disabled={isTracking}
            />
            
            {isTracking ? (
              <div className="mb-4 space-y-4">
                <div className="text-4xl font-mono text-center my-4 font-semibold text-primary">
                  {formatTime(elapsedTime)}
                </div>
                <Button
                  onClick={stopTracking}
                  className="w-full bg-red-500 hover:bg-red-600"
                  variant="destructive"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </div>
            ) : (
              <Button
                onClick={startTracking}
                className="w-full"
                variant="default"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Tracking
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {timeEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeEntries.map(entry => (
                <div key={entry.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{entry.description || "No description"}</div>
                      <div className="text-sm text-gray-500">
                        {entry.start_time && formatDate(entry.start_time)}
                        {entry.end_time && ` to ${formatDate(entry.end_time)}`}
                      </div>
                    </div>
                    <div className="font-semibold text-primary">
                      {entry.hours_logged ? `${entry.hours_logged.toFixed(2)} hours` : 'In progress'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
