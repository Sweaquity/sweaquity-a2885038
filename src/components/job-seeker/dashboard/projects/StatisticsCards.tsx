
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface TaskStats {
  total: number;
  open: number;
  closed: number;
  highPriority: number;
}

interface StatisticsCardsProps {
  taskStats: TaskStats;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ taskStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-blue-50">
        <CardContent className="p-4 text-center">
          <div className="text-sm font-medium text-blue-700">All Tickets</div>
          <div className="text-2xl font-bold mt-1 text-blue-800">{taskStats.total}</div>
        </CardContent>
      </Card>
      <Card className="bg-yellow-50">
        <CardContent className="p-4 text-center">
          <div className="text-sm font-medium text-yellow-700">Open Tasks</div>
          <div className="text-2xl font-bold mt-1 text-yellow-800">{taskStats.open}</div>
        </CardContent>
      </Card>
      <Card className="bg-green-50">
        <CardContent className="p-4 text-center">
          <div className="text-sm font-medium text-green-700">Closed Tasks</div>
          <div className="text-2xl font-bold mt-1 text-green-800">{taskStats.closed}</div>
        </CardContent>
      </Card>
      <Card className="bg-red-50">
        <CardContent className="p-4 text-center">
          <div className="text-sm font-medium text-red-700">High Priority</div>
          <div className="text-2xl font-bold mt-1 text-red-800">{taskStats.highPriority}</div>
        </CardContent>
      </Card>
    </div>
  );
};
