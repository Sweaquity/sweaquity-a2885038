
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlarmClock, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function BetaTestingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [errorLocation, setErrorLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please describe the error you encountered");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to report errors");
        return;
      }
      
      // Create a comment on the predefined beta testing task
      const { error: commentError } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: 'f5495aa5-9864-4e82-ac1e-45e734f3ffdb',
          user_id: user.id,
          content: `Beta Testing Error: ${errorLocation ? `Location: ${errorLocation}` : ''}\n\n${description}`
        });
      
      if (commentError) throw commentError;
      
      toast.success("Thank you for reporting this issue! Your feedback helps us improve.");
      setDescription('');
      setErrorLocation('');
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting beta test feedback:", error);
      toast.error("Failed to submit your feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 md:top-4 md:bottom-auto z-50 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
        onClick={() => setIsOpen(true)}
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        Report Beta Issue
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Beta Testing Issue</DialogTitle>
            <DialogDescription>
              Reporting beta testing errors will earn you equity in Sweaquity. 
              Your feedback is valuable for improving our platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="errorLocation">Where did you find this issue? (optional)</Label>
              <Input 
                id="errorLocation" 
                placeholder="e.g., Dashboard, Project page, etc."
                value={errorLocation}
                onChange={(e) => setErrorLocation(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="errorDescription">Describe the issue</Label>
              <Textarea
                id="errorDescription"
                placeholder="Please describe what happened and the steps to reproduce the issue..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
