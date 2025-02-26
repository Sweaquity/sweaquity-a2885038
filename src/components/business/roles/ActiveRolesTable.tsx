
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

interface ActiveRolesTableProps {
  tasks: Task[];
}

export const ActiveRolesTable = ({ tasks }: ActiveRolesTableProps) => {
  return (
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
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell>{task.description}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {task.skill_requirements.map((skillReq, index) => (
                  <Badge key={index} variant="secondary">
                    {skillReq.skill} - {skillReq.level}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>{task.equity_allocation}%</TableCell>
            <TableCell>{task.timeframe}</TableCell>
            <TableCell>
              <Badge variant="outline">{task.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
