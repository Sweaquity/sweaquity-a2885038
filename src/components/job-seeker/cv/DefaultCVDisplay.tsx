
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface DefaultCVDisplayProps {
  displayUrl: string | null;
  onPreview: (fileName: string) => Promise<void>;
}

export const DefaultCVDisplay = ({ displayUrl, onPreview }: DefaultCVDisplayProps) => {
  const [isParsing, setIsParsing] = useState(false);
  
  if (!displayUrl) return null;
  
  const handleManualParse = async () => {
    if (!displayUrl) {
      toast.error("No CV available to analyse. Please upload a CV first.");
      return;
    }
    
    try {
      setIsParsing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to analyse your CV");
        return;
      }
      
      toast.info("Analysing your CV for skills and experience...");
      
      // Create FormData with just the userId and cvUrl
      const formData = new FormData();
      formData.append('userId', session.user.id);
      formData.append('cvUrl', displayUrl);
      
      // Call the parse-cv function with userId and cvUrl
      const { data, error } = await supabase.functions.invoke('parse-cv', {
        body: formData
      });
      
      if (error) {
        console.error("CV parsing function error:", error);
        throw error;
      }
      
      toast.success("CV analysed successfully! Your skills have been updated.");
      
      // Refresh the page after a short delay to show the parsed data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error("Error parsing CV:", error);
      toast.error("Failed to analyse CV. Please try again later.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div>
      <Label className="text-muted-foreground">Default CV</Label>
      <div className="flex items-center justify-between mt-2">
        <p className="text-sm truncate max-w-[250px]">{displayUrl.split('/').pop()}</p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleManualParse} 
            disabled={isParsing}
          >
            {isParsing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analysing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Analyse CV
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onPreview(displayUrl.split('/').pop() || '')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View CV
          </Button>
        </div>
      </div>
    </div>
  );
};
