
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DocumentService } from "@/services/DocumentService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ContractSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentType: 'work_contract' | 'award_agreement';
  acceptedJobId: string;
  onSigned: () => void;
}

export const ContractSignatureDialog: React.FC<ContractSignatureDialogProps> = ({
  open,
  onOpenChange,
  documentId,
  documentType,
  acceptedJobId,
  onSigned,
}) => {
  const [signature, setSignature] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSignDocument = async () => {
    if (!signature.trim()) {
      toast.error("Please provide your signature");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Get the document
      const { data: document, error: docError } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (docError) throw docError;
      
      // 2. Add signature record
      const { data: signatureData, error: signError } = await supabase
        .from('document_signatures')
        .insert({
          document_id: documentId,
          version: document.version,
          signer_id: (await supabase.auth.getSession()).data.session?.user.id,
          signature_data: signature,
          signature_metadata: {
            timestamp: new Date().toISOString(),
            remarks: remarks,
            ip_address: "client_signature" // We don't capture actual IP
          }
        })
        .select()
        .single();
      
      if (signError) throw signError;
      
      // 3. Update document status to executed
      await DocumentService.updateDocumentStatus(documentId, 'executed');
      
      // 4. Update accepted job with the new document status
      const statusField = documentType === 'work_contract' ? 'work_contract_status' : 'award_agreement_status';
      
      await supabase
        .from('accepted_jobs')
        .update({ [statusField]: 'executed' })
        .eq('id', acceptedJobId);
      
      toast.success("Document signed successfully");
      onSigned();
      onOpenChange(false);
    } catch (error) {
      console.error("Error signing document:", error);
      toast.error("Failed to sign document");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign {documentType === 'work_contract' ? 'Work Contract' : 'Award Agreement'}</DialogTitle>
          <DialogDescription>
            By signing this document, you acknowledge that you have read, understood, and agree to all terms and conditions outlined in the {documentType === 'work_contract' ? 'work contract' : 'award agreement'}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="signature">Electronic Signature</Label>
            <Textarea
              id="signature"
              placeholder="Type your full legal name as your electronic signature"
              className="h-10"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Your electronic signature is legally binding.
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="remarks">Optional Remarks</Label>
            <Textarea
              id="remarks"
              placeholder="Add any optional remarks or comments"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="h-20"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSignDocument} disabled={isSubmitting || !signature}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing...
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
