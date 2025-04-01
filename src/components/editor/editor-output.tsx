
import React from "react";

interface EditorOutputProps {
  content: string;
}

export const EditorOutput: React.FC<EditorOutputProps> = ({ content }) => {
  if (!content) {
    return <div className="text-muted-foreground italic">No content provided</div>;
  }

  // For simple content, we'll just render it directly
  // In a real implementation, this would parse and render rich text content
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {content.split('\n').map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
};
