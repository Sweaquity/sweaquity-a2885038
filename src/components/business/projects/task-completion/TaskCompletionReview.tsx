
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ProjectEquityTable } from "./ProjectEquityTable";
import { PendingTasksTable } from "./PendingTasksTable";
import { CompletedTasksTable } from "./CompletedTasksTable";
import { useTaskCompletionData } from "./useTaskCompletionData";

export const TaskCompletionReview = ({ businessId }: { businessId: string }) => {
  const {
    loading,
    pendingReviewTasks,
    completedTasks,
    businessProjects,
    projectEquity,
    allocatedEquity,
    handleApproveTask,
    loadTasksForReview
  } = useTaskCompletionData(businessId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Completion Review</CardTitle>
        <CardDescription>
          Review and approve completed tasks to allocate equity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading tasks...</div>
        ) : (
          <>
            <ProjectEquityTable 
              businessProjects={businessProjects}
              projectEquity={projectEquity}
              allocatedEquity={allocatedEquity}
            />
            
            <PendingTasksTable 
              pendingReviewTasks={pendingReviewTasks}
              handleApproveTask={handleApproveTask}
            />
            
            <CompletedTasksTable 
              completedTasks={completedTasks}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};
