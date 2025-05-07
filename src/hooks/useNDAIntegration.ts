
import { useState } from 'react';
import { useNDAManagement } from '@/hooks/useNDAManagement';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useNDAIntegration = () => {
  const [isProcessingNDA, setIsProcessingNDA] = useState(false);
  const { generateNDA, getNDAForJobApplication } = useNDAManagement();
  
  /**
   * Checks if an NDA needs to be generated/signed during the application process
   * @param projectId The ID of the project being applied to
   */
  const checkNDARequirement = async (projectId: string) => {
    try {
      // Check project settings to see if NDA is required
      // Note: Since the require_nda column doesn't exist yet, we'll default to false
      // This column would need to be added in a future database migration
      // For now, we'll just check if the project exists
      const { data, error } = await supabase
        .from('business_projects')
        .select('project_id')
        .eq('project_id', projectId)
        .single();
        
      if (error) {
        console.error("Error checking NDA requirement:", error);
        return false;
      }
      
      // In production, we'd check data.require_nda
      // For now, let's use a placeholder logic (30% chance of requiring NDA)
      return projectId ? (parseInt(projectId.substring(0, 2), 16) % 10 >= 7) : false;
    } catch (error) {
      console.error('Error checking NDA requirement:', error);
      return false;
    }
  };
  
  /**
   * Generates an NDA as part of the application process
   */
  const generateApplicationNDA = async (
    jobApplicationId: string,
    businessId: string,
    userId: string,
    projectId: string
  ) => {
    try {
      setIsProcessingNDA(true);
      
      // Generate the NDA
      const ndaDocId = await generateNDA(
        jobApplicationId,
        businessId,
        userId,
        projectId
      );
      
      toast.success('Non-disclosure agreement has been generated');
      return ndaDocId;
    } catch (error) {
      console.error('Error generating application NDA:', error);
      toast.error('Failed to generate non-disclosure agreement');
      return null;
    } finally {
      setIsProcessingNDA(false);
    }
  };
  
  /**
   * Check if a job application already has an NDA
   */
  const checkExistingNDA = async (jobApplicationId: string) => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('nda_document_id, nda_status')
        .eq('job_app_id', jobApplicationId)
        .single();
        
      if (error) throw error;
      
      return {
        hasNDA: !!data?.nda_document_id,
        status: data?.nda_status || null,
        documentId: data?.nda_document_id || null
      };
    } catch (error) {
      console.error('Error checking existing NDA:', error);
      return { hasNDA: false, status: null, documentId: null };
    }
  };
  
  /**
   * Handle the integration of NDA into the application flow
   * This should be used by the ProjectApplicationPage component
   */
  const handleApplicationNDA = async (
    jobApplicationId: string,
    businessId: string,
    userId: string,
    projectId: string,
    requiresNDA: boolean
  ) => {
    // Skip if NDA is not required
    if (!requiresNDA) return null;
    
    try {
      // Check if application already has an NDA
      const { hasNDA, documentId } = await checkExistingNDA(jobApplicationId);
      
      // If NDA exists, return the document ID
      if (hasNDA) return documentId;
      
      // Otherwise generate a new NDA
      return await generateApplicationNDA(
        jobApplicationId,
        businessId,
        userId,
        projectId
      );
    } catch (error) {
      console.error('Error handling application NDA:', error);
      return null;
    }
  };
  
  return {
    isProcessingNDA,
    checkNDARequirement,
    generateApplicationNDA,
    checkExistingNDA,
    handleApplicationNDA,
    getNDAForJobApplication
  };
};
