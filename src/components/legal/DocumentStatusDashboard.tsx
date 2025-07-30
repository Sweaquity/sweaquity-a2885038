// src/components/legal/DocumentStatusDashboard.tsx
// REPLACE YOUR EXISTING FILE WITH THIS VERSION
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, CheckCircle, AlertCircle, Eye, Download, PenTool, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Document {
  id: string;
  document_type: 'nda' | 'contract' | 'amendment';
  business_id: string;
  jobseeker_id: string;
  job_application_id: string;
  status: 'draft' | 'review' | 'final' | 'executed' | 'amended' | 'terminated';
  version: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
  business_name?: string;
  project_title?: string;
  requires_action: boolean;
}

export const DocumentStatusDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
    
    // Set up real-time subscription for document updates
    const channel = supabase
      .channel('legal_documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'legal_documents'
        },
        () => {
          loadDocuments(); // Reload when documents change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDocuments = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Query legal documents for current user (either as jobseeker or business owner)
      const { data: documentsData, error: documentsError } = await supabase
        .from('legal_documents')
        .select(`
          id,
          document_type,
          business_id,
          jobseeker_id,
          job_application_id,
          status,
          version,
          storage_path,
          created_at,
          updated_at,
          businesses(company_name),
          business_projects(title)
        `)
        .or(`jobseeker_id.eq.${user.id},business_id.in.(${await getUserBusinessIds(user.id)})`)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;

      // Transform the data to match our interface
      const transformedDocuments: Document[] = (documentsData || []).map(doc => ({
        ...doc,
        business_name: doc.businesses?.company_name || 'Unknown Business',
        project_title: doc.business_projects?.title || 'Unknown Project',
        requires_action: doc.status === 'review' && doc.jobseeker_id === user.id
      }));

      setDocuments(transformedDocuments);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getUserBusinessIds = async (userId: string): Promise<string> => {
    try {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('businesses_id')
        .eq('owner_id', userId);
      
      return businesses?.map(b => b.businesses_id).join(',') || '';
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'review':
        return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'final':
        return <Badge variant="default"><AlertCircle className="w-3 h-3 mr-1" />Ready to Sign</Badge>;
      case 'executed':
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Executed</Badge>;
      case 'amended':
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />Amended</Badge>;
      case 'terminated':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'nda':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'contract':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'amendment':
        return <FileText className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleViewDocument = (document: Document) => {
    if (document.document_type === 'nda') {
      navigate(`/legal/nda/sign/${document.job_application_id}`);
    } else {
      navigate(`/legal/document/view/${document.id}`);
    }
  };

  const handleSignDocument = (document: Document) => {
    if (document.document_type === 'nda') {
      navigate(`/legal/nda/sign/${document.job_application_id}`);
    } else {
      navigate(`/legal/contract/sign/${document.id}`);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    switch (activeTab) {
      case 'pending':
        return doc.status === 'review' || doc.status === 'final';
      case 'signed':
        return doc.status === 'executed';
      case 'action-required':
        return doc.requires_action;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading documents...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Documents</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadDocuments}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({documents.filter(d => d.status === 'review' || d.status === 'final').length})</TabsTrigger>
          <TabsTrigger value="signed">Executed ({documents.filter(d => d.status === 'executed').length})</TabsTrigger>
          <TabsTrigger value="action-required">Action Required ({documents.filter(d => d.requires_action).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {activeTab === 'all' 
                    ? "You don't have any legal documents yet. Documents will appear here when you apply for projects or accept job offers."
                    : `No documents in the "${activeTab}" category.`
                  }
                </p>
                <Button onClick={loadDocuments} variant="outline" className="mt-4">
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(document.document_type)}
                          <div>
                            <div className="font-medium">
                              {document.document_type.toUpperCase()} - {document.project_title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Created {new Date(document.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{document.document_type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(document.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{document.business_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(document.updated_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(document)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {document.requires_action && (document.status === 'review' || document.status === 'final') && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSignDocument(document)}
                            >
                              <PenTool className="w-4 h-4 mr-1" />
                              Sign
                            </Button>
                          )}
                          
                          {document.status === 'executed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                toast.info('Download functionality coming soon');
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};