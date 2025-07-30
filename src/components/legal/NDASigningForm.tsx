// src/components/legal/NDASigningForm.tsx
// REPLACE YOUR EXISTING FILE WITH THIS IMPROVED VERSION
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNDAStatus } from '@/hooks/legal/useNDAStatus';

interface NDASigningFormProps {
  applicationId: string;
  onSigningComplete?: () => void;
}

interface NDAContentData {
  content: string;
  business_name: string;
  applicant_name: string;
  project_title: string;
  project_creator_name: string;
}

export const NDASigningForm: React.FC<NDASigningFormProps> = ({ 
  applicationId, 
  onSigningComplete 
}) => {
  const { ndaStatus, loading, error, canSign, isCurrentUserSigner, refreshStatus, signNDA } = useNDAStatus(applicationId);
  
  const [ndaContent, setNdaContent] = useState<NDAContentData | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (ndaStatus?.id) {
      loadNDAContent(ndaStatus.id);
    }
  }, [ndaStatus?.id]);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setFullName(`${profile.first_name} ${profile.last_name}`);
        }
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const loadNDAContent = async (documentId: string) => {
    try {
      setContentLoading(true);
      setContentError(null);

      // Call the database function to get NDA content
      const { data, error: rpcError } = await supabase
        .rpc('get_nda_content_for_signing', { document_id: documentId });

      if (rpcError) {
        console.warn('Could not get NDA content from function:', rpcError);
        // Fallback: get template content directly
        await loadFallbackNDAContent();
      } else if (data && data.length > 0) {
        setNdaContent(data[0]);
      } else {
        await loadFallbackNDAContent();
      }
    } catch (err) {
      console.error('Error loading NDA content:', err);
      setContentError('Failed to load NDA content');
    } finally {
      setContentLoading(false);
    }
  };

  const loadFallbackNDAContent = async () => {
    try {
      const { data: template } = await supabase
        .from('document_templates')
        .select('template_content')
        .eq('template_type', 'nda')
        .eq('is_active', true)
        .order('template_version', { ascending: false })
        .limit(1)
        .single();
      
      if (template) {
        setNdaContent({
          content: template.template_content,
          business_name: ndaStatus?.business_name || 'Business',
          applicant_name: fullName || 'Applicant',
          project_title: ndaStatus?.project_title || 'Project',
          project_creator_name: 'Project Creator'
        });
      } else {
        setContentError('No NDA template found');
      }
    } catch (err) {
      console.error('Error loading fallback NDA content:', err);
      setContentError('Failed to load NDA template');
    }
  };

  const handleSignNDA = async () => {
    if (!agreed || !fullName.trim()) {
      toast.error('Please complete all required fields and agree to the terms');
      return;
    }

    setSigning(true);
    try {
      const success = await signNDA();
      if (success && onSigningComplete) {
        onSigningComplete();
      }
    } finally {
      setSigning(false);
    }
  };

  // Loading state
  if (loading || contentLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading NDA document...</span>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || contentError) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error || contentError}</AlertDescription>
          </Alert>
          <Button 
            onClick={refreshStatus} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No NDA found
  if (!ndaStatus) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              No NDA document found for this application. The NDA may not have been generated yet, 
              or the application may not have been accepted.
            </AlertDescription>
          </Alert>
          <Button onClick={refreshStatus} variant="outline" className="mt-4">
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not authorized to sign
  if (!isCurrentUserSigner) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              You are not authorized to sign this NDA document.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Already signed
  if (ndaStatus.status === 'executed') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            NDA Already Signed
          </CardTitle>
          <CardDescription>
            This Non-Disclosure Agreement was signed on {new Date(ndaStatus.updated_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              You have already signed this NDA. You can proceed with the application process.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Signing interface
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Non-Disclosure Agreement
        </CardTitle>
        <CardDescription>
          Business: {ndaStatus.business_name} • Project: {ndaStatus.project_title}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Document Status */}
        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription>
            Status: <strong>{ndaStatus.status.toUpperCase()}</strong> • 
            Created: {new Date(ndaStatus.created_at).toLocaleDateString()}
          </AlertDescription>
        </Alert>

        {/* Document Preview */}
        <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-3">Document Content:</h3>
          <div className="whitespace-pre-wrap text-sm font-mono">
            {ndaContent?.content || 'Loading document content...'}
          </div>
        </div>

        {/* Signature Section */}
        {canSign && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Digital Signature
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full legal name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input
                  value={signatureDate}
                  onChange={(e) => setSignatureDate(e.target.value)}
                  type="date"
                  required
                />
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="nda-agreement"
                checked={agreed}
                onCheckedChange={setAgreed}
              />
              <label 
                htmlFor="nda-agreement" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read, understood, and agree to the terms of this Non-Disclosure Agreement. 
                I understand that this constitutes a legally binding electronic signature.
              </label>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        {canSign && (
          <Button 
            onClick={handleSignNDA} 
            disabled={!agreed || !fullName.trim() || signing}
            className="min-w-32"
          >
            {signing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Signing...
              </>
            ) : (
              'Sign NDA'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default NDASigningForm;