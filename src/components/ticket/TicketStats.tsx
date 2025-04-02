
import React from "react";
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface TicketStatsProps {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

const TicketStats: React.FC<TicketStatsProps> = ({
  total,
  open,
  inProgress,
  completed,
  highPriority,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-blue-600">Total Tickets</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="p-1.5 bg-blue-100 rounded-full">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
        </div>
      </div>
      
      <div className="bg-amber-50 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-amber-600">Open Tickets</p>
            <p className="text-2xl font-bold">{open}</p>
          </div>
          <div className="p-1.5 bg-amber-100 rounded-full">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
        </div>
      </div>
      
      <div className="bg-cyan-50 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-cyan-600">In Progress</p>
            <p className="text-2xl font-bold">{inProgress}</p>
          </div>
          <div className="p-1.5 bg-cyan-100 rounded-full">
            <Clock className="h-5 w-5 text-cyan-500" />
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-green-600">Completed</p>
            <p className="text-2xl font-bold">{completed}</p>
          </div>
          <div className="p-1.5 bg-green-100 rounded-full">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        </div>
      </div>
      
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-red-600">High Priority</p>
            <p className="text-2xl font-bold">{highPriority}</p>
          </div>
          <div className="p-1.5 bg-red-100 rounded-full">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketStats;
