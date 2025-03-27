import React, { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { DashboardHeader } from "@/components/header";
import { DashboardShell } from "@/components/shell";
import { SkillItem } from "@/components/skill/SkillItem";
import { SkillForm } from "@/components/skill/SkillForm";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { CVList } from "@/components/cv/CVList";
import { CVUpload } from "@/components/cv/CVUpload";
import { JobApplication } from "@/types/jobSeeker";
import { Skill } from "@/types/jobSeeker";
import { EquityProject } from "@/types/jobSeeker";
import { DashboardTabProps } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ApplicationsTab } from "@/components/job-seeker/dashboard/tabs/ApplicationsTab";
import { JobSeekerProjectsTab } from "@/components/job-seeker/dashboard/tabs/JobSeekerProjectsTab";
import { DashboardTab } from "@/components/job-seeker/dashboard/tabs/DashboardTab";
import { PendingApplicationsList } from "@/components/job-seeker/dashboard/applications/PendingApplicationsList";

const tabs = [
  {
    title: "Dashboard",
    href: "/dashboards/jobseeker",
    content: "Dashboard Tab",
  },
  {
    title: "Applications",
    href: "/dashboards/jobseeker/applications",
    content: "Applications Tab",
  },
  {
    title: "Projects",
    href: "/dashboards/jobseeker/projects",
    content: "Projects Tab",
  },
];

const defaultSkills = [
  { skill: "React", level: "Expert" },
  { skill: "Node.js", level: "Intermediate" },
  { skill: "PostgreSQL", level: "Beginner" },
];

const defaultProfile = {
  first_name: "John",
  last_name: "Doe",
  title: "Software Engineer",
  bio: "I am a software engineer with 5 years of experience.",
  email: "john.doe@example.com",
  phone: "123-456-7890",
  address: "123 Main St",
  location: "Anytown, USA",
  availability: "Full-time",
  social_links: {
    linkedin: "https://www.linkedin.com/in/johndoe",
    twitter: "https://twitter.com/johndoe",
    github: "https://github.com/johndoe",
    website: "https://johndoe.com",
  },
};

const defaultApplications = [
  {
    job_app_id: "1",
    user_id: "1",
    task_id: "1",
    status: "pending",
    message: "I am interested in this position.",
    applied_at: "2023-01-01",
  },
  {
    job_app_id: "2",
    user_id: "1",
    task_id: "2",
    status: "accepted",
    message: "I am excited to join your team.",
    applied_at: "2023-02-01",
  },
  {
    job_app_id: "3",
    user_id: "1",
    task_id: "3",
    status: "rejected",
    message: "Thank you for your time.",
    applied_at: "2023-03-01",
  },
];

const defaultEquityProjects = [
  {
    id: "1",
    project_id: "1",
    equity_amount: 10,
    time_allocated: "10 hours",
    status: "active",
    start_date: "2023-01-01",
    effort_logs: [],
    total_hours_logged: 0,
    title: "Project 1",
  },
  {
    id: "2",
    project_id: "2",
    equity_amount: 20,
    time_allocated: "20 hours",
    status: "completed",
    start_date: "2023-02-01",
    effort_logs: [],
    total_hours_logged: 0,
    title: "Project 2",
  },
  {
    id: "3",
    project_id: "3",
    equity_amount: 30,
    time_allocated: "30 hours",
    status: "active",
    start_date: "2023-03-01",
    effort_logs: [],
    total_hours_logged: 0,
    title: "Project 3",
  },
];

export default function JobSeekerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [equityProjects, setEquityProjects] = useState<EquityProject[]>([]);
  const [userCVs, setUserCVs] = useState<any[]>([]);
  const [cvUrl, setCvUrl] = useState<string>("");
  const [parsedCvData, setParsedCvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCVs, setLoadingCVs] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [newMessagesCount, setNewMessagesCount] = useState<number>(0);
  const router = useRouter();
  const { tab } = router.query;
  const activeTab = tab ? String(tab) : "dashboard";

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchProfile(user.id);
        await fetchSkills(user.id);
        await fetchApplications(user.id);
        await fetchEquityProjects(user.id);
        await fetchCVs(user.id);
      }
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userCVs && userCVs.length > 0) {
      setCvUrl(userCVs[0].cv_url);
    }
  }, [userCVs]);

  useEffect(() => {
    if (cvUrl) {
      parseCVData(cvUrl);
    }
  }, [cvUrl]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setProfile(data || defaultProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(defaultProfile);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setSkills(data || defaultSkills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      setSkills(defaultSkills);
    }
  };

  const fetchApplications = async (userId: string) => {
    setLoadingApplications(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setApplications(data || defaultApplications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications(defaultApplications);
    } finally {
      setLoadingApplications(false);
    }
  };

  const fetchEquityProjects = async (userId: string) => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('equity_projects')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setEquityProjects(data || defaultEquityProjects);
    } catch (error) {
      console.error("Error fetching equity projects:", error);
      setEquityProjects(defaultEquityProjects);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchCVs = async (userId: string) => {
    setLoadingCVs(true);
    try {
      const { data, error } = await supabase
        .from('user_cvs')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setUserCVs(data || []);
    } catch (error) {
      console.error("Error fetching CVs:", error);
      setUserCVs([]);
    } finally {
      setLoadingCVs(false);
    }
  };

  const parseCVData = async (cvUrl: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('parse-cv', {
        body: {
          cv_url: cvUrl,
        },
      })

      if (error) {
        console.error("Error parsing CV:", error);
        toast({
          title: "Error parsing CV",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setParsedCvData(data);
    } catch (error) {
      console.error("Error parsing CV:", error);
      toast({
        title: "Error parsing CV",
        description: "Failed to parse CV",
        variant: "destructive",
      })
    }
  };

  const handleSkillsUpdate = (newSkills: Skill[]) => {
    setSkills(newSkills);
  };

  const handleCvListUpdated = async () => {
    await fetchCVs(userId || '');
  };

  let sortedProjects = [...equityProjects].sort((a, b) => {
    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  const pendingApplications = applications.filter(
    (application) => application.status === "pending"
  );

  const acceptedApplications = applications.filter(
    (application) => application.status === "accepted"
  );

  const rejectedApplications = applications.filter(
    (application) => application.status === "rejected"
  );

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Manage your profile and applications."
        tabs={tabs}
        activeTab={activeTab}
      />
      <div className="grid gap-6">
        {activeTab === "dashboard" && (
          <DashboardTab
            activeTab={activeTab}
            profile={profile}
            cvUrl={cvUrl}
            parsedCvData={parsedCvData}
            skills={skills}
            onSkillsUpdate={handleSkillsUpdate}
            equityProjects={sortedProjects}
            userCVs={userCVs}
            onCvListUpdated={handleCvListUpdated}
          />
        )}
        {activeTab === "applications" && (
          <ApplicationsTab
            applications={applications}
            onApplicationUpdated={() => {}}
            newMessagesCount={newMessagesCount}
          />
        )}
        {activeTab === "projects" && (
          <JobSeekerProjectsTab userId={userId} />
        )}
      </div>
    </DashboardShell>
  );
}
