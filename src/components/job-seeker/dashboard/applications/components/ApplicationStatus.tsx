
import { Button } from '@/components/ui/button';
import { StatusBadge } from '../StatusBadge';
import { ChevronUp, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ApplicationStatusProps {
  isExpanded: boolean;
  toggleExpand: () => void;
  status: string;
  onStatusChange: (status: string) => void;
  isUpdatingStatus: boolean;
  showAcceptButton: boolean;
  onAcceptClick: () => void;
  isAcceptingJob: boolean;
  compact?: boolean;
}

export const ApplicationStatus = ({
  isExpanded,
  toggleExpand,
  status,
  onStatusChange,
  isUpdatingStatus,
  showAcceptButton,
  onAcceptClick,
  isAcceptingJob,
  compact = false
}: ApplicationStatusProps) => {
  // Ensure we always have a valid status
  const safeStatus = status || "pending";
  
  return (
    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
      {compact ? (
        <StatusBadge status={safeStatus} />
      ) : (
        <div className="flex flex-col items-end space-y-2">
          <div className="flex flex-wrap gap-2 items-center justify-end">
            <Select 
              value={safeStatus} 
              onValueChange={onStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="withdrawn">Withdraw</SelectItem>
              </SelectContent>
            </Select>
            
            {showAcceptButton && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onAcceptClick}
                disabled={isAcceptingJob}
              >
                Accept Job
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
            className="flex items-center"
          >
            {isExpanded ? (
              <>
                Less details <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                More details <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
