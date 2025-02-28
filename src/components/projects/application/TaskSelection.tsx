
import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SubTask {
  id: string;
  title: string;
  description: string;
  equity_allocation: number;
  timeframe: string;
  skills_required: string[];
  status: string;
  skill_requirements: any[];
  task_status: string;
  completion_percentage: number;
  created_at: string;
  project_id: string;
  matchScore?: number;
  matchedSkills?: string[];
}

interface TaskSelectionProps {
  subTasks: SubTask[];
  selectedTaskId: string | null;
  selectedTask: SubTask | null;
  onTaskSelect: (taskId: string) => void;
}

export const TaskSelection = ({ 
  subTasks, 
  selectedTaskId, 
  selectedTask,
  onTaskSelect
}: TaskSelectionProps) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Available Matching Tasks</h3>
      {subTasks.length > 0 ? (
        <div>
          <div className="space-y-4 mb-4">
            <label className="text-sm font-medium">Select a task to apply for:</label>
            <Select
              value={selectedTaskId || ''}
              onValueChange={onTaskSelect}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                {subTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    <div>
                      <span className="font-medium">{task.title}</span>
                      <span className="ml-2 text-xs">{task.matchScore}% skill match</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedTask && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium">Task Details</h5>
                    <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h6 className="text-sm font-medium text-muted-foreground">Equity</h6>
                      <p>{selectedTask.equity_allocation}%</p>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-muted-foreground">Timeframe</h6>
                      <p>{selectedTask.timeframe}</p>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-muted-foreground">Created</h6>
                      <p>{format(new Date(selectedTask.created_at), 'PPP')}</p>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-muted-foreground">Completion</h6>
                      <p>{selectedTask.completion_percentage || 0}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-sm font-medium text-muted-foreground">Matched Skills</h6>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedTask.matchedSkills?.map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="default"
                        >
                          {skill} ✓
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-sm font-medium text-muted-foreground">All Required Skills</h6>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedTask.skills_required?.map((skill, index) => {
                        const isMatch = selectedTask.matchedSkills?.includes(skill);
                        return (
                          <Badge 
                            key={index} 
                            variant={isMatch ? "default" : "secondary"}
                          >
                            {skill}
                            {isMatch && " ✓"}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-sm font-medium text-muted-foreground">Skill Match</h6>
                    <div className="w-full bg-secondary h-2 rounded-full mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${selectedTask.matchScore}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTask.matchScore}% match with your skills
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="p-4 border rounded-md bg-muted/50">
          <p className="text-center text-muted-foreground">No matching tasks found. Add more skills to see tasks that match your profile.</p>
        </div>
      )}
    </div>
  );
};
