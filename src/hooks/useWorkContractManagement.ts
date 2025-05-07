
import { useState } from 'react';
import { DocumentService, DocumentData } from '@/services/DocumentService';
import { supabase } from "@/lib/supabase";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AcceptedJob } from '@/hooks/jobs/useAcceptedJobsCore';

export const useWorkContractManagement = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  
  /**
   * Generate a Work Contract for an accepted job
   */
  const generateWorkContract = async (
    acceptedJobId: string,
    businessId: string,
    jobseekerId: string,
    projectId: string,
    jobApplicationId: string
  ) => {
    try {
      setIsGenerating(true);
      
      // 1. Check if Work Contract already exists
      const { data: existingJob, error: checkError } = await supabase
        .from('accepted_jobs')
        .select('work_contract_document_id, work_contract_status')
        .eq('id', acceptedJobId)
        .single();
      
      if (checkError) throw checkError;
      
      if (existingJob?.work_contract_document_id) {
        // Work Contract already exists
        return existingJob.work_contract_document_id;
      }
      
      // 2. Fetch business data
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('company_name, contact_person, contact_email, contact_phone')
        .eq('businesses_id', businessId)
        .single();
      
      if (businessError) throw businessError;
      
      // 3. Fetch jobseeker data
      const { data: jobseekerData, error: jobseekerError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', jobseekerId)
        .single();
      
      if (jobseekerError) throw jobseekerError;
      
      // 4. Fetch project data
      const { data: projectData, error: projectError } = await supabase
        .from('business_projects')
        .select('title, description')
        .eq('project_id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      // 5. Fetch accepted job data for equity information
      const { data: acceptedJob, error: acceptedJobError } = await supabase
        .from('accepted_jobs')
        .select('equity_agreed, accepted_discourse')
        .eq('id', acceptedJobId)
        .single();
        
      if (acceptedJobError) throw acceptedJobError;
      
      // 6. Get template
      const template = await DocumentService.getTemplate('work_contract');
      if (!template) throw new Error('Work contract template not found');
      
      // 7. Create document record
      const newDocument = await DocumentService.createDocument(
        'work_contract', 
        businessId, 
        jobseekerId, 
        projectId,
        jobApplicationId,
        acceptedJobId
      );
      
      if (!newDocument) throw new Error('Failed to create document record');
      
      // 8. Prepare document data
      const documentData: DocumentData = {
        businessName: businessData.company_name || 'Unnamed Project',
        businessRepName: businessData.contact_person || '',
        businessRepTitle: 'Representative',
        businessEmail: businessData.contact_email || '',
        businessPhone: businessData.contact_phone || '',
        jobseekerName: `${jobseekerData.first_name || ''} ${jobseekerData.last_name || ''}`.trim(),
        jobseekerEmail: jobseekerData.email || '',
        jobseekerPhone: jobseekerData.phone || '',
        effectiveDate: format(new Date(), 'MMMM d, yyyy'),
        duration: '2',
        confidentialityPeriod: '5',
        arbitrationOrg: 'International Chamber of Commerce',
        projectTitle: projectData.title || 'Project',
        projectDescription: projectData.description || 'Project description not provided',
        equityAmount: acceptedJob.equity_agreed?.toString() || '0',
        equityClass: 'common stock'
      };
      
      // 9. Generate document content
      const documentContent = DocumentService.generateDocumentContent(
        template.template_content,
        documentData
      );
      
      // 10. Save document content
      await DocumentService.saveDocumentContent(newDocument.storage_path, documentContent);
      
      // 11. Update accepted job with Work Contract reference
      await supabase
        .from('accepted_jobs')
        .update({
          work_contract_document_id: newDocument.id,
          work_contract_status: 'draft'
        })
        .eq('id', acceptedJobId);
      
      return newDocument.id;
    } catch (error) {
      console.error('Error generating Work Contract:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Get Work Contract for an accepted job
   */
  const getWorkContract = async (acceptedJobId: string) => {
    try {
      setIsLoadingDocuments(true);
      
      // Get document ID from accepted job
      const { data: job, error: jobError } = await supabase
        .from('accepted_jobs')
        .select('work_contract_document_id')
        .eq('id', acceptedJobId)
        .single();
      
      if (jobError) throw jobError;
      
      if (!job?.work_contract_document_id) return null;
      
      // Get document details
      const { data: document, error: docError } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('id', job.work_contract_document_id)
        .single();
      
      if (docError) throw docError;
      
      // Get document content
      const content = await DocumentService.getDocumentContent(document.storage_path);
      
      return {
        ...document,
        content,
        htmlContent: content ? DocumentService.createHtmlPreview(content) : null
      };
    } catch (error) {
      console.error('Error fetching Work Contract:', error);
      return null;
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  return {
    isGenerating,
    isLoadingDocuments,
    generateWorkContract,
    getWorkContract
  };
};
