import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, User, CheckCircle, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { JobApplication } from '@/types/jobSeeker';
import { getTaskStatus } from '@/utils/applicationUtils';

interface PendingApplicationsListProps {
  applications: JobApplication[];
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  onAccept?: (application: JobApplication) => Promise<void>;
  isWithdrawing?: boolean;
}

interface PendingApplicationItemProps {
  application: JobApplication;
  onAccept?: (application: JobApplication) => Promise<void>;
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  isWithdrawing?: boolean;
  getMatchedSkills: () => string[];
  onApplicationUpdated?: () => void;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'accepted':
      return <CheckCircle className="h-4 w-4 mr-1" />;
    case 'pending':
      return <Clock className="h-4 w-4 mr-1" />;
    case 'rejected':
      return <AlertTriangle className="h-4 w-4 mr-1" />;
    default:
      return <Clock className="h-4 w-4 mr-1" />;
  }
};

const PendingApplicationItem: React.FC<PendingApplicationItemProps> = ({
  application,
  onAccept,
  onWithdraw,
  isWithdrawing,
  getMatchedSkills,
  onApplicationUpdated
}) => {
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleWithdraw = async () => {
    if (onWithdraw) {
      await onWithdraw(application.job_app_id, withdrawReason);
      setIsDialogOpen(false);
      setWithdrawReason('');
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    }
  };

  const handleAccept = async () => {
    if (onAccept) {
      await onAccept(application);
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }
    }
  };

  // Find if the skills match with job/task requirements
  const requiredSkills = (application.business_roles?.skill_requirements || [])
    .map((skill: any) => {
      if (typeof skill === 'string') return skill;
      return skill?.skill || skill?.name || '';
    })
    .filter(Boolean)
    .map((s: string) => s.toLowerCase());

  // Handle the case where applicant_skills might not be an array
  const applicantSkills = Array.isArray(application.applicant_skills) 
    ? application.applicant_skills.map((s: string) => s.toLowerCase())
    : [];

  const matchedSkills = requiredSkills.filter(skill => applicantSkills.includes(skill));

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {application.business_roles?.title || 'Unknown Role'}
          </CardTitle>
          <Badge className={getStatusColor(getTaskStatus(application))}>
            {getStatusIcon(getTaskStatus(application))}
            {getTaskStatus(application)}
          </Badge>
        </div>
        <CardDescription>
          {application.business_roles?.project_title || 'Unknown Project'} -{' '}
          {application.business_roles?.company_name || 'Unknown Company'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>Applicant: {application.user_id}</span>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span>Applied on: {formatDate(application.applied_at)}</span>
        </div>
        <div>
          <p className="text-sm font-medium">Matched Skills:</p>
          <div className="flex flex-wrap gap-1">
            {matchedSkills.map((skill, index) => (
              <Badge key={index} variant="secondary">
                {skill}
              </Badge>
            ))}
            {matchedSkills.length === 0 && (
              <span className="text-sm text-muted-foreground">No skills matched</span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {onAccept && (
          <Button onClick={handleAccept} disabled={isWithdrawing}>
            Accept
          </Button>
        )}
        {onWithdraw && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isWithdrawing}>
                Withdraw
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Enter a reason for withdrawing your application. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-2">
                <Input
                  type="text"
                  placeholder="Reason for withdrawal"
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleWithdraw} disabled={!withdrawReason}>
                  Withdraw
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
};

export const PendingApplicationsList: React.FC<PendingApplicationsListProps> = ({
  applications,
  onWithdraw,
  onAccept,
  isWithdrawing,
}) => {
  if (!applications || applications.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">No pending applications found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <PendingApplicationItem
          key={application.job_app_id}
          application={application}
          onWithdraw={onWithdraw}
          onAccept={onAccept}
          isWithdrawing={isWithdrawing}
          getMatchedSkills={() => []}
          onApplicationUpdated={() => {}}
        />
      ))}
    </div>
  );
};
