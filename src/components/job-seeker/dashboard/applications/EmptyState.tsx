
import React from "react";
import { FileX, Search, FileCheck } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: "file" | "search" | "check";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = "file",
}) => {
  const getIcon = () => {
    switch (icon) {
      case "search":
        return <Search className="h-12 w-12 text-muted-foreground/50" />;
      case "check":
        return <FileCheck className="h-12 w-12 text-muted-foreground/50" />;
      case "file":
      default:
        return <FileX className="h-12 w-12 text-muted-foreground/50" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-muted rounded-full p-4 mb-4">{getIcon()}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md">{description}</p>
    </div>
  );
};
