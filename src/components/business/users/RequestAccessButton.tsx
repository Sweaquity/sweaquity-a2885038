
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const RequestAccessButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestAccess = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      // Get the current session and user details
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in to request access');
        return;
      }

      console.log("Current user ID:", session.user.id);

      // Get the business ID of the current business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('businesses_id, company_name')
        .eq('businesses_id', session.user.id)
        .single();

      if (businessError) {
        console.error('Error fetching business data:', businessError);
        toast.error('Failed to fetch business data');
        return;
      }

      if (!businessData) {
        console.error('No business data found for this user');
        toast.error('No business profile found. Please set up your business profile first.');
        return;
      }

      console.log("Business data:", businessData);

      // Store the invitation request
      const { error } = await supabase
        .from('business_invitations')
        .insert({
          business_id: businessData.businesses_id,
          invited_email: email.trim(),
          status: 'pending',
          created_at: new Date().toISOString(),
          company_name: businessData.company_name || 'Unknown Company',
          first_name: firstName.trim(),
          last_name: lastName.trim(), 
          title: title.trim()
        });

      if (error) {
        console.error('Insert error:', error);
        toast.error('Failed to send access request');
        return;
      }

      toast.success('Access request sent successfully');
      setIsOpen(false);
      setEmail('');
      setFirstName('');
      setLastName('');
      setTitle('');
    } catch (error) {
      console.error('Error requesting access:', error);
      toast.error('Failed to send access request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Request Access
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request User Access</DialogTitle>
            <DialogDescription>
              Enter the details of the person you want to invite to your business.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="Job title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestAccess} 
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
