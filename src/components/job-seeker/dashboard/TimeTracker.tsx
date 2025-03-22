
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Play, Pause, Save, Clock } from "lucide-react";

interface TimeTrackerProps {
  ticketId: string;
  userId: string;
  jobAppId?: string;
  projectId?: string;
  taskId?: string;
}

export const TimeTracker = ({ ticketId, userId, jobAppId, projectId, taskId }: TimeTrackerProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [manualHours, setManualHours] = useState<number>(0);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [totalHoursLogged, setTotalHoursLogged] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isTracking && startTime) {
      intervalId = setInterval(() => {
        const now = new Date();
        const elapsed = (now.getTime() - startTime.getTime()) / 1000;
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTracking, startTime]);

  useEffect(() => {
    // Load existing time entries for this ticket
    const fetchTimeEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('ticket_id', ticketId)
          .eq('user_id', userId)
          .order('start_time', { ascending: false });

        if (error) throw error;
        
        setTimeEntries(data || []);
        
        // Calculate total hours
        const total = (data || []).reduce((sum, entry) => {
          return sum + (entry.hours_logged || 0);
        }, 0);
        
        setTotalHoursLogged(total);
      } catch (error) {
        console.error('Error fetching time entries:', error);
      }
    };

    fetchTimeEntries();
  }, [ticketId, userId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
    } else {
      setStartTime(new Date());
      setIsTracking(true);
    }
  };

  const saveTimeEntry = async () => {
    if (!description) {
      toast.error("Please provide a description of your work");
      return;
    }

    try {
      setIsSaving(true);
      
      // Calculate hours from elapsed seconds or use the manual entry
      const hoursLogged = isTracking ? (elapsedTime / 3600) : manualHours;
      
      if (hoursLogged <= 0) {
        toast.error("Please track some time or enter hours manually");
        setIsSaving(false);
        return;
      }

      const now = new Date();
      const entry = {
        ticket_id: ticketId,
        user_id: userId,
        job_app_id: jobAppId, // Use the job_app_id provided from props
        description: description,
        hours_logged: hoursLogged,
        start_time: startTime ? startTime.toISOString() : now.toISOString(),
        end_time: startTime ? now.toISOString() : null,
        task_id: taskId,
        project_id: projectId
      };

      console.log("Saving time entry with data:", entry);

      const { data, error } = await supabase
        .from('time_entries')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      
      // Update ticket information
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('task_id, project_id, job_app_id')
        .eq('id', ticketId)
        .single();
        
      if (!ticketError && ticketData.task_id) {
        // Update the task in project_sub_tasks if available
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({
            last_activity_at: now.toISOString()
          })
          .eq('task_id', ticketData.task_id);
          
        if (taskError) console.error('Error updating task activity:', taskError);
      }
      
      toast.success("Time entry saved successfully");
      
      // Add the new entry to the state
      setTimeEntries([data, ...timeEntries]);
      setTotalHoursLogged(totalHoursLogged + hoursLogged);
      
      // Reset the tracker
      setIsTracking(false);
      setStartTime(null);
      setElapsedTime(0);
      setDescription("");
      setManualHours(0);
      
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast.error("Failed to save time entry");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Time Tracking</h3>
          {isTracking ? (
            <span className="text-sm font-mono font-medium animate-pulse text-green-600">
              {formatTime(elapsedTime)}
            </span>
          ) : (
            <span className="text-sm font-mono">00:00:00</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            type="button"
            size="sm"
            variant={isTracking ? "destructive" : "outline"}
            onClick={toggleTracking}
            className="flex-1"
          >
            {isTracking ? (
              <>
                <Pause className="h-4 w-4 mr-1" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" /> Start Tracking
              </>
            )}
          </Button>
          
          <Button 
            type="button"
            size="sm"
            variant="default"
            onClick={saveTimeEntry}
            disabled={isSaving}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-1" /> Log Time
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {isTracking ? "Description of work in progress" : "Manual Time Entry"}
        </label>
        
        {!isTracking && (
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="Hours"
              value={manualHours || ''}
              onChange={(e) => setManualHours(parseFloat(e.target.value) || 0)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">hours</span>
          </div>
        )}
        
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what you're working on..."
          rows={3}
        />
      </div>

      {/* Display total logged time */}
      <div className="rounded-md bg-secondary/30 p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total time logged</span>
          <span className="text-sm font-bold">{totalHoursLogged.toFixed(2)} hours</span>
        </div>
      </div>
      
      {/* Recent time entries */}
      {timeEntries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent entries</h4>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {timeEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="text-xs border rounded p-2">
                <div className="flex justify-between">
                  <span className="font-medium">{formatDate(entry.start_time)}</span>
                  <span>{entry.hours_logged.toFixed(2)} hours</span>
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-1">{entry.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
