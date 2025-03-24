
import React from "react";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface ProjectEquityTableProps {
  businessProjects: any[];
  projectEquity: Record<string, number>;
  allocatedEquity: Record<string, number>;
}

export const ProjectEquityTable = ({ 
  businessProjects, 
  projectEquity, 
  allocatedEquity 
}: ProjectEquityTableProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium">Project Equity Allocation</h3>
      <div className="overflow-x-auto mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Total Equity</TableHead>
              <TableHead>Allocated</TableHead>
              <TableHead>Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businessProjects.map(project => {
              const total = projectEquity[project.project_id] || 0;
              const allocated = allocatedEquity[project.project_id] || 0;
              const remaining = total - allocated;
              
              return (
                <TableRow key={project.project_id}>
                  <TableCell>{project.title}</TableCell>
                  <TableCell>{total}%</TableCell>
                  <TableCell>{allocated}%</TableCell>
                  <TableCell 
                    className={remaining < 0 ? "text-red-500 font-medium" : ""}
                  >
                    {remaining}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Separator className="my-6" />
    </div>
  );
};
