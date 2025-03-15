
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { Application } from "@/types/business";

interface ContractUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  application: JobApplication | Application | null;
  onUpload: (jobAppId: string, file: File, notes: string) => Promise<string | null>;
  isUploading: boolean;
}

export const ContractUploadDialog = ({
  isOpen,
  onOpenChange,
  application,
  onUpload,
  isUploading
}: ContractUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async () => {
    if (!application || !selectedFile) return;
    
    const jobAppId = application.job_app_id || "";
    await onUpload(jobAppId, selectedFile, notes);
    
    // Reset form
    setSelectedFile(null);
    setNotes("");
    onOpenChange(false);
  };
  
  if (!application) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Contract Document</DialogTitle>
          <DialogDescription>
            Upload the finalized contract document for this equity agreement.
            Both parties will be able to view and download this document.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-file">Contract Document (PDF)</Label>
            <Input
              id="contract-file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">
              Accepted formats: PDF, DOC, DOCX
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contract-notes">Notes (Optional)</Label>
            <Textarea
              id="contract-notes"
              placeholder="Add any notes or instructions about the contract..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
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
    </Dialog>
  );
};
