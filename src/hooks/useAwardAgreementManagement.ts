
import { useState } from 'react';
import { DocumentService, DocumentData } from '@/services/DocumentService';
import { supabase } from "@/lib/supabase";
import { format } from 'date-fns';
import { toast } from 'sonner';

export const useAwardAgreementManagement = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  
  /**
   * Generate an Award Agreement for an accepted job
   */
  const generateAwardAgreement = async (
    acceptedJobId: string,
    businessId: string,
    jobseekerId: string,
    projectId: string,
    jobApplicationId: string,
    completedDeliverables: string
  ) => {
    try {
      setIsGenerating(true);
      
      // 1. Check if Award Agreement already exists
      const { data: existingJob, error: checkError } = await supabase
        .from('accepted_jobs')
        .select('award_agreement_document_id, award_agreement_status, work_contract_document_id')
        .eq('id', acceptedJobId)
        .single();
      
      if (checkError) throw checkError;
      
      if (existingJob?.award_agreement_document_id) {
        // Award Agreement already exists
        return existingJob.award_agreement_document_id;
      }
      
      // Make sure there is a work contract first
      if (!existingJob?.work_contract_document_id) {
        throw new Error('A Work Contract must be created before an Award Agreement');
      }
      
      // 2. Fetch business data
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('company_name, contact_person, contact_email, contact_phone, entity_type, equity_class')
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
      
      // 6. Get work contract document for reference date
      const { data: workContractDoc, error: workContractError } = await supabase
        .from('legal_documents')
        .select('created_at')
        .eq('id', existingJob.work_contract_document_id)
        .single();
        
      if (workContractError) throw workContractError;
      
      // 7. Get template
      const template = await DocumentService.getTemplate('award_agreement');
      if (!template) throw new Error('Award agreement template not found');
      
      // 8. Create document record
      const newDocument = await DocumentService.createDocument(
        'award_agreement', 
        businessId, 
        jobseekerId, 
        projectId,
        jobApplicationId,
        acceptedJobId
      );
      
      if (!newDocument) throw new Error('Failed to create document record');
      
      // 9. Prepare document data
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
        equityClass: businessData.equity_class || 'common stock',
        entityType: businessData.entity_type || 'Corporation',
        equityType: businessData.equity_class || 'Common Stock',
        contractDate: format(new Date(workContractDoc.created_at), 'MMMM d, yyyy'),
        completedDeliverables: completedDeliverables || 'completed the services'
      };
      
      // 10. Generate document content
      const documentContent = DocumentService.generateDocumentContent(
        template.template_content,
        documentData
      );
      
      // 11. Save document content
      await DocumentService.saveDocumentContent(newDocument.storage_path, documentContent);
      
      // 12. Update accepted job with Award Agreement reference
      await supabase
        .from('accepted_jobs')
        .update({
          award_agreement_document_id: newDocument.id,
          award_agreement_status: 'draft'
        })
        .eq('id', acceptedJobId);
      
      return newDocument.id;
    } catch (error) {
      console.error('Error generating Award Agreement:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Get Award Agreement for an accepted job
   */
  const getAwardAgreement = async (acceptedJobId: string) => {
    try {
      setIsLoadingDocuments(true);
      
      // Get document ID from accepted job
      const { data: job, error: jobError } = await supabase
        .from('accepted_jobs')
        .select('award_agreement_document_id')
        .eq('id', acceptedJobId)
        .single();
      
      if (jobError) throw jobError;
      
      if (!job?.award_agreement_document_id) return null;
      
      // Get document details
      const { data: document, error: docError } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('id', job.award_agreement_document_id)
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
      console.error('Error fetching Award Agreement:', error);
      return null;
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  return {
    isGenerating,
    isLoadingDocuments,
    generateAwardAgreement,
    getAwardAgreement
  };
};
