// src/services/DocumentWorkflowService.ts
import { supabase } from '@/integrations/supabase/client';

export interface DocumentNotification {
  type: 'nda_required' | 'contract_ready' | 'document_signed' | 'approval_needed';
  documentId: string;
  applicationId?: string;
  message: string;
  actionUrl?: string;
}

export class DocumentWorkflowService {
  /**
   * Trigger NDA generation for a job application
   */
  static async triggerNDAGeneration(applicationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update job application status to 'accepted' which will trigger the NDA generation
      const { data, error } = await supabase
        .from('job_applications')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString() 
        })
        .eq('job_app_id', applicationId)
        .select()
        .single();

      if (error) throw error;

      // Wait a moment for the trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify NDA was created
      const { data: updatedApp, error: checkError } = await supabase
        .from('job_applications')
        .select('nda_document_id, nda_status')
        .eq('job_app_id', applicationId)
        .single();

      if (checkError) throw checkError;

      return { 
        success: !!updatedApp.nda_document_id,
        error: !updatedApp.nda_document_id ? 'NDA generation failed' : undefined
      };

    } catch (error) {
      console.error('Error triggering NDA generation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Sign a legal document
   */
  static async signDocument(documentId: string, signatureData: {
    fullName: string;
    date: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current document
      const { data: document, error: fetchError } = await supabase
        .from('legal_documents')
        .select('content')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Add signature to document
      const signedContent = document.content + `\n\n--- DIGITAL SIGNATURE ---\nSigned by: ${signatureData.fullName}\nDate: ${signatureData.date}\nIP Address: ${signatureData.ipAddress || 'Not recorded'}\nTimestamp: ${new Date().toISOString()}`;

      // Update document status
      const { error: updateError } = await supabase
        .from('legal_documents')
        .update({
          status: 'executed',
          content: signedContent,
          executed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      return { success: true };

    } catch (error) {
      console.error('Error signing document:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign document' 
      };
    }
  }

  /**
   * Get pending notifications for a user
   */
  static async getPendingNotifications(userId: string): Promise<DocumentNotification[]> {
    try {
      const notifications: DocumentNotification[] = [];

      // Check for pending NDAs
      const { data: pendingNDAs, error: ndaError } = await supabase
        .from('job_applications')
        .select(`
          job_app_id,
          nda_document_id,
          nda_status,
          businesses:business_id (company_name),
          project_sub_tasks:sub_task_id (
            business_projects:project_id (title)
          )
        `)
        .eq('job_seeker_id', userId)
        .eq('status', 'accepted')
        .eq('nda_status', 'pending')
        .not('nda_document_id', 'is', null);

      if (!ndaError && pendingNDAs) {
        pendingNDAs.forEach(app => {
          notifications.push({
            type: 'nda_required',
            documentId: app.nda_document_id!,
            applicationId: app.job_app_id,
            message: `NDA signature required for ${app.businesses?.company_name}`,
            actionUrl: `/legal/nda/sign/${app.job_app_id}`
          });
        });
      }

      // Check for pending contract approvals
      const { data: pendingContracts, error: contractError } = await supabase
        .from('legal_documents')
        .select(`
          id,
          businesses:business_id (company_name)
        `)
        .eq('job_seeker_id', userId)
        .eq('document_type', 'CONTRACT')
        .eq('status', 'pending_approval');

      if (!contractError && pendingContracts) {
        pendingContracts.forEach(contract => {
          notifications.push({
            type: 'approval_needed',
            documentId: contract.id,
            message: `Contract approval needed for ${contract.businesses?.company_name}`,
            actionUrl: `/legal/document/view/${contract.id}`
          });
        });
      }

      return notifications;

    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Send email notification (placeholder - integrate with your email service)
   */
  static async sendEmailNotification(
    to: string, 
    type: 'nda_required' | 'contract_ready' | 'document_signed',
    data: any
  ): Promise<void> {
    // TODO: Integrate with your email service (SendGrid, Resend, etc.)
    console.log(`Email notification (${type}) would be sent to ${to}:`, data);
    
    // Example implementation with Supabase Edge Functions
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          type,
          data
        }
      });
      
      if (error) {
        console.error('Error sending email:', error);
      }
    } catch (error) {
      console.error('Email service not configured:', error);
    }
  }
}