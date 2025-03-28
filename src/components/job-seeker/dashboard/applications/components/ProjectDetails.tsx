
interface ProjectDetailsProps {
  description?: string;
  taskDiscourse?: string;
}

export const ProjectDetails = ({ 
  description, 
  taskDiscourse 
}: ProjectDetailsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-1">Project Description</h4>
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {description || "No description provided."}
        </p>
      </div>
      
      {taskDiscourse && (
        <div className="mt-3 p-3 bg-slate-50 rounded-md border">
          <h4 className="font-medium mb-2">Message History</h4>
          <pre className="text-sm whitespace-pre-wrap font-sans">
            {taskDiscourse}
          </pre>
        </div>
      )}
    </div>
  );
};
