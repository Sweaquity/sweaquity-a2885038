
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [organizationData, setOrganizationData] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/recruiter');
        return;
      }

      try {
        // Try to fetch organization data if parent account
        const { data: orgData, error: orgError } = await supabase
          .from('recruiter_organizations')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!orgError && orgData) {
          setOrganizationData(orgData);
        } else {
          // Try to fetch recruiter data if member account
          const { data: recruiterData, error: recruiterError } = await supabase
            .from('recruiters')
            .select('*, recruiter_organizations(*)')
            .eq('id', session.user.id)
            .single();

          if (!recruiterError && recruiterData) {
            setOrganizationData(recruiterData.recruiter_organizations);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      navigate('/auth/recruiter');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {organizationData?.company_name ? `${organizationData.company_name} Dashboard` : 'Recruiter Dashboard'}
          </h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">Organization Details</h2>
            {organizationData && (
              <div className="space-y-2">
                <p><strong>Company:</strong> {organizationData.company_name}</p>
                <p><strong>Type:</strong> {organizationData.organization_type || 'Not specified'}</p>
                <p><strong>Equity Recruiting:</strong> {organizationData.equity_recruiting || 'No'}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
