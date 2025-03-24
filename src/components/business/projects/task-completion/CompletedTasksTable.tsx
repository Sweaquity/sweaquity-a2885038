
import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Clock, User } from "lucide-react";
import { format } from "date-fns";

interface CompletedTasksTableProps {
  completedTasks: any[];
}

export const CompletedTasksTable = ({ completedTasks }: CompletedTasksTableProps) => {
  const getCompletionDate = (task: any) => {
    if (task.last_activity_at) {
      return format(new Date(task.last_activity_at), "PPP");
    }
    return "Unknown";
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Completed Tasks</h3>
      {completedTasks.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">No completed tasks</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Equity Allocated</TableHead>
                <TableHead>Completed On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedTasks.map(task => (
                <TableRow key={task.task_id}>
                  <TableCell>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground">{task.description}</div>
                  </TableCell>
                  <TableCell>
                    {task.business_projects?.title || "Unknown Project"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      {task.assignedUser || "Unassigned"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {task.equity_allocation}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {getCompletionDate(task)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
