import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/hooks/useUser';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { DashboardHeader } from '@/components/job-seeker/DashboardHeader';
import { OpportunitiesTab } from '@/components/job-seeker/dashboard/tabs/OpportunitiesTab';
import { ApplicationsTab } from '@/components/job-seeker/dashboard/tabs/ApplicationsTab';
import { DashboardTab } from '@/components/job-seeker/dashboard/tabs/DashboardTab';
import { SettingsTab } from '@/components/job-seeker/dashboard/tabs/SettingsTab';
import { BillingTab } from '@/components/job-seeker/dashboard/tabs/BillingTab';
import { HelpTab } from '@/components/job-seeker/dashboard/tabs/HelpTab';
import { EquityProjectsTab } from '@/components/job-seeker/dashboard/tabs/EquityProjectsTab';
import {
  DashboardTab as DashboardTabType,
  TabChangeHandler,
} from '@/types/dashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Project } from '@/types/business';

const tabs: DashboardTabType[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'applications', label: 'Applications' },
  { id: 'equity-projects', label: 'Equity Projects' },
  { id: 'settings', label: 'Settings' },
  { id: 'billing', label: 'Billing' },
  { id: 'help', label: 'Help' },
];

const JobSeekerDashboard: React.FC = () => {
  const router = useRouter();
  const { user, session, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login');
    }
  }, [router, session, isLoading]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;

    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        // Make sure we have created_at and updated_at fallbacks
        const sortedProjects = [...projects].sort((a, b) => {
          const dateA = a.updated_at || a.created_at || '';
          const dateB = b.updated_at || b.created_at || '';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        setProjects(data || []);
      }
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleTabChange: TabChangeHandler = (tabId) => {
    setActiveTab(tabId);
    router.push(`/dashboards/job-seeker?tab=${tabId}`, undefined, { shallow: true });
  };

  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab as string);
    }
  }, [router.query]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
          <main className="flex-1 p-8">
            <DashboardHeader title="Loading..." description="Please wait while we load your dashboard." />
            <Card className="w-full">
              <CardHeader>
                <CardTitle><Skeleton className="h-6 w-64" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-96" /></CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="flex-1 p-8">
          <DashboardHeader
            title="Job Seeker Dashboard"
            description="Welcome to your dashboard. Here you can manage your applications, opportunities, and more."
          />
          {activeTab === 'dashboard' && <DashboardTab userId={user.id} />}
          {activeTab === 'opportunities' && (
            <OpportunitiesTab userId={user.id} projects={projects} loading={loadingProjects} />
          )}
          {activeTab === 'applications' && <ApplicationsTab userId={user.id} />}
          {activeTab === 'equity-projects' && (
            <EquityProjectsTab userId={user.id} projects={projects} loading={loadingProjects} />
          )}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'billing' && <BillingTab />}
          {activeTab === 'help' && <HelpTab />}
        </main>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
