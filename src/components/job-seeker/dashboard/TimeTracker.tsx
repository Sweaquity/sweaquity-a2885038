
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Play, Pause, Save, Clock } from "lucide-react";

interface TimeTrackerProps {
  ticketId: string;
  userId: string;
}

export const TimeTracker = ({ ticketId, userId }: TimeTrackerProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [manualHours, setManualHours] = useState<number>(0);

  useEffect(() => {
    let interval: number | undefined;
    
    if (isTracking && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = (now.getTime() - startTime.getTime()) / 1000;
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, startTime]);

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

      const { error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          description: description,
          hours_logged: hoursLogged,
          start_time: startTime ? startTime.toISOString() : new Date().toISOString(),
          end_time: startTime ? new Date().toISOString() : null,
        });

      if (error) throw error;
      
      toast.success("Time entry saved successfully");
      
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
            variant={isTracking ? "destructive" : "success"}
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
            variant="outline"
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
    </div>
  );
};
