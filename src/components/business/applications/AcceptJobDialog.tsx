
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
import { Loader2 } from "lucide-react";

interface AcceptJobDialogProps {
  onAccept: (data: { message: string }) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function AcceptJobDialog({ onAccept, onOpenChange }: AcceptJobDialogProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onAccept({ message });
      onOpenChange(false);
    } catch (error) {
      console.error("Error accepting job:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Accept Application</DialogTitle>
        <DialogDescription>
          You are accepting this application. You can include a message to the applicant.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium">
            Message to Applicant (Optional)
          </label>
          <Textarea
            id="message"
            placeholder="Congratulations! We'd like to welcome you to our project..."
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
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Accepting...
            </>
          ) : (
            "Accept Application"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
