
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";

interface RejectApplicationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (note: string) => void;
}

export const RejectApplicationDialog = ({
  isOpen,
  onOpenChange,
  onReject
}: RejectApplicationDialogProps) => {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      await onReject(note);
      setNote("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error rejecting application:", error);
      setError("Failed to reject application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setNote("");
        setError("");
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this application. 
              <span className="font-medium text-amber-600 block mt-1">
                Note: This message will be visible to the applicant.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejection-note" className="text-left">
                Rejection Reason
              </Label>
              <Textarea
                id="rejection-note"
                placeholder="Enter your rejection reason here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-24"
              />
              {error && (
                <div className="flex items-center gap-1 text-sm text-red-500 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Reject Application"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
