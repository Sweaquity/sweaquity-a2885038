// src/components/admin/WorkflowMonitoringDashboard.tsx
// CREATE THIS NEW FILE
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Filter,
  RefreshCw,
  Search,
  Users,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface AuditLogEntry {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  details: any;
  metadata: any;
  created_at: string;
  job_application_id?: string;
  business_id?: string;
  company_name?: string;
  nda_document_id?: string;
}

interface WorkflowStats {
  total_events: number;
  job_acceptances: number;
  nda_generations: number;
  nda_signings: number;
  errors: number;
  last_24h_events: number;
}

export const WorkflowMonitoringDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      await Promise.all([loadLogs(), loadStats()]);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from('workflow_log_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setLogs(data || []);
  };

  const loadStats = async () => {
    // Get overall stats
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_workflow_stats');

    if (statsError) {
      console.warn('Could not load stats:', statsError);
      // Fallback: calculate basic stats from logs
      const { count } = await supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true });
      
      setStats({
        total_events: count || 0,
        job_acceptances: 0,
        nda_generations: 0,
        nda_signings: 0,
        errors: 0,
        last_24h_events: 0
      });
    } else {
      setStats(statsData);
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'job_acceptance_started':
        return <Badge variant="default"><Clock className="w-3 h-3 mr-1" />Started</Badge>;
      case 'nda_document_created':
        return <Badge variant="secondary"><FileText className="w-3 h-3 mr-1" />Created</Badge>;
      case 'nda_generation_completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'document_signed':
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Signed</Badge>;
      case 'nda_generation_error':
      case 'document_status_error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'business_found':
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Found</Badge>;
      case 'document_status_changed':
        return <Badge variant="outline"><Activity className="w-3 h-3 mr-1" />Changed</Badge>;
      default:
        return <Badge variant="outline">{eventType}</Badge>;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesText = filter === '' || 
      log.event_type.toLowerCase().includes(filter.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(filter.toLowerCase()) ||
      log.company_name?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesEventType = eventTypeFilter === 'all' || 
      log.event_type.includes(eventTypeFilter);
    
    return matchesText && matchesEventType;
  });

  const formatDetails = (details: any, metadata: any) => {
    if (!details && !metadata) return 'No details';
    
    const combined = { ...details, ...metadata };
    return Object.entries(combined)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join(', ');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading workflow monitoring data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workflow Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of NDA and contract workflows
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-1" />
            {autoRefresh ? 'Live' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_events}</div>
              <p className="text-xs text-muted-foreground">
                {stats.last_24h_events} in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Acceptances</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.job_acceptances}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NDAs Generated</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.nda_generations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.errors}</div>
              {stats.errors > 0 && (
                <p className="text-xs text-red-600">Requires attention</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Real-time log of all workflow events and system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events, users, companies..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Events</option>
              <option value="job_acceptance">Job Acceptances</option>
              <option value="nda">NDA Events</option>
              <option value="document">Document Events</option>
              <option value="error">Errors Only</option>
            </select>
          </div>

          {/* Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {filter || eventTypeFilter !== 'all' 
                          ? 'No events match your filters' 
                          : 'No events logged yet'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="space-y-1">
                          {getEventBadge(log.event_type)}
                          <div className="text-xs text-muted-foreground">
                            {log.entity_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user_name || 'System'}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.user_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="text-sm">
                            {log.company_name && (
                              <span className="font-medium">{log.company_name}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {formatDetails(log.details, log.metadata)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};