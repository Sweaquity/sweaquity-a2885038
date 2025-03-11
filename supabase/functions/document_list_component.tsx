import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DocumentList = ({ ticketId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (ticketId) {
      fetchDocuments();
    }
  }, [ticketId]);
  
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          name,
          description,
          file_path,
          file_type,
          size_in_kb,
          uploaded_at,
          uploaded_by,
          auth.users(email)
        `)
        .eq('ticket_id', ticketId)
        .order('uploaded_at', { ascending: false });
        
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const downloadFile = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .download(filePath);
        
      if (error) throw error;
      
      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Error downloading file: ${error.message}`);
    }
  };
  
  const deleteDocument = async (id, filePath) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('ticket-attachments')
        .remove([filePath]);
        
      if (storageError) throw storageError;
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
        
      if (dbError) throw dbError;
      
      // Update UI
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  if (loading) return <div className="py-4 text-center text-gray-500">Loading documents...</div>;
  
  return (
    <div className="mt-6">
      <h3 className="font-medium mb-3">Attached Documents</h3>
      
      {documents.length === 0 ? (
        <div className="text-gray-500 text-center py-6 bg-gray-50 rounded border">
          No documents attached to this ticket
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {documents.map(doc => (
            <div key={doc.id} className="p-3 flex items-start">
              <div className="flex-1">
                <div className="font-medium">{doc.name}</div>
                {doc.description && (
                  <div className="text-sm text-gray-600 mt-1">{doc.description}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {doc.size_in_kb} KB • Uploaded {new Date(doc.uploaded_at).toLocaleString()} by {doc.users?.email || 'Unknown'}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => downloadFile(doc.file_path, doc.name)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Download
                </button>
                <button
                  onClick={() => deleteDocument(doc.id, doc.file_path)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
