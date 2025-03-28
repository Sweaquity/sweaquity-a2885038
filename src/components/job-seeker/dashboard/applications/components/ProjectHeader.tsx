
import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectHeaderProps {
  title: string;
  company?: string;
  date?: string;
  status?: string;
}

export const ProjectHeader = ({ title, company, date, status }: ProjectHeaderProps) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {status && (
          <Badge 
            variant={status.toLowerCase() === 'active' ? 'default' : 'secondary'}
            className="ml-2"
          >
            {status}
          </Badge>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center text-sm text-muted-foreground gap-1 md:gap-3">
        {company && <span>{company}</span>}
        
        {company && date && <span className="hidden md:inline">•</span>}
        
        {date && (
          <span className="flex items-center">
            <CalendarIcon className="mr-1 h-3 w-3" />
            {typeof date === 'string' && date.includes('T') 
              ? new Date(date).toLocaleDateString() 
              : date
            }
          </span>
        )}
      </div>
    </div>
  );
};
