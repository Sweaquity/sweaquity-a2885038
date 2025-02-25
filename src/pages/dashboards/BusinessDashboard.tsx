
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [businessData, setBusinessData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    industry: "",
    project_stage: "",
    website: "",
    contact_phone: "",
    location: ""
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/business');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setBusinessData(data);
        setFormData({
          company_name: data.company_name || "",
          industry: data.industry || "",
          project_stage: data.project_stage || "",
          website: data.website || "",
          contact_phone: data.contact_phone || "",
          location: data.location || ""
        });
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
      navigate('/auth/business');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update(formData)
        .eq('id', businessData.id);

      if (error) throw error;
      setBusinessData({ ...businessData, ...formData });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {businessData?.company_name ? `${businessData.company_name} Dashboard` : 'Business Dashboard'}
          </h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="users">Current Users</TabsTrigger>
            <TabsTrigger value="prior-users">Prior Users</TabsTrigger>
            <TabsTrigger value="roles">Active Roles</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="equity">Equity Structure</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-lg font-semibold">Business Details</h2>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                ) : (
                  <div className="space-x-2">
                    <Button onClick={handleSaveProfile}>Save</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  // Edit form
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
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project_stage">Project Stage</Label>
                      <Input
                        id="project_stage"
                        name="project_stage"
                        value={formData.project_stage}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Company Name</p>
                      <p>{businessData.company_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Industry</p>
                      <p>{businessData.industry || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Project Stage</p>
                      <p>{businessData.project_stage || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Website</p>
                      <p>{businessData.website || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Contact Phone</p>
                      <p>{businessData.contact_phone || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Location</p>
                      <p>{businessData.location || 'Not specified'}</p>
                    </div>
                  </div>
                )}
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

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Current Active Roles</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No active roles found.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Current Applications</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No current applications found.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equity">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Current Equity Structure</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No equity structure information available.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BusinessDashboard;
