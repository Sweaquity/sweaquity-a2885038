
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { JobApplication } from '@/types/jobSeeker';
import { PastApplicationItem } from './PastApplicationItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface PastApplicationsListProps {
  onApplicationUpdated?: () => void;
  userId?: string;
  compact?: boolean;
}

export const PastApplicationsList = ({ 
  onApplicationUpdated,
  userId,
  compact = false
}: PastApplicationsListProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadApplications();
  }, [userId]);

  const loadApplications = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          business_roles:project_sub_tasks!inner (
            title,
            description,
            status,
            timeframe,
            equity_allocation,
            skill_requirements,
            project_id,
            task_status,
            completion_percentage,
            company_name:business_projects!inner(company_name:businesses!inner(company_name))
          )
        `)
        .eq('user_id', userId)
        .in('status', ['withdrawn', 'rejected', 'completed'])
        .order('updated_at', { ascending: false });
      
      if (error) {
        throw error;
      }

      // Process the data to make sure company_name is properly extracted
      const processedData = data.map((app: any) => ({
        ...app,
        business_roles: {
          ...app.business_roles,
          company_name: app.business_roles?.company_name?.[0]?.company_name || 'Unknown Company'
        }
      }));
      
      setApplications(processedData);
    } catch (error) {
      console.error('Error loading past applications:', error);
      toast.error('Failed to load past applications');
    } finally {
      setIsLoading(false);
    }
  };

  const filterApplications = (status?: string) => {
    if (!status || status === 'all') return applications;
    return applications.filter(app => app.status === status);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Past Applications</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadApplications} 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filterApplications(activeTab).length === 0 ? (
            <div className="text-center py-8 border rounded-md bg-card">
              <p className="text-muted-foreground">No past applications found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filterApplications(activeTab).map((application) => (
                <PastApplicationItem
                  key={application.job_app_id || application.id || Math.random().toString()}
                  application={application}
                  onApplicationUpdated={onApplicationUpdated}
                  compact={compact}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
