// src/types/legal.ts

export const LEGAL_DOCUMENT_STATUS = {
  // Database status values (what's actually stored)
  DRAFT: 'draft',
  REVIEW: 'review',        // Maps to "pending signature" in UI
  FINAL: 'final',          // Maps to "signed" in UI  
  EXECUTED: 'executed',    // Maps to "fully executed" in UI
  AMENDED: 'amended',
  TERMINATED: 'terminated'
} as const;

export type LegalDocumentStatus = typeof LEGAL_DOCUMENT_STATUS[keyof typeof LEGAL_DOCUMENT_STATUS];

// UI-friendly status mappings
export const STATUS_DISPLAY = {
  [LEGAL_DOCUMENT_STATUS.DRAFT]: {
    label: 'Draft',
    color: 'outline',
    icon: 'FileText',
    description: 'Document being prepared'
  },
  [LEGAL_DOCUMENT_STATUS.REVIEW]: {
    label: 'Pending Signature',
    color: 'destructive',
    icon: 'Clock', 
    description: 'Awaiting your signature'
  },
  [LEGAL_DOCUMENT_STATUS.FINAL]: {
    label: 'Signed',
    color: 'default',
    icon: 'CheckCircle',
    description: 'Document signed by all parties'
  },
  [LEGAL_DOCUMENT_STATUS.EXECUTED]: {
    label: 'Executed',
    color: 'secondary', 
    icon: 'CheckCircle',
    description: 'Fully executed and active'
  },
  [LEGAL_DOCUMENT_STATUS.AMENDED]: {
    label: 'Amended',
    color: 'outline',
    icon: 'FileText',
    description: 'Document has been modified'
  },
  [LEGAL_DOCUMENT_STATUS.TERMINATED]: {
    label: 'Terminated',
    color: 'destructive',
    icon: 'AlertCircle',
    description: 'Document terminated'
  }
} as const;

// Helper functions
export const getStatusDisplay = (status: LegalDocumentStatus) => {
  return STATUS_DISPLAY[status] || STATUS_DISPLAY[LEGAL_DOCUMENT_STATUS.DRAFT];
};

export const isPendingSignature = (status: LegalDocumentStatus) => {
  return status === LEGAL_DOCUMENT_STATUS.REVIEW;
};

export const isSigned = (status: LegalDocumentStatus) => {
  return status === LEGAL_DOCUMENT_STATUS.FINAL || status === LEGAL_DOCUMENT_STATUS.EXECUTED;
};

export const requiresAction = (status: LegalDocumentStatus) => {
  return status === LEGAL_DOCUMENT_STATUS.REVIEW;
};
