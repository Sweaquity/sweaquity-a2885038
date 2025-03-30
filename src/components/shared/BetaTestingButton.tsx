
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BetaTestingForm } from "./beta-testing/BetaTestingForm";

interface SystemLogInfo {
  url: string;
  userAgent: string;
  timestamp: string;
  viewportSize: string;
  referrer: string;
}

export function BetaTestingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Store project ID in state to make it easily configurable and reusable
  const [projectId] = useState('1ec133ba-26d6-4112-8e44-f0b67ddc8fb4');

  const handleSubmit = async (formData: {
    errorLocation: string;
    severity: string;
    selectedSubTaskId: string;
    description: string;
    screenshots: File[];
    systemInfo: SystemLogInfo | null;
  }) => {
    if (!formData.description.trim()) {
      toast.error("Please describe the error you encountered");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to report errors");
        return;
      }
      
      // Create the ticket first
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title: `Beta Testing Report: ${formData.errorLocation || 'General Issue'}`,
          description: formData.description,
          reporter: user.id,
          priority: formData.severity,
          status: 'new',
          health: 'needs-review',
          system_info: formData.systemInfo,
          reproduction_steps: formData.description,
          ticket_type: 'beta_testing',
          notes: [],
          replies: [],
          task_id: formData.selectedSubTaskId || null,
          project_id: projectId
        })
        .select('id')
        .single();
      
      if (ticketError) {
        console.error("Error creating ticket:", ticketError);
        throw ticketError;
      }
      
      // Handle file uploads if screenshots were provided
      let attachments = [];
      if (formData.screenshots.length > 0 && ticketData?.id) {
        console.log(`Uploading ${formData.screenshots.length} screenshots for ticket ${ticketData.id}`);
        
        for (let i = 0; i < formData.screenshots.length; i++) {
          const file = formData.screenshots[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${i}_${Date.now()}.${fileExt}`;
          
          // Using project_id/ticket_id/fileName format for storage
          const filePath = `${projectId}/${ticketData.id}/${fileName}`;
          
          console.log(`Uploading file to path: ${filePath}`);
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('ticket-attachments')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (uploadError) {
            console.error("Error uploading screenshot:", uploadError);
            toast.error(`Error uploading screenshot ${i+1}: ${uploadError.message}`);
            continue;
          }
          
          console.log("Upload successful:", uploadData);
          const { data: { publicUrl } } = supabase
            .storage
            .from('ticket-attachments')
            .getPublicUrl(filePath);
            
          attachments.push({
            url: publicUrl,
            name: file.name,
            path: filePath,
            type: file.type,
            size: file.size
          });
        }
        
        // Only update the ticket with attachments if we successfully uploaded any
        if (attachments.length > 0) {
          console.log("Updating ticket with attachments:", attachments);
          const { error: updateError } = await supabase
            .from('tickets')
            .update({
              attachments: attachments
            })
            .eq('id', ticketData.id);
            
          if (updateError) {
            console.error("Error updating ticket with screenshots:", updateError);
            toast.error("Error saving attachments to ticket");
          }
        }
      }
      
      toast.success("Thank you for reporting this issue! Your feedback helps us improve the platform and earns you equity.");
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="fixed bottom-4 right-4 md:top-4 md:bottom-auto z-50 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
              onClick={() => setIsOpen(true)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report Beta Issue
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>Reporting Beta Issues earns equity in the Sweaquity project. Take a screenshot before reporting the issue.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Report Beta Testing Issue</DialogTitle>
            <DialogDescription>
              Reporting beta testing errors will earn you equity in Sweaquity. 
              Please attach a screenshot of the issue if possible.
            </DialogDescription>
          </DialogHeader>
          
          <BetaTestingForm 
            onClose={() => setIsOpen(false)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
