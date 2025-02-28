
import { Badge } from "@/components/ui/badge";

interface ProjectHeaderProps {
  title: string;
  companyName: string;
  status: string;
}

export const ProjectHeader = ({ title, companyName, status }: ProjectHeaderProps) => {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{companyName}</p>
      </div>
      <Badge variant="outline">{status}</Badge>
    </div>
  );
};
