
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
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useNDAManagement } from "@/hooks/useNDAManagement";
import { DocumentService } from "@/services/DocumentService";
import { toast } from "sonner";

interface NDASignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  jobApplicationId: string;
  onSigned?: () => void;
}

export const NDASignatureDialog = ({
  open,
  onOpenChange,
  documentId,
  jobApplicationId,
  onSigned
}: NDASignatureDialogProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const { getNDAForJobApplication } = useNDAManagement();
  
  // Load the document content when the dialog opens
  const loadDocument = async () => {
    if (!documentId) return;
    
    try {
      setIsLoading(true);
      const document = await getNDAForJobApplication(jobApplicationId);
      
      if (document) {
        setDocumentContent(document.content || null);
      }
    } catch (error) {
      console.error("Error loading NDA document:", error);
      toast.error("Failed to load NDA document");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (open && !documentContent && !isLoading) {
    loadDocument();
  }
  
  const handleSign = async () => {
    if (!documentId) {
      toast.error("No document ID provided");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to sign this document");
        return;
      }
      
      // Sign the document
      const signature = {
        name: user.email || "User",
        date: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('document_signatures')
        .insert({
          document_id: documentId,
          signer_id: user.id,
          signature_data: JSON.stringify(signature),
          signature_metadata: { 
            ip_address: "recorded-on-signature", 
            user_agent: navigator.userAgent,
            signed_at: new Date().toISOString()
          },
          version: "1.0"
        });
      
      if (error) throw error;
      
      // Update document status
      await DocumentService.updateDocumentStatus(documentId, 'executed');
      
      // Update job application NDA status
      await supabase
        .from('job_applications')
        .update({ nda_status: 'executed' })
        .eq('job_app_id', jobApplicationId);
      
      toast.success("Document signed successfully");
      
      if (onSigned) onSigned();
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error signing document:", error);
      toast.error("Failed to sign document");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sign Non-Disclosure Agreement</DialogTitle>
          <DialogDescription>
            Please review the NDA carefully before signing. By clicking "Sign", you acknowledge that you have read and agree to the terms of this agreement.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : documentContent ? (
          <div className="border p-4 rounded bg-white max-h-[50vh] overflow-y-auto">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: DocumentService.createHtmlPreview(documentContent) }}
            />
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            Failed to load document content
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSign} 
            disabled={isLoading || !documentContent}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Sign Document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
