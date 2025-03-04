
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, PlusCircle, Trash } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}

export const UserInvitations = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: '',
    role: 'member'
  });
  
  const loadInvitations = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to view invitations");
        return;
      }
      
      // In a real implementation, you would fetch from a business_invitations table
      // For now, we'll show a placeholder message
      setInvitations([]);
      
    } catch (error) {
      console.error("Error loading invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };
  
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newInvite.email) {
      toast.error("Please enter an email address");
      return;
    }
    
    setSending(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to send invitations");
        return;
      }
      
      // In a real implementation, you would create a record in your business_invitations table
      // and send an email with the invitation link
      
      // Placeholder success message
      toast.success(`Invitation sent to ${newInvite.email}`);
      
      // Reset the form
      setNewInvite({
        email: '',
        role: 'member'
      });
      
      // Update the list of invitations
      loadInvitations();
      
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setSending(false);
    }
  };
  
  const handleResendInvite = async (invitationId: string) => {
    try {
      // Placeholder for resending invitation
      toast.success("Invitation resent");
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to resend invitation");
    }
  };
  
  const handleDeleteInvite = async (invitationId: string) => {
    try {
      // Placeholder for deleting invitation
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      toast.success("Invitation deleted");
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast.error("Failed to delete invitation");
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members & Invitations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={newInvite.email}
                onChange={(e) => setNewInvite(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newInvite.role}
                onValueChange={(value) => setNewInvite(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={sending}>
            {sending ? (
              "Sending Invitation..."
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Send Invitation
              </>
            )}
          </Button>
        </form>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Pending Invitations</h3>
          {loading ? (
            <div className="text-center py-8">Loading invitations...</div>
          ) : invitations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell className="capitalize">{invitation.role}</TableCell>
                    <TableCell>{new Date(invitation.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{invitation.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleResendInvite(invitation.id)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteInvite(invitation.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pending invitations. Invite team members to collaborate on your projects.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
