
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Loader2, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface TimeTrackerProps {
  ticketId: string;
  userId: string;
  jobAppId?: string;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ 
  ticketId, 
  userId,
  jobAppId 
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState("");
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null);

  // Fetch existing time entries for this ticket
  useEffect(() => {
    const fetchTimeEntries = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('ticket_id', ticketId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setTimeEntries(data || []);
        
        // Calculate total hours
        const total = (data || []).reduce((sum, entry) => sum + (entry.hours_logged || 0), 0);
        setTotalHours(total);
      } catch (error) {
        console.error('Error fetching time entries:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (ticketId && userId) {
      fetchTimeEntries();
    }
    
    return () => {
      // Clean up if necessary
    };
  }, [ticketId, userId]);

  // Start time tracking
  const startTracking = async () => {
    const now = new Date();
    setStartTime(now);
    setIsTracking(true);
    
    try {
      // Create initial time entry
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          job_app_id: jobAppId,
          start_time: now.toISOString(),
          description: description || "Work in progress..."
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setTimeEntryId(data.id);
      
      // Start timer
      const timer = setInterval(() => {
        const currentTime = new Date();
        const elapsed = Math.floor((currentTime.getTime() - now.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
      
      // @ts-ignore - Safe to ignore as we will clean up
      window.timeTrackerTimer = timer;
      
      toast.success("Time tracking started");
    } catch (error) {
      setIsTracking(false);
      setStartTime(null);
      console.error('Error starting time tracking:', error);
      toast.error("Failed to start time tracking");
    }
  };

  // Stop time tracking
  const stopTracking = async () => {
    if (!isTracking || !startTime || !timeEntryId) return;
    
    try {
      const endTime = new Date();
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          hours_logged: hours,
          description: description || "Completed work"
        })
        .eq('id', timeEntryId);
      
      // Stop timer
      // @ts-ignore - Safe to ignore as we just need to clear the timer
      clearInterval(window.timeTrackerTimer);
      
      // Reset state
      setIsTracking(false);
      setStartTime(null);
      setElapsedTime(0);
      setTimeEntryId(null);
      
      // Refresh time entries
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setTimeEntries(data || []);
      
      // Update total hours
      const total = (data || []).reduce((sum, entry) => sum + (entry.hours_logged || 0), 0);
      setTotalHours(total);
      
      setDescription("");
      toast.success("Time tracking stopped successfully");
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // @ts-ignore - Safe to ignore as we just need to clear the timer
      if (window.timeTrackerTimer) {
        // @ts-ignore
        clearInterval(window.timeTrackerTimer);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">Time Tracker</h3>
        <div className="text-sm font-medium">
          Total Hours: <span className="text-primary">{totalHours.toFixed(2)}</span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Loading time entries...</span>
        </div>
      ) : (
        <>
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-2">
              {isTracking ? "Currently Tracking" : "Start New Session"}
            </h4>
            
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="mb-4"
            />
            
            {isTracking ? (
              <div className="space-y-4">
                <div className="text-2xl font-mono text-center">
                  {formatTime(elapsedTime)}
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={stopTracking}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Stop Tracking
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full" 
                onClick={startTracking}
              >
                <Clock className="h-4 w-4 mr-2" />
                Start Tracking
              </Button>
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Time Entry History</h4>
            {timeEntries.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="border p-2 rounded-md">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{parseFloat(entry.hours_logged || 0).toFixed(2)} hours</div>
                      <div className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {formatDate(entry.created_at)}
                      </div>
                    </div>
                    <p className="text-sm mt-1">{entry.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-2">No time entries yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
