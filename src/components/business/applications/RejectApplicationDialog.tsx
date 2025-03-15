
import { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface RejectApplicationDialogProps {
  onReject: (data: { reason: string, message: string }) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function RejectApplicationDialog({ onReject, onOpenChange }: RejectApplicationDialogProps) {
  const [reason, setReason] = useState("not_suitable");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onReject({ reason, message });
      onOpenChange(false);
    } catch (error) {
      console.error("Error rejecting application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasonOptions = [
    { value: "not_suitable", label: "Skills not suitable" },
    { value: "position_filled", label: "Position already filled" },
    { value: "experience_required", label: "More experience required" },
    { value: "other", label: "Other reason" },
  ];

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Reject Application</DialogTitle>
        <DialogDescription>
          You are rejecting this application. Please provide a reason and optional message.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="reason" className="text-sm font-medium">
            Reason for Rejection
          </label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger id="reason">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {reasonOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium">
            Message to Applicant (Optional)
          </label>
          <Textarea
            id="message"
            placeholder="Thank you for your application, but..."
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button 
          type="button"
          variant="destructive"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Rejecting...
            </>
          ) : (
            "Reject Application"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
