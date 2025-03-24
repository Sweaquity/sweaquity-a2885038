
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { CheckCircle, User } from "lucide-react";

interface PendingTasksTableProps {
  pendingReviewTasks: any[];
  handleApproveTask: (task: any) => Promise<void>;
}

export const PendingTasksTable = ({ 
  pendingReviewTasks,
  handleApproveTask
}: PendingTasksTableProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Tasks Pending Review</h3>
      {pendingReviewTasks.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">No tasks pending review</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Equity</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingReviewTasks.map(task => (
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
                  <TableCell>{task.equity_allocation}%</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleApproveTask(task)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Allocate Equity
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Separator className="my-6" />
    </div>
  );
};
