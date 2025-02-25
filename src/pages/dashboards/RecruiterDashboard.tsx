
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isBankingEditing, setIsBankingEditing] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    organization_type: "",
    equity_recruiting: "no",
    specializations: [],
    geographic_scope: [],
    banking_details: {
      account_name: "",
      account_number: "",
      sort_code: "",
      bank_name: ""
    }
  });

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
          setFormData({
            company_name: orgData.company_name || "",
            organization_type: orgData.organization_type || "",
            equity_recruiting: orgData.equity_recruiting || "no",
            specializations: orgData.specializations || [],
            geographic_scope: orgData.geographic_scope || [],
            banking_details: orgData.banking_details || {
              account_name: "",
              account_number: "",
              sort_code: "",
              bank_name: ""
            }
          });
        } else {
          // Try to fetch recruiter data if member account
          const { data: recruiterData, error: recruiterError } = await supabase
            .from('recruiters')
            .select('*, recruiter_organizations(*)')
            .eq('id', session.user.id)
            .single();

          if (!recruiterError && recruiterData) {
            setOrganizationData(recruiterData.recruiter_organizations);
            setFormData({
              company_name: recruiterData.recruiter_organizations.company_name || "",
              organization_type: recruiterData.recruiter_organizations.organization_type || "",
              equity_recruiting: recruiterData.recruiter_organizations.equity_recruiting || "no",
              specializations: recruiterData.recruiter_organizations.specializations || [],
              geographic_scope: recruiterData.recruiter_organizations.geographic_scope || [],
              banking_details: recruiterData.recruiter_organizations.banking_details || {
                account_name: "",
                account_number: "",
                sort_code: "",
                bank_name: ""
              }
            });
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

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('recruiter_organizations')
        .update({
          company_name: formData.company_name,
          organization_type: formData.organization_type,
          equity_recruiting: formData.equity_recruiting,
          specializations: formData.specializations,
          geographic_scope: formData.geographic_scope
        })
        .eq('id', organizationData.id);

      if (error) throw error;
      setOrganizationData({ ...organizationData, ...formData });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    }
  };

  const handleSaveBanking = async () => {
    try {
      const { error } = await supabase
        .from('recruiter_organizations')
        .update({
          banking_details: formData.banking_details
        })
        .eq('id', organizationData.id);

      if (error) throw error;
      setOrganizationData({ ...organizationData, banking_details: formData.banking_details });
      setIsBankingEditing(false);
      toast.success("Banking details updated successfully");
    } catch (error) {
      console.error('Error updating banking details:', error);
      toast.error("Failed to update banking details");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      banking_details: {
        ...prev.banking_details,
        [name]: value
      }
    }));
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

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="activity">Past Activity</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="users">Current Users</TabsTrigger>
            <TabsTrigger value="prior-users">Prior Users</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h2 className="text-lg font-semibold">Organization Details</h2>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  ) : (
                    <div className="space-x-2">
                      <Button onClick={handleSaveProfile}>Save</Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                          id="company_name"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organization_type">Organization Type</Label>
                        <Input
                          id="organization_type"
                          name="organization_type"
                          value={formData.organization_type}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">Company Name</p>
                        <p>{organizationData.company_name || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Organization Type</p>
                        <p>{organizationData.organization_type || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Equity Recruiting</p>
                        <p>{organizationData.equity_recruiting || 'No'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h2 className="text-lg font-semibold">Banking Details</h2>
                  {!isBankingEditing ? (
                    <Button onClick={() => setIsBankingEditing(true)}>Edit Banking Details</Button>
                  ) : (
                    <div className="space-x-2">
                      <Button onClick={handleSaveBanking}>Save</Button>
                      <Button variant="outline" onClick={() => setIsBankingEditing(false)}>Cancel</Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {isBankingEditing ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="account_name">Account Name</Label>
                        <Input
                          id="account_name"
                          name="account_name"
                          value={formData.banking_details.account_name}
                          onChange={handleBankingInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="account_number">Account Number</Label>
                        <Input
                          id="account_number"
                          name="account_number"
                          value={formData.banking_details.account_number}
                          onChange={handleBankingInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sort_code">Sort Code</Label>
                        <Input
                          id="sort_code"
                          name="sort_code"
                          value={formData.banking_details.sort_code}
                          onChange={handleBankingInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input
                          id="bank_name"
                          name="bank_name"
                          value={formData.banking_details.bank_name}
                          onChange={handleBankingInputChange}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">Account Name</p>
                        <p>{formData.banking_details.account_name || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Account Number</p>
                        <p>{formData.banking_details.account_number || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Sort Code</p>
                        <p>{formData.banking_details.sort_code || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Bank Name</p>
                        <p>{formData.banking_details.bank_name || 'Not specified'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Relevant Opportunities</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No opportunities found.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Past Activity</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No past activity found.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Current Applications</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No applications found.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Current Users</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No current users found.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prior-users">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Prior Users</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No prior users found.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
