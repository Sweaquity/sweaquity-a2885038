
import { Badge } from "@/components/ui/badge";

interface ProjectHeaderProps {
  title: string;
  companyName: string;
  status?: string;
  category?: string;
  deadline?: string | null;
}

export const ProjectHeader = ({ title, companyName, status, category, deadline }: ProjectHeaderProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{companyName}</p>
        </div>
        {status && <Badge variant="outline">{status}</Badge>}
      </div>
      
      {(category || deadline) && (
        <div className="text-sm text-muted-foreground">
          {category && <div>Category: {category}</div>}
          {deadline && <div>Deadline: {new Date(deadline).toLocaleDateString()}</div>}
        </div>
      )}
    </div>
  );
};
