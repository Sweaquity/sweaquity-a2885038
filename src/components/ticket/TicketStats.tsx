import React from "react";
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface TicketStatsProps {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
}

const TicketStats: React.FC<TicketStatsProps> = ({
  totalTickets,
  openTickets,
  closedTickets,
  highPriorityTickets
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-blue-600">Total Tickets</p>
            <p className="text-2xl font-bold">{totalTickets}</p>
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
            <p className="text-2xl font-bold">{openTickets}</p>
          </div>
          <div className="p-1.5 bg-amber-100 rounded-full">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-green-600">Closed Tickets</p>
            <p className="text-2xl font-bold">{closedTickets}</p>
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
            <p className="text-2xl font-bold">{highPriorityTickets}</p>
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
