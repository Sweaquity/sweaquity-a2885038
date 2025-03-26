
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { JobApplication } from "@/types/jobSeeker";

interface PendingApplicationsListProps {
  applications: JobApplication[];
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  onAccept?: (application: JobApplication) => Promise<void>;
  isWithdrawing?: boolean;
}

interface ApplicationsTabBaseProps {
  userId: string | null;
}

const ApplicationsTabBase: React.FC<ApplicationsTabBaseProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingApplications, setPendingApplications] = useState<JobApplication[]>([]);
  const [acceptedApplications, setAcceptedApplications] = useState<JobApplication[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<JobApplication[]>([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (userId) {
      loadApplications(userId);
    }
  }, [userId]);

  const loadApplications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      if (data) {
        setPendingApplications(data.filter(app => app.status === 'pending'));
        setAcceptedApplications(data.filter(app => app.status === 'accepted'));
        setRejectedApplications(data.filter(app => app.status === 'rejected'));
      }
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    }
  };

  const handleWithdrawApplication = async (applicationId: string, reason?: string) => {
    setIsWithdrawing(true);
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn', notes: reason || 'Withdrawn by applicant' })
        .eq('job_app_id', applicationId);

      if (error) {
        throw error;
      }

      toast.success("Application withdrawn successfully");
      loadApplications(userId!);
    } catch (error) {
      console.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleAcceptApplication = async (application: JobApplication) => {
    try {
      // Placeholder for accept application logic
      console.log("Accepting application:", application);
      toast.success("Application accepted (placeholder)");
      loadApplications(userId!);
    } catch (error) {
      console.error("Error accepting application:", error);
      toast.error("Failed to accept application");
    }
  };

  const PendingApplicationsList: React.FC<PendingApplicationsListProps> = ({
    applications,
    onWithdraw,
    onAccept,
    isWithdrawing,
  }) => {
    return (
      <div className="space-y-4">
        {applications.length === 0 ? (
          <p className="text-muted-foreground">No pending applications.</p>
        ) : (
          applications.map(application => (
            <Card key={application.job_app_id}>
              <CardHeader>
                <CardTitle>Role: {application.business_roles?.title || 'Unknown Role'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Applied on: {application.applied_at}</p>
                <p>Status: {application.status}</p>
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  variant="destructive"
                  onClick={() => onWithdraw ? onWithdraw(application.job_app_id) : null}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                </Button>
                <Button onClick={() => onAccept ? onAccept(application) : null}>
                  Accept (Placeholder)
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    );
  };

  const AcceptedApplicationsList: React.FC<{ applications: JobApplication[] }> = ({ applications }) => {
    return (
      <div className="space-y-4">
        {applications.length === 0 ? (
          <p className="text-muted-foreground">No accepted applications.</p>
        ) : (
          applications.map(application => (
            <Card key={application.job_app_id}>
              <CardHeader>
                <CardTitle>Role: {application.business_roles?.title || 'Unknown Role'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Applied on: {application.applied_at}</p>
                <p>Status: {application.status}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  const RejectedApplicationsList: React.FC<{ applications: JobApplication[] }> = ({ applications }) => {
    return (
      <div className="space-y-4">
        {applications.length === 0 ? (
          <p className="text-muted-foreground">No rejected applications.</p>
        ) : (
          applications.map(application => (
            <Card key={application.job_app_id}>
              <CardHeader>
                <CardTitle>Role: {application.business_roles?.title || 'Unknown Role'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Applied on: {application.applied_at}</p>
                <p>Status: {application.status}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  return (
    <div>
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <PendingApplicationsList
            applications={pendingApplications}
            onWithdraw={handleWithdrawApplication}
            onAccept={handleAcceptApplication}
            isWithdrawing={isWithdrawing}
          />
        </TabsContent>
        <TabsContent value="accepted" className="mt-4">
          <AcceptedApplicationsList applications={acceptedApplications} />
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          <RejectedApplicationsList applications={rejectedApplications} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationsTabBase;
