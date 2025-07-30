import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, PenTool, Eye, Calendar, User, Building } from 'lucide-react';

interface DocumentData {
  id: string;
  title: string;
  type: 'NDA' | 'Contract' | 'Amendment';
  status: 'pending' | 'signed' | 'executed' | 'draft';
  content: string;
  created_at: string;
  updated_at: string;
  parties: Array<{
    name: string;
    role: string;
    signed_at?: string;
  }>;
  requires_signature: boolean;
}

interface LegalDocumentViewerProps {
  documentId: string;
  onSign?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
}

export const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({
  documentId,
  onSign,
  onDownload
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Mock document data - replace with actual API call
  const [document] = useState<DocumentData>({
    id: documentId,
    title: 'Software Development Non-Disclosure Agreement',
    type: 'NDA',
    status: 'pending',
    content: `
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of [DATE] by and between [COMPANY NAME], a [STATE] corporation ("Company"), and [INDIVIDUAL NAME] ("Recipient").

1. CONFIDENTIAL INFORMATION
For purposes of this Agreement, "Confidential Information" means all non-public, proprietary or confidential information disclosed by Company to Recipient, including but not limited to:
- Technical data, trade secrets, know-how, research, product plans
- Software code, algorithms, and development methodologies
- Business information, including customer lists, pricing, and marketing strategies
- Any other information that would reasonably be considered confidential

2. OBLIGATIONS OF RECIPIENT
Recipient agrees to:
a) Hold and maintain the Confidential Information in strict confidence
b) Not disclose any Confidential Information to third parties without prior written consent
c) Use the Confidential Information solely for the purpose of evaluating potential business relationships
d) Take reasonable precautions to protect the confidentiality of the information

3. TERM
This Agreement shall remain in effect for a period of three (3) years from the date of execution, unless terminated earlier by mutual agreement.

4. RETURN OF INFORMATION
Upon termination of this Agreement, Recipient shall return or destroy all materials containing Confidential Information.

5. GOVERNING LAW
This Agreement shall be governed by the laws of [STATE].

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

[SIGNATURE BLOCKS]
    `,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    parties: [
      {
        name: 'TechCorp Inc.',
        role: 'Company',
        signed_at: '2025-01-15T10:00:00Z'
      },
      {
        name: 'John Doe',
        role: 'Recipient'
      }
    ],
    requires_signature: true
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">Pending Signature</Badge>;
      case 'signed':
        return <Badge variant="default">Signed</Badge>;
      case 'executed':
        return <Badge variant="secondary">Executed</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'NDA':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'Contract':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'Amendment':
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const handleSign = async () => {
    if (!onSign) return;
    
    setIsLoading(true);
    try {
      await onSign(documentId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(documentId);
    } else {
      // Default download behavior
      const blob = new Blob([document.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${document.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getTypeIcon(document.type)}
              <div>
                <CardTitle className="text-xl">{document.title}</CardTitle>
                <CardDescription className="flex items-center space-x-4 mt-1">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Created {new Date(document.created_at).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{document.type}</span>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(document.status)}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          
          {document.status === 'signed' || document.status === 'executed' ? (
            <Badge variant="outline" className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              Read Only
            </Badge>
          ) : null}
        </div>

        {document.requires_signature && document.status === 'pending' && (
          <Button
            onClick={handleSign}
            disabled={isLoading}
            className="flex items-center"
          >
            <PenTool className="w-4 h-4 mr-2" />
            {isLoading ? 'Signing...' : 'Sign Document'}
          </Button>
        )}
      </div>

      {/* Parties Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {document.parties.map((party, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {party.role === 'Company' ? (
                    <Building className="w-5 h-5 text-blue-500" />
                  ) : (
                    <User className="w-5 h-5 text-green-500" />
                  )}
                  <div>
                    <div className="font-medium">{party.name}</div>
                    <div className="text-sm text-muted-foreground">{party.role}</div>
                  </div>
                </div>
                <div>
                  {party.signed_at ? (
                    <div className="text-right">
                      <Badge variant="default" className="mb-1">Signed</Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(party.signed_at).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Content</CardTitle>
          <CardDescription>
            Review the complete document before signing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg border">
              {document.content}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Section */}
      {document.requires_signature && document.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <PenTool className="w-5 h-5 mr-2" />
              Digital Signature Required
            </CardTitle>
            <CardDescription>
              By signing this document, you agree to all terms and conditions outlined above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <div className="font-medium text-yellow-800">Action Required</div>
                  <div className="text-sm text-yellow-700">
                    This document requires your digital signature to proceed.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleSign}
                disabled={isLoading}
                size="lg"
                className="flex items-center"
              >
                <PenTool className="w-4 h-4 mr-2" />
                {isLoading ? 'Processing Signature...' : 'Sign Document Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};