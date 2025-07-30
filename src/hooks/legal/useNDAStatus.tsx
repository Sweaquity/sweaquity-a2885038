// src/hooks/legal/useNDAStatus.ts
// CREATE THIS NEW FILE
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NDAStatus {
  id: string;
  job_application_id: string;
  document_type: string;
  status: 'draft' | 'review' | 'final' | 'executed' | 'amended' | 'terminated';
  business_id: string;
  jobseeker_id: string;
  created_at: string;
  updated_at: string;
  business_name?: string;
  project_title?: string;
}

interface UseNDAStatusReturn {
  ndaStatus: NDAStatus | null;
  loading: boolean;
  error: string | null;
  canSign: boolean;
  isCurrentUserSigner: boolean;
  refreshStatus: () => Promise<void>;
  signNDA: () => Promise<boolean>;
}

export const useNDAStatus = (applicationId: string): UseNDAStatusReturn => {
  const [ndaStatus, setNdaStatus] = useState<NDAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadNDAStatus();
    getCurrentUser();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`nda_status_${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'legal_documents',
          filter: `job_application_id=eq.${applicationId}`
        },
        () => {
          loadNDAStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadNDAStatus = async () => {
    try {
      setError(null);
      
      const { data, error: queryError } = await supabase
        .from('legal_documents')
        .select(`
          id,
          job_application_id,
          document_type,
          status,
          business_id,
          jobseeker_id,
          created_at,
          updated_at,
          businesses(company_name),
          business_projects(title)
        `)
        .eq('job_application_id', applicationId)
        .eq('document_type', 'nda')
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // No NDA found - this might be normal if application hasn't been accepted yet
          setNdaStatus(null);
        } else {
          throw queryError;
        }
      } else {
        const transformedStatus: NDAStatus = {
          ...data,
          business_name: data.businesses?.company_name || 'Unknown Business',
          project_title: data.business_projects?.title || 'Unknown Project'
        };
        setNdaStatus(transformedStatus);
      }
    } catch (err) {
      console.error('Error loading NDA status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load NDA status');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setLoading(true);
    await loadNDAStatus();
  };

  const signNDA = async (): Promise<boolean> => {
    if (!ndaStatus || !currentUserId) {
      toast.error('Cannot sign NDA: missing required data');
      return false;
    }

    try {
      // Update the legal document status to 'executed' (signed)
      const { error: updateError } = await supabase
        .from('legal_documents')
        .update({
          status: 'executed',
          updated_at: new Date().toISOString()
        })
        .eq('id', ndaStatus.id);

      if (updateError) throw updateError;

      // The database function should automatically update job_applications.nda_status
      // via triggers, but let's verify it worked
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
      await refreshStatus();

      toast.success('NDA signed successfully!');
      return true;
    } catch (err) {
      console.error('Error signing NDA:', err);
      toast.error('Failed to sign NDA. Please try again.');
      return false;
    }
  };

  const canSign = ndaStatus && 
    (ndaStatus.status === 'review' || ndaStatus.status === 'final') && 
    ndaStatus.status !== 'executed';

  const isCurrentUserSigner = ndaStatus && 
    currentUserId && 
    ndaStatus.jobseeker_id === currentUserId;

  return {
    ndaStatus,
    loading,
    error,
    canSign: canSign || false,
    isCurrentUserSigner: isCurrentUserSigner || false,
    refreshStatus,
    signNDA
  };
};