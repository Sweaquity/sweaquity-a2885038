
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface TimeLogDialogProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  userId: string;
  onTimeLogged?: () => void;
}

export const TimeLogDialog = ({ 
  open, 
  onClose, 
  ticketId, 
  userId,
  onTimeLogged
}: TimeLogDialogProps) => {
  const [hours, setHours] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hours <= 0) {
      toast.error("Please enter a valid number of hours");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          hours_logged: hours,
          description: description,
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString() // For manual entries, we set both times to now
        });
        
      if (error) throw error;
      
      // Update the hours_logged in the tickets table too
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('hours_logged')
        .eq('id', ticketId)
        .single();
      
      if (ticketData) {
        const currentHours = ticketData.hours_logged || 0;
        await supabase
          .from('tickets')
          .update({ hours_logged: currentHours + hours })
          .eq('id', ticketId);
      }
      
      toast.success("Time logged successfully");
      setHours(0);
      setDescription("");
      
      if (onTimeLogged) {
        onTimeLogged();
      }
      
      onClose();
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="hours">Hours Spent</Label>
            <Input
              id="hours"
              type="number"
              step="0.25"
              min="0.25"
              value={hours || ""}
              onChange={e => setHours(Number(e.target.value))}
              placeholder="Enter hours"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What did you work on?"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || hours <= 0}
            >
              {isSubmitting ? "Logging..." : "Log Time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
