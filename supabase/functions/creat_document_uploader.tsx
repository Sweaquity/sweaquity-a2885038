import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const DocumentUploader = ({ ticketId }) => {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [file, setFile] = useState(null);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };
  
  const uploadFile = async (e) => {
    e.preventDefault();
    if (!file || !ticketId) return;
    
    setUploading(true);
    
    try {
      const user = supabase.auth.user();
      const fileExt = file.name.split('.').pop();
      const filePath = `${ticketId}/${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Create document record in database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          name: fileName || file.name,
          description: fileDescription,
          ticket_id: ticketId,
          file_path: filePath,
          file_type: file.type,
          size_in_kb: Math.round(file.size / 1024),
          uploaded_by: user.id
        });
        
      if (dbError) throw dbError;
      
      // Reset form
      setFile(null);
      setFileName('');
      setFileDescription('');
      
      alert('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
      <h3 className="font-medium mb-3">Upload Document</h3>
      
      <form onSubmit={uploadFile}>
        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">File</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm border rounded cursor-pointer"
            disabled={uploading}
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">Document Name (Optional)</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full p-2 text-sm border rounded"
            placeholder="Will use file name if empty"
            disabled={uploading}
          />
        </div>
        
        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">Description (Optional)</label>
          <textarea
            value={fileDescription}
            onChange={(e) => setFileDescription(e.target.value)}
            className="w-full p-2 text-sm border rounded"
            rows={2}
            disabled={uploading}
          />
        </div>
        
        <button
          type="submit"
          disabled={uploading || !file}
          className="py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
    </div>
  );
};

export default DocumentUploader;
