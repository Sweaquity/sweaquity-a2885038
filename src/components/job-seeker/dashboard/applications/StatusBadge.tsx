
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export interface StatusBadgeProps {
  status: string;
  isUpdating?: boolean;
}

export const StatusBadge = ({ status, isUpdating = false }: StatusBadgeProps) => {
  const getStatusVariant = () => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'in review':
      case 'in-review':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'negotiation':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Badge 
      className={`flex items-center gap-1 ${getStatusVariant()}`}
      variant="outline"
    >
      {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
      {status}
    </Badge>
  );
};
