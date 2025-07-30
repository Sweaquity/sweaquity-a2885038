import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LegalDocumentViewer } from '@/components/legal/LegalDocumentViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

export const NDASigningPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [signatureCompleted, setSignatureCompleted] = useState(false);

  const handleSignDocument = async (documentId: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call to sign document
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would:
      // 1. Call your backend API to record the signature
      // 2. Update the document status in the database
      // 3. Send notifications to relevant parties
      // 4. Generate the signed document
      
      console.log('Signing document:', documentId);
      
      setSignatureCompleted(true);
      toast.success('Document signed successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/legal/documents');
      }, 3000);
      
    } catch (error) {
      console.error('Error signing document:', error);
      toast.error('Failed to sign document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (signatureCompleted) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Document Signed Successfully!</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Your NDA has been digitally signed and recorded. You can now proceed with the project application.
            </p>
            
            <div className="flex space-x-3">
              <Button onClick={() => navigate('/legal/documents')}>
                View All Documents
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sign NDA</h1>
            <p className="text-muted-foreground">
              Review and sign the Non-Disclosure Agreement to proceed
            </p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center">
          <FileText className="w-3 h-3 mr-1" />
          Application #{applicationId}
        </Badge>
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Please read the entire NDA carefully before signing. 
          Your digital signature will be legally binding and indicates your agreement to all terms and conditions.
        </AlertDescription>
      </Alert>

      {/* Progress Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signing Process</CardTitle>
          <CardDescription>
            Complete these steps to finalize your NDA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="text-sm font-medium">Review Document</span>
            </div>
            <div className="flex-1 h-px bg-muted"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="text-sm text-muted-foreground">Digital Signature</span>
            </div>
            <div className="flex-1 h-px bg-muted"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="text-sm text-muted-foreground">Complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer */}
      <LegalDocumentViewer
        documentId={applicationId || 'default'}
        onSign={handleSignDocument}
        onDownload={(documentId) => {
          console.log('Downloading document:', documentId);
          toast.info('Download started');
        }}
      />

      {/* Footer Actions */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Need help? Contact support for assistance with the signing process.
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleGoBack}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleSignDocument(applicationId || 'default')}
              disabled={isLoading}
              className="flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Sign NDA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};