
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ActiveRolesTableProps {
  project: any;
}

export const ActiveRolesTable = ({ project }: ActiveRolesTableProps) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-medium">{project.title}</h3>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Equity</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.tasks.map((task: any) => (
              <TableRow key={task.id || task.task_id}>
                <TableCell>
                  <div className="font-medium">{task.title}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{task.status}</Badge>
                </TableCell>
                <TableCell>{task.equity_allocation || 0}%</TableCell>
                <TableCell>{task.timeframe || 'Not specified'}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleTask(task.id || task.task_id)}
                  >
                    {expandedTasks.has(task.id || task.task_id) ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Details
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {project.tasks.map((task: any) => (
          expandedTasks.has(task.id || task.task_id) && (
            <div key={`expanded-${task.id || task.task_id}`} className="p-4 bg-gray-50 border-t">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm">{task.description || 'No description provided'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Skills Required</h4>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(task.skill_requirements) && task.skill_requirements.length > 0 ? 
                      task.skill_requirements.map((skill: any, index: number) => {
                        const skillName = typeof skill === 'string' ? skill : (skill.skill || '');
                        const level = typeof skill === 'string' ? 'Intermediate' : (skill.level || '');
                        
                        return (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skillName} {level && <span className="ml-1 opacity-70">({level})</span>}
                          </Badge>
                        );
                      }) : 
                      <span className="text-sm text-muted-foreground">No specific skills required</span>
                    }
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Status</h4>
                    <p className="text-sm">{task.status || 'Not started'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Equity Allocation</h4>
                    <p className="text-sm">{task.equity_allocation || 0}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Timeframe</h4>
                    <p className="text-sm">{task.timeframe || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};
