
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export interface StatusBadgeProps {
  status: string;
  isUpdating?: boolean;  // Added isUpdating prop
}

export const StatusBadge = ({ status, isUpdating }: StatusBadgeProps) => {
  // Determine variant based on status
  let variant: "default" | "destructive" | "secondary" | "outline" = "default";
  
  switch (status.toLowerCase()) {
    case "pending":
      variant = "outline";
      break;
    case "accepted":
      variant = "secondary";
      break;
    case "rejected":
      variant = "destructive";
      break;
    case "withdrawn":
      variant = "destructive";
      break;
    default:
      variant = "default";
  }
  
  return (
    <Badge variant={variant} className="flex items-center">
      {isUpdating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
      {status}
    </Badge>
  );
};
