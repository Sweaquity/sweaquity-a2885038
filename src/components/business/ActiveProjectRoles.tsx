
// If this file doesn't exist, we're creating it with this content
// If it exists, we're updating it to include the description

import React from "react";
import { ActiveRolesTable } from "./ActiveRolesTable";

interface ActiveProjectRolesProps {
  projects: any[];
}

export const ActiveProjectRoles = ({ projects = [] }: ActiveProjectRolesProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Active Project Roles</h2>
        <p className="text-muted-foreground mb-6">
          These are the projects with active applications on live projects, and the progress of completion of the projects.
        </p>
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No active project roles found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <ActiveRolesTable key={project.project_id || project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};
