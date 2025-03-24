
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Save, Clock, History as HistoryIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TimeTrackerProps {
  ticketId: string;
  userId: string;
  jobAppId?: string;
}

export const TimeTracker = ({ ticketId, userId, jobAppId }: TimeTrackerProps) => {
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [manualHours, setManualHours] = useState<number>(0);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [totalHoursLogged, setTotalHoursLogged] = useState(0);
  const [isTaskTicket, setIsTaskTicket] = useState(false);
  const [showTimeEntries, setShowTimeEntries] = useState(false);

  useEffect(() => {
    // Load existing time entries for this ticket
    const fetchTimeEntries = async () => {
      try {
        // Check if this is a task ticket
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('task_id')
          .eq('id', ticketId)
          .single();
          
        if (!ticketError && ticketData.task_id) {
          setIsTaskTicket(true);
        }
        
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const saveTimeEntry = async () => {
    if (!description) {
      toast.error("Please provide a description of your work");
      return;
    }

    try {
      setIsSaving(true);
      
      if (manualHours <= 0) {
        toast.error("Please enter hours greater than 0");
        setIsSaving(false);
        return;
      }

      const now = new Date();
      const entry = {
        ticket_id: ticketId,
        user_id: userId,
        job_app_id: jobAppId,
        description: description,
        hours_logged: manualHours,
        start_time: now.toISOString(),
        end_time: now.toISOString(), // For manual entries, use the same time
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
      setTotalHoursLogged(totalHoursLogged + manualHours);
      
      // Reset the inputs
      setDescription("");
      setManualHours(0);
      
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast.error("Failed to save time entry");
    } finally {
      setIsSaving(false);
    }
  };

  // Only show time tracker for task tickets
  if (!isTaskTicket) {
    return (
      <div className="p-4 bg-muted/30 rounded-md text-center">
        <p className="text-sm text-muted-foreground">Time tracking is only available for task-related tickets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex space-x-2 items-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Log Time
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Time for Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
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
                
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you're working on..."
                  rows={2}
                />
                
                <Button 
                  type="button"
                  onClick={saveTimeEntry}
                  disabled={isSaving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-1" /> Log Time
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center">
                <HistoryIcon className="h-4 w-4 mr-2" />
                View Time Entries
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Time Entry History</DialogTitle>
              </DialogHeader>
              
              <div className="rounded-md bg-secondary/30 p-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total time logged</span>
                  <span className="text-sm font-bold">{totalHoursLogged.toFixed(2)} hours</span>
                </div>
              </div>
              
              {timeEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No time entries yet</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {timeEntries.map((entry) => (
                    <div key={entry.id} className="border rounded p-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{formatDate(entry.start_time)}</span>
                        <span className="font-bold">{entry.hours_logged.toFixed(2)} hours</span>
                      </div>
                      <p className="text-muted-foreground mt-2">{entry.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};
