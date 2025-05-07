
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentService } from '@/services/DocumentService';

interface DocumentViewerProps {
  documentId: string | null;
  documentType: 'nda' | 'work_contract' | 'award_agreement';
  documentTitle: string;
  documentContent: string | null;
  documentStatus: string;
  onApprove?: () => void;
  onReject?: () => void;
  onSign?: () => void;
  readOnly?: boolean;
}

export const DocumentViewer = ({
  documentId,
  documentType,
  documentTitle,
  documentContent,
  documentStatus,
  onApprove,
  onReject,
  onSign,
  readOnly = false
}: DocumentViewerProps) => {
  const [showPreview, setShowPreview] = useState(true);
  
  // Format document status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', color: 'bg-yellow-500' };
      case 'review':
        return { label: 'Under Review', color: 'bg-blue-500' };
      case 'final':
        return { label: 'Final', color: 'bg-green-500' };
      case 'executed':
        return { label: 'Signed', color: 'bg-green-700' };
      case 'amended':
        return { label: 'Amended', color: 'bg-purple-500' };
      case 'terminated':
        return { label: 'Terminated', color: 'bg-red-500' };
      default:
        return { label: status, color: 'bg-gray-500' };
    }
  };
  
  // Format document type for display
  const formatDocType = (type: string) => {
    switch (type) {
      case 'nda':
        return 'Non-Disclosure Agreement';
      case 'work_contract':
        return 'Equity Work Contract';
      case 'award_agreement':
        return 'Equity Award Agreement';
      default:
        return type;
    }
  };
  
  const status = formatStatus(documentStatus);
  
  if (!documentId) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{documentTitle} (Not Created)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-gray-500">
            This document has not been created yet.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{documentTitle}</CardTitle>
          <div className="flex space-x-2 mt-1">
            <Badge variant="outline">{formatDocType(documentType)}</Badge>
            <Badge className={`text-white ${status.color}`}>{status.label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {!readOnly && (
            <>
              {documentStatus === 'draft' && onApprove && (
                <Button variant="outline" onClick={onApprove}>Submit for Review</Button>
              )}
              {documentStatus === 'review' && onApprove && (
                <Button variant="outline" onClick={onApprove}>Approve</Button>
              )}
              {documentStatus === 'review' && onReject && (
                <Button variant="destructive" onClick={onReject}>Request Changes</Button>
              )}
              {documentStatus === 'final' && onSign && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={onSign}>Sign Document</Button>
              )}
            </>
          )}
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Raw Text' : 'Preview'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documentContent ? (
          showPreview ? (
            <div 
              className="border p-4 rounded-md bg-white h-[600px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: DocumentService.createHtmlPreview(documentContent) }}
            />
          ) : (
            <pre className="border p-4 rounded-md bg-gray-50 h-[600px] overflow-y-auto text-sm">
              {documentContent}
            </pre>
          )
        ) : (
          <div className="p-4 text-center text-gray-500">
            Document content could not be loaded.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
