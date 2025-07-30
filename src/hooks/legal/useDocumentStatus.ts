// src/hooks/legal/useDocumentStatus.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DocumentStatus {
  id: string;
  type: 'NDA' | 'CONTRACT';
  status: 'pending_signature' | 'pending_approval' | 'executed' | 'draft';
  applicationId?: string;
  businessName: string;
  projectTitle: string;
  createdAt: string;
  executedAt?: string;
}

export const useDocumentStatus = (userId?: string) => {
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [notifications, setNotifications] = useState<DocumentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Load legal documents
      const { data: legalDocs, error: docsError } = await supabase
        .from('legal_documents')
        .select(`
          id,
          document_type,
          status,
          created_at,
          executed_at,
          businesses:business_id (company_name),
          accepted_jobs:accepted_job_id (
            business_projects:business_projects!accepted_jobs_business_id_fkey (title)
          )
        `)
        .eq('job_seeker_id', userId)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Transform data
      const transformedDocs: DocumentStatus[] = (legalDocs || []).map(doc => ({
        id: doc.id,
        type: doc.document_type as 'NDA' | 'CONTRACT',
        status: doc.status,
        businessName: doc.businesses?.company_name || 'Unknown',
        projectTitle: doc.accepted_jobs?.business_projects?.title || 'Unknown',
        createdAt: doc.created_at,
        executedAt: doc.executed_at
      }));

      setDocuments(transformedDocs);

      // Load notifications
      const notifs = await DocumentWorkflowService.getPendingNotifications(userId);
      setNotifications(notifs);

    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [userId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const legalDocsSubscription = supabase
      .channel('legal_documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'legal_documents',
          filter: `job_seeker_id=eq.${userId}`
        },
        () => {
          loadDocuments();
        }
      )
      .subscribe();

    const jobAppsSubscription = supabase
      .channel('job_applications_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_applications',
          filter: `job_seeker_id=eq.${userId}`
        },
        () => {
          loadDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(legalDocsSubscription);
      supabase.removeChannel(jobAppsSubscription);
    };
  }, [userId]);

  return {
    documents,
    notifications,
    loading,
    error,
    refresh: loadDocuments,
    pendingCount: notifications.length
  };
};
