
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { useNDAManagement } from '@/hooks/useNDAManagement';
import { DocumentService } from '@/services/DocumentService';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

interface NDASignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobApplicationId: string;
  onSigned?: () => void;
}

export const NDASignatureDialog = ({
  open,
  onOpenChange,
  jobApplicationId,
  onSigned
}: NDASignatureDialogProps) => {
  const { getNDAForJobApplication } = useNDAManagement();
  
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signing, setSigning] = useState<boolean>(false);
  const [signatureName, setSignatureName] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [acknowledgement, setAcknowledgement] = useState<boolean>(false);
  
  useEffect(() => {
    if (open) {
      loadDocument();
      setCurrentDate(format(new Date(), "MMMM d, yyyy"));
    }
  }, [open, jobApplicationId]);
  
  const loadDocument = async () => {
    setLoading(true);
    try {
      const doc = await getNDAForJobApplication(jobApplicationId);
      setDocument(doc);
      
      // Pre-populate signature name if we have user data
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', doc?.jobseeker_id || '')
        .single();
        
      if (profile) {
        setSignatureName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim());
      }
    } catch (error) {
      console.error("Error loading document:", error);
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSign = async () => {
    if (!document || !acknowledgement || !signatureName.trim()) {
      toast.error("Please acknowledge and provide your signature");
      return;
    }
    
    setSigning(true);
    try {
      // 1. Store signature in document_signatures table
      const { data: signatureData, error: signatureError } = await supabase
        .from('document_signatures')
        .insert({
          document_id: document.id,
          version: document.version,
          signer_id: document.jobseeker_id,
          signature_data: signatureName.trim(),
          signature_metadata: {
            date: currentDate,
            ip: "captured-by-client", // In a real app, capture this server-side
            acknowledged: acknowledgement
          }
        })
        .select()
        .single();
        
      if (signatureError) throw signatureError;
      
      // 2. Update document status
      const statusUpdated = await DocumentService.updateDocumentStatus(document.id, 'executed');
      if (!statusUpdated) throw new Error("Failed to update document status");
      
      // 3. Update job application NDA status
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({
          nda_status: 'executed'
        })
        .eq('job_app_id', jobApplicationId);
        
      if (updateError) throw updateError;
      
      toast.success("NDA signed successfully");
      
      // 4. Generate PDF and store it - this would be done in a real app
      // For this implementation, we'll skip it
      
      // 5. Close dialog and notify parent
      onOpenChange(false);
      if (onSigned) onSigned();
      
    } catch (error) {
      console.error("Error signing document:", error);
      toast.error("Failed to sign document");
    } finally {
      setSigning(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sign Non-Disclosure Agreement</DialogTitle>
          <DialogDescription>
            Please review the agreement carefully before signing
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="text-center">
              <div className="spinner h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
              <p className="mt-2">Loading document...</p>
            </div>
          </div>
        ) : document ? (
          <>
            {/* Document Preview */}
            <div
              className="border p-4 rounded-md bg-white max-h-[400px] overflow-y-auto my-4"
              dangerouslySetInnerHTML={{ __html: document.htmlContent }}
            />
            
            {/* Signature Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-lg mb-4">Electronic Signature</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acknowledgement"
                    checked={acknowledgement}
                    onCheckedChange={(checked) => setAcknowledgement(checked as boolean)}
                  />
                  <Label htmlFor="acknowledgement" className="text-sm">
                    I acknowledge that I have read and understood this Non-Disclosure Agreement, 
                    and that by typing my name below, I am signing this document electronically, 
                    which has the same legal effect as a handwritten signature.
                  </Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="signature">Type your full legal name:</Label>
                    <Input
                      id="signature"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date:</Label>
                    <Input
                      id="date"
                      value={currentDate}
                      readOnly
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-gray-500">
            Document not found or could not be loaded.
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={signing}>
            Cancel
          </Button>
          <Button onClick={handleSign} disabled={!document || signing || !acknowledgement || !signatureName.trim()}>
            {signing ? "Signing..." : "Sign Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
