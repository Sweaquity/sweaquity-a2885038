// src/hooks/legal/useNDAWorkflow.ts
import { useState } from 'react';
import { DocumentWorkflowService } from '@/services/DocumentWorkflowService';

export const useNDAWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerNDAGeneration = async (applicationId: string) => {
    setLoading(true);
    setError(null);
    
    const result = await DocumentWorkflowService.triggerNDAGeneration(applicationId);
    
    if (!result.success) {
      setError(result.error || 'Failed to generate NDA');
    }
    
    setLoading(false);
    return result;
  };

  const signNDA = async (documentId: string, signatureData: {
    fullName: string;
    date: string;
    ipAddress?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    const result = await DocumentWorkflowService.signDocument(documentId, signatureData);
    
    if (!result.success) {
      setError(result.error || 'Failed to sign NDA');
    }
    
    setLoading(false);
    return result;
  };

  return {
    triggerNDAGeneration,
    signNDA,
    loading,
    error,
    clearError: () => setError(null)
  };
};

export { DocumentWorkflowService };
