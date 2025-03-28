
import { Clock, FileText, Check, X, AlertCircle } from "lucide-react";
import React from "react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: { 
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", 
      icon: <Clock className="h-3.5 w-3.5 mr-1" /> 
    },
    "in review": { 
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", 
      icon: <FileText className="h-3.5 w-3.5 mr-1" /> 
    },
    accepted: { 
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", 
      icon: <Check className="h-3.5 w-3.5 mr-1" /> 
    },
    rejected: { 
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", 
      icon: <X className="h-3.5 w-3.5 mr-1" /> 
    },
    withdrawn: { 
      color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", 
      icon: <AlertCircle className="h-3.5 w-3.5 mr-1" /> 
    },
    negotiation: { 
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", 
      icon: <FileText className="h-3.5 w-3.5 mr-1" /> 
    }
  };

  const { color, icon } = statusMap[status.toLowerCase()] || statusMap.pending;

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
};
