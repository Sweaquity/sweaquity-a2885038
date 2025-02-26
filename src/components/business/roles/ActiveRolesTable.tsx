
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SkillRequirement {
  skill: string;
  level: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  timeframe: string;
  skill_requirements: SkillRequirement[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  equity_allocation: number;
  skills_required: string[];
  tasks: Task[];
}

interface ActiveRolesTableProps {
  project: Project;
}

export const ActiveRolesTable = ({ project }: ActiveRolesTableProps) => {
  const totalClaimedEquity = project.tasks.reduce((sum, task) => sum + (task.equity_allocation || 0), 0);
  const remainingEquity = project.equity_allocation - totalClaimedEquity;

  return (
    <div className="space-y-4">
      {/* Project Level Information */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Number of Tasks</TableHead>
            <TableHead>Required Skills</TableHead>
            <TableHead>Total Equity</TableHead>
            <TableHead>Claimed Equity</TableHead>
            <TableHead>Remaining Equity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">{project.title}</TableCell>
            <TableCell>{project.tasks.length}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {project.skills_required.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>{project.equity_allocation}%</TableCell>
            <TableCell>{totalClaimedEquity}%</TableCell>
            <TableCell>{remainingEquity}%</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Tasks Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Required Skills</TableHead>
              <TableHead>Equity Offered</TableHead>
              <TableHead>Timeframe</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{task.description}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {task.skill_requirements.map((skillReq, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className={
                          task.status === 'allocated' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-orange-100 text-orange-800 border-orange-200'
                        }
                      >
                        {skillReq.skill} - {skillReq.level}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{task.equity_allocation}%</TableCell>
                <TableCell>{task.timeframe}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className={
                      task.status === 'allocated'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-orange-100 text-orange-800 border-orange-200'
                    }
                  >
                    {task.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
