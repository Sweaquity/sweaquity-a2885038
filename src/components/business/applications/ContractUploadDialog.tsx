
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogHeader, DialogFooter, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Application } from '@/types/business';

interface ContractUploadDialogProps {
  application: Application;
  onClose: () => void;
  onContractUploaded: (contractUrl: string) => void;
}

export function ContractUploadDialog({
  application,
  onClose,
  onContractUploaded
}: ContractUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setIsUploading(true);

      // Upload file to storage
      const fileName = `contracts/${application.job_app_id}_${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('job_contracts')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('job_contracts')
        .getPublicUrl(fileName);

      // Update job application with contract URL
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({
          contract_url: publicUrl,
          contract_status: 'pending_signature'
        })
        .eq('id', application.job_app_id);

      if (updateError) throw updateError;

      // Notify the parent component
      onContractUploaded(publicUrl);
      toast.success("Contract uploaded successfully");
      onClose();
    } catch (error) {
      console.error("Error uploading contract:", error);
      toast.error("Failed to upload contract");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Upload Contract</DialogTitle>
        <DialogDescription>
          Upload a contract file for this application. Supported formats: PDF, DOCX.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        <div className="grid w-full items-center gap-2">
          <label htmlFor="contract-file" className="text-sm font-medium">
            Select Contract File
          </label>
          <Input
            id="contract-file"
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Contract
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
