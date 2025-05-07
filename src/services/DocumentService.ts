
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { toast } from "sonner";

export interface DocumentData {
  businessName: string;
  businessRepName: string;
  businessRepTitle: string;
  businessEmail: string;
  businessPhone: string;
  jobseekerName: string;
  jobseekerEmail: string;
  jobseekerPhone: string;
  effectiveDate: string;
  duration: string;
  confidentialityPeriod: string;
  arbitrationOrg: string;
}

export interface DocumentTemplate {
  id: string;
  template_type: 'nda' | 'work_contract' | 'award_agreement';
  template_version: string;
  template_name: string;
  template_content: string;
}

export interface LegalDocument {
  id: string;
  document_type: 'nda' | 'work_contract' | 'award_agreement';
  business_id: string | null;
  jobseeker_id: string | null;
  project_id: string | null;
  job_application_id: string | null;
  accepted_job_id: string | null;
  status: 'draft' | 'review' | 'final' | 'executed' | 'amended' | 'terminated';
  version: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
  executed_at: string | null;
}

export class DocumentService {
  /**
   * Get the latest active template for a document type
   */
  static async getTemplate(documentType: 'nda' | 'work_contract' | 'award_agreement'): Promise<DocumentTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('template_type', documentType)
        .eq('is_active', true)
        .order('template_version', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to fetch document template');
      return null;
    }
  }
  
  /**
   * Generate document content from template and data
   */
  static generateDocumentContent(template: string, data: DocumentData): string {
    let populatedTemplate = template;
    
    // Replace placeholders with actual data
    populatedTemplate = populatedTemplate.replace(/\[BUSINESS NAME\/PROJECT NAME\]/g, data.businessName);
    populatedTemplate = populatedTemplate.replace(/\[Representative Name\]/g, data.businessRepName);
    populatedTemplate = populatedTemplate.replace(/\[Title\/Role\]/g, data.businessRepTitle);
    populatedTemplate = populatedTemplate.replace(/\[Email\]/g, data.businessEmail);
    populatedTemplate = populatedTemplate.replace(/\[Phone\]/g, data.businessPhone);
    populatedTemplate = populatedTemplate.replace(/\[JOBSEEKER NAME\]/g, data.jobseekerName);
    populatedTemplate = populatedTemplate.replace(/\[Date\]/g, data.effectiveDate);
    populatedTemplate = populatedTemplate.replace(/\[Duration\]/g, data.duration);
    populatedTemplate = populatedTemplate.replace(/\[Confidentiality Period\]/g, data.confidentialityPeriod);
    populatedTemplate = populatedTemplate.replace(/\[major international arbitration organization\]/g, data.arbitrationOrg);
    
    return populatedTemplate;
  }
  
  /**
   * Create HTML version of the document for preview
   */
  static createHtmlPreview(content: string): string {
    // Replace line breaks with HTML breaks
    let html = content.replace(/\n/g, '<br>');
    
    // Add basic styling
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.5;">
        ${html}
      </div>
    `;
    
    return html;
  }
  
  /**
   * Create a new legal document in the database
   */
  static async createDocument(
    documentType: 'nda' | 'work_contract' | 'award_agreement',
    businessId: string | null,
    jobseekerId: string | null,
    projectId: string | null,
    jobApplicationId: string | null = null,
    acceptedJobId: string | null = null
  ): Promise<LegalDocument | null> {
    try {
      // Create initial storage path
      const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
      const documentId = crypto.randomUUID();
      const storagePath = `${documentType}/${documentId}/${timestamp}-draft.txt`;
      
      // Insert document record
      const { data, error } = await supabase
        .from('legal_documents')
        .insert({
          document_type: documentType,
          business_id: businessId,
          jobseeker_id: jobseekerId,
          project_id: projectId,
          job_application_id: jobApplicationId,
          accepted_job_id: acceptedJobId,
          status: 'draft',
          version: '0.1',
          storage_path: storagePath
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating legal document:', error);
      toast.error('Failed to create legal document');
      return null;
    }
  }
  
  /**
   * Save document content to storage
   */
  static async saveDocumentContent(documentPath: string, content: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .storage
        .from('legal_documents')
        .upload(documentPath, content, {
          contentType: 'text/plain',
          upsert: true
        });
      
      if (error) throw error;
      
      return data.path;
    } catch (error) {
      console.error('Error saving document content:', error);
      toast.error('Failed to save document content');
      return null;
    }
  }
  
  /**
   * Get document content from storage
   */
  static async getDocumentContent(documentPath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .storage
        .from('legal_documents')
        .download(documentPath);
      
      if (error) throw error;
      
      return await data.text();
    } catch (error) {
      console.error('Error fetching document content:', error);
      toast.error('Failed to fetch document content');
      return null;
    }
  }
  
  /**
   * Update document status
   */
  static async updateDocumentStatus(
    documentId: string, 
    status: 'draft' | 'review' | 'final' | 'executed' | 'amended' | 'terminated'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('legal_documents')
        .update({ status })
        .eq('id', documentId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
      return false;
    }
  }
  
  /**
   * Get all documents for a job application
   */
  static async getDocumentsForJobApplication(jobApplicationId: string): Promise<LegalDocument[]> {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('job_application_id', jobApplicationId);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching job application documents:', error);
      toast.error('Failed to fetch documents');
      return [];
    }
  }

  /**
   * Get all documents for an accepted job
   */
  static async getDocumentsForAcceptedJob(acceptedJobId: string): Promise<LegalDocument[]> {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('accepted_job_id', acceptedJobId);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching accepted job documents:', error);
      toast.error('Failed to fetch documents');
      return [];
    }
  }
}
