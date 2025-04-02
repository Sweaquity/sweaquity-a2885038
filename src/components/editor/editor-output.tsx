
import React from "react";

interface EditorOutputProps {
  content?: string;
}

export const EditorOutput: React.FC<EditorOutputProps> = ({ content }) => {
  if (!content) return <div className="text-muted-foreground italic">No content available</div>;
  
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {content}
    </div>
  );
};
