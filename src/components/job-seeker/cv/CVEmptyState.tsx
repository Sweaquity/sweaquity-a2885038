
interface CVEmptyStateProps {
  displayUrl: string | null;
  userCVs: any[];
}

export const CVEmptyState = ({ displayUrl, userCVs }: CVEmptyStateProps) => {
  if (userCVs.length > 0 || displayUrl) return null;
  
  return (
    <div className="text-sm text-muted-foreground">
      <p>Upload your CV to help us understand your skills and experience. We'll automatically extract information to enhance your profile.</p>
    </div>
  );
};
