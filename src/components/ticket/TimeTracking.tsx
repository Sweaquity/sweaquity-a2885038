
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TimeTrackingProps {
  ticketId: string;
  userId: string;
  onClose: () => void;
}

export const TimeTracking: React.FC<TimeTrackingProps> = ({
  ticketId,
  userId,
  onClose,
}) => {
  const [hours, setHours] = useState<number>(1);
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hours <= 0) {
      toast.error("Hours must be greater than zero");
      return;
    }

    setIsSubmitting(true);
    try {
      // Log time in the time_entries table
      const { error } = await supabase.from("time_entries").insert({
        ticket_id: ticketId,
        user_id: userId,
        hours_logged: hours,
        description,
        start_time: new Date().toISOString(),
      });

      if (error) throw error;

      // Update ticket's total hours
      const { error: updateError } = await supabase.rpc("update_ticket_hours", {
        p_ticket_id: ticketId,
        p_hours: hours,
      });

      if (updateError) {
        console.error("Error updating ticket hours:", updateError);
        // Fallback if RPC is not available
        const { data: ticketData } = await supabase
          .from("tickets")
          .select("hours_logged")
          .eq("id", ticketId)
          .single();

        if (ticketData) {
          const currentHours = ticketData.hours_logged || 0;
          await supabase
            .from("tickets")
            .update({ hours_logged: currentHours + hours })
            .eq("id", ticketId);
        }
      }

      toast.success("Time logged successfully");
      onClose();
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hours" className="text-right">
                Hours
              </Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
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
                placeholder="What did you work on?"
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Log Time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
