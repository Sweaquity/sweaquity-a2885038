
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TimeLogDialogProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  userId: string;
  onTimeLogged: () => void;
}

export const TimeLogDialog = ({
  open,
  onClose,
  ticketId,
  userId,
  onTimeLogged
}: TimeLogDialogProps) => {
  const [hours, setHours] = useState<number>(1);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (hours <= 0) {
      toast.error("Hours must be greater than 0");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          description: description || "Work completed",
          hours_logged: hours,
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString()
        });
        
      if (error) throw error;
      
      toast.success("Time logged successfully");
      setHours(1);
      setDescription("");
      onTimeLogged();
      onClose();
    } catch (error) {
      console.error('Error logging time:', error);
      toast.error("Failed to log time");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
          <DialogDescription>
            Record the time you spent working on this task
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hours" className="text-right">
              Hours
            </Label>
            <Input
              id="hours"
              type="number"
              min="0.25"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work you did"
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Log Time
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
