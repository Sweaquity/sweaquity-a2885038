
import { useState } from 'react';
import { DocumentService, DocumentData } from '@/services/DocumentService';
import { supabase } from "@/lib/supabase";
import { format } from 'date-fns';

export const useNDAManagement = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  
  /**
   * Generate an NDA for a job application
   */
  const generateNDA = async (
    jobApplicationId: string,
    businessId: string,
    jobseekerId: string,
    projectId: string
  ) => {
    try {
      setIsGenerating(true);
      
      // 1. Check if NDA already exists
      const { data: existingNDA, error: checkError } = await supabase
        .from('job_applications')
        .select('nda_document_id, nda_status')
        .eq('job_app_id', jobApplicationId)
        .single();
      
      if (checkError) throw checkError;
      
      if (existingNDA?.nda_document_id) {
        // NDA already exists
        return existingNDA.nda_document_id;
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
      
      // 4. Get template
      const template = await DocumentService.getTemplate('nda');
      if (!template) throw new Error('NDA template not found');
      
      // 5. Create document record
      const newDocument = await DocumentService.createDocument(
        'nda', 
        businessId, 
        jobseekerId, 
        projectId,
        jobApplicationId
      );
      
      if (!newDocument) throw new Error('Failed to create document record');
      
      // 6. Prepare document data
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
        arbitrationOrg: 'International Chamber of Commerce'
      };
      
      // 7. Generate document content
      const documentContent = DocumentService.generateDocumentContent(
        template.template_content,
        documentData
      );
      
      // 8. Save document content
      await DocumentService.saveDocumentContent(newDocument.storage_path, documentContent);
      
      // 9. Update job application with NDA reference
      await supabase
        .from('job_applications')
        .update({
          nda_document_id: newDocument.id,
          nda_status: 'draft'
        })
        .eq('job_app_id', jobApplicationId);
      
      return newDocument.id;
    } catch (error) {
      console.error('Error generating NDA:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Get NDAs for a job application
   */
  const getNDAForJobApplication = async (jobApplicationId: string) => {
    try {
      setIsLoadingDocuments(true);
      
      // Get document ID from job application
      const { data: application, error: appError } = await supabase
        .from('job_applications')
        .select('nda_document_id')
        .eq('job_app_id', jobApplicationId)
        .single();
      
      if (appError) throw appError;
      
      if (!application?.nda_document_id) return null;
      
      // Get document details
      const { data: document, error: docError } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('id', application.nda_document_id)
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
      console.error('Error fetching NDA for job application:', error);
      return null;
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  return {
    isGenerating,
    isLoadingDocuments,
    generateNDA,
    getNDAForJobApplication
  };
};
