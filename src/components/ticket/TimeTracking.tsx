
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TimeTrackingProps {
  ticketId: string;
  userId: string;
  open: boolean;
  onClose: () => void;
  onTimeLogged?: () => void;
}

export const TimeTracking: React.FC<TimeTrackingProps> = ({
  ticketId,
  userId,
  open,
  onClose,
  onTimeLogged
}) => {
  const [hours, setHours] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [isLogging, setIsLogging] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hours <= 0) {
      toast.error("Hours must be greater than 0");
      return;
    }
    
    try {
      setIsLogging(true);
      
      const now = new Date();
      const { error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          hours_logged: hours,
          description: description,
          start_time: now.toISOString(),
          created_at: now.toISOString()
        });
      
      if (error) throw error;
      
      toast.success("Time logged successfully");
      
      // Reset the form
      setHours(0);
      setDescription("");
      
      // Close the dialog and inform parent component
      onClose();
      if (onTimeLogged) onTimeLogged();
      
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
          <DialogDescription>
            Record the time you've spent working on this ticket
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="hours" className="text-right text-sm">
                Hours
              </label>
              <Input
                id="hours"
                type="number"
                min="0.1"
                step="0.1"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right text-sm">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the work you've done"
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLogging}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLogging || hours <= 0}>
              {isLogging ? "Logging..." : "Log Time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
