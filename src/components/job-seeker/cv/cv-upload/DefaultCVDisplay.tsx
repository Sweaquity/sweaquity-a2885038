
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import { previewCV } from "@/utils/setupStorage";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface DefaultCVDisplayProps {
  displayUrl: string | null;
}

export const DefaultCVDisplay = ({ displayUrl }: DefaultCVDisplayProps) => {
  if (!displayUrl) return null;

  const fileName = displayUrl.split('/').pop() || '';

  const handlePreview = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to preview CVs");
        return;
      }

      await previewCV(session.user.id, fileName);
    } catch (error) {
      console.error("Error previewing CV:", error);
      toast.error("Failed to preview CV");
    }
  };

  return (
    <div>
      <Label className="text-muted-foreground">Default CV</Label>
      <div className="flex items-center justify-between mt-2">
        <p className="text-sm truncate max-w-[250px]">{fileName}</p>
        <Button 
          variant="outline" 
          onClick={handlePreview}
        >
          <Eye className="h-4 w-4 mr-2" />
          View CV
        </Button>
      </div>
    </div>
  );
};
