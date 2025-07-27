import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  Percent 
} from 'lucide-react';

interface ApplicationsTableProps {
  status?: string;
  projectFilter?: string | null;
}

interface ApplicationData {
  job_app_id: string;
  user_id: string;
  status: string;
  applied_at: string;
  message?: string;
  accepted_business: boolean;
  accepted_jobseeker: boolean;
  
  // Profile data (job seeker info)
  profiles: {
    first_name: string;
    last_name: string;
    title?: string;
    skills?: string[];
  };
  
  // Role data (what they applied for)
  business_roles: {
    role_id: string;
    title: string;
    equity_percentage: number;  // 🎯 This is what business OFFERED
    description: string;
    business_projects: {
      title: string;
      project_id: string;
    };
  };
}

export const ApplicationsTable = ({ 
  status = 'pending', 
  projectFilter = null 
}: ApplicationsTableProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch applications based on status and filter
  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('job_applications')
        .select(`
          job_app_id,
          user_id,
          status,
          applied_at,
          message,
          accepted_business,
          accepted_jobseeker,
          profiles (
            first_name,
            last_name,
            title,
            skills
          ),
          business_roles (
            role_id,
            title,
            equity_percentage,
            description,
            business_projects (
              title,
              project_id
            )
          )
        `)
        .eq('status', status)
        .order('applied_at', { ascending: false });

      // Add project filter if specified
      if (projectFilter) {
        query = query.eq('business_roles.business_projects.project_id', projectFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load applications');
        return;
      }

      setApplications(data || []);
    } catch (err) {
      console.error('Error loading applications:', err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available projects for filtering
  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('business_projects')
        .select('project_id, title')
        .order('title');

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  // Update application status
  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdatingStatus(applicationId);
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('job_app_id', applicationId);

      if (error) throw error;

      toast.success(`Application ${newStatus} successfully`);
      
      // Refresh applications list
      fetchApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update application status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Accept job and trigger contract creation
  const handleAcceptJob = async (applicationId: string) => {
    setUpdatingStatus(applicationId);
    try {
      // Update to accepted status - this should trigger your auto contract creation
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: 'accepted',
          accepted_business: true,
          updated_at: new Date().toISOString()
        })
        .eq('job_app_id', applicationId);

      if (error) throw error;

      toast.success('Application accepted! Contract will be created automatically.');
      
      // Refresh applications
      fetchApplications();
    } catch (error) {
      console.error('Error accepting job:', error);
      toast.error('Failed to accept application');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Calculate skills match percentage
  const calculateSkillsMatch = (applicantSkills: string[] = [], requiredSkills: any[] = []) => {
    if (!applicantSkills.length || !requiredSkills.length) return 0;
    
    const applicantSkillsLower = applicantSkills.map(skill => skill.toLowerCase());
    const requiredSkillsLower = requiredSkills.map(skill => 
      typeof skill === 'string' ? skill.toLowerCase() : skill.skill?.toLowerCase() || ''
    );
    
    const matches = requiredSkillsLower.filter(skill => 
      applicantSkillsLower.includes(skill)
    ).length;
    
    return Math.round((matches / requiredSkillsLower.length) * 100);
  };

  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      case 'negotiation': return 'outline';
      default: return 'secondary';
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchProjects();
  }, [status, projectFilter]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-pulse">Loading applications...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No {status} applications</h3>
            <p className="text-muted-foreground">
              {status === 'pending' ? 'No applications are waiting for your review.' : 
               status === 'accepted' ? 'No applications have been accepted yet.' :
               'No applications found for this status.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{applications.length} {status} Application{applications.length !== 1 ? 's' : ''}</span>
          <Badge variant="outline">
            {status === 'pending' ? '🔄 Awaiting Review' :
             status === 'accepted' ? '✅ Accepted' :
             status === 'rejected' ? '❌ Rejected' : status}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Role Applied For</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center">
                    <Percent className="h-4 w-4 mr-1" />
                    Equity Offered
                  </div>
                </TableHead>
                <TableHead>Skills Match</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => {
                const skillsMatch = calculateSkillsMatch(
                  application.profiles.skills,
                  [] // You'd need to get required skills from business_roles
                );
                
                return (
                  <TableRow key={application.job_app_id}>
                    {/* Applicant Info */}
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {application.profiles.first_name} {application.profiles.last_name}
                        </div>
                        {application.profiles.title && (
                          <div className="text-sm text-muted-foreground">
                            {application.profiles.title}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Role Applied For */}
                    <TableCell>
                      <div>
                        <div className="font-medium">{application.business_roles.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {application.business_roles.business_projects.title}
                        </div>
                      </div>
                    </TableCell>

                    {/* 🎯 Equity Offered - This is what YOU offered for this role */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          {application.business_roles.equity_percentage}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Your offer
                      </div>
                    </TableCell>

                    {/* Skills Match */}
                    <TableCell>
                      <div className="text-center">
                        <div className={`text-sm font-medium ${
                          skillsMatch >= 75 ? 'text-green-600' :
                          skillsMatch >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {skillsMatch > 0 ? `${skillsMatch}%` : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">match</div>
                      </div>
                    </TableCell>

                    {/* Applied Date */}
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(application.applied_at), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(application.applied_at), 'h:mm a')}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(application.status)}>
                        {application.status}
                      </Badge>
                      {application.status === 'accepted' && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Business: {application.accepted_business ? '✅' : '❌'} | 
                          Job Seeker: {application.accepted_jobseeker ? '✅' : '❌'}
                        </div>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View Details */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Navigate to detailed view or expand inline
                            toast.info('Detailed view coming soon');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Accept (if pending) */}
                        {application.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleAcceptJob(application.job_app_id)}
                            disabled={updatingStatus === application.job_app_id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                        )}

                        {/* Reject (if pending) */}
                        {application.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(application.job_app_id, 'rejected')}
                            disabled={updatingStatus === application.job_app_id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        )}

                        {/* Message */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            toast.info('Messaging feature coming soon');
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Showing {applications.length} {status} application{applications.length !== 1 ? 's' : ''}
          {projectFilter && ' for selected project'}
        </div>
      </CardContent>
    </Card>
  );
};
