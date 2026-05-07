import { useState, useRef } from 'react';
import axios from 'axios';
import { generateSampleAgrUsersCSV, generateSampleAgr1251CSV, downloadSampleCSV } from '../../utils/sod-sample-data.js';

interface SoDUploadComponentProps {
  projectId: string;
  onDetectionComplete: (results: any) => void;
}

export default function SoDUploadComponent({ projectId, onDetectionComplete }: SoDUploadComponentProps) {
  const [agrUsersFile, setAgrUsersFile] = useState<File | null>(null);
  const [agr1251File, setAgr1251File] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const agrUsersRef = useRef<HTMLInputElement>(null);
  const agr1251Ref = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null, type: 'users' | 'tcodes') => {
    if (type === 'users') {
      setAgrUsersFile(file);
    } else {
      setAgr1251File(file);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agrUsersFile || !agr1251File) {
      setError('Please select both AGR_USERS and AGR_1251 CSV files');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('agr_users', agrUsersFile);
      formData.append('agr_1251', agr1251File);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/projects/${projectId}/sod/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess(true);
      onDetectionComplete(response.data);
      setAgrUsersFile(null);
      setAgr1251File(null);
      
      if (agrUsersRef.current) agrUsersRef.current.value = '';
      if (agr1251Ref.current) agr1251Ref.current.value = '';

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process files');
    } finally {
      setUploading(false);
    }
  };

  const downloadSamples = () => {
    downloadSampleCSV('AGR_USERS_sample.csv', generateSampleAgrUsersCSV());
    downloadSampleCSV('AGR_1251_sample.csv', generateSampleAgr1251CSV());
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">SoD Detection Engine - Upload SAP Data</h3>
        <button
          type="button"
          onClick={downloadSamples}
          className="text-sm px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded transition-colors"
        >
          Download Sample CSVs
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AGR_USERS File */}
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 hover:border-shield-accent transition-colors cursor-pointer"
               onClick={() => agrUsersRef.current?.click()}>
            <input
              ref={agrUsersRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'users')}
              className="hidden"
            />
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-white mb-1">AGR_USERS CSV</p>
              {agrUsersFile ? (
                <p className="text-xs text-green-400">{agrUsersFile.name}</p>
              ) : (
                <p className="text-xs text-gray-400">Click to upload or drag and drop</p>
              )}
            </div>
          </div>

          {/* AGR_1251 File */}
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 hover:border-shield-accent transition-colors cursor-pointer"
               onClick={() => agr1251Ref.current?.click()}>
            <input
              ref={agr1251Ref}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'tcodes')}
              className="hidden"
            />
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-white mb-1">AGR_1251 CSV</p>
              {agr1251File ? (
                <p className="text-xs text-green-400">{agr1251File.name}</p>
              ) : (
                <p className="text-xs text-gray-400">Click to upload or drag and drop</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 rounded p-3">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900 border border-green-700 rounded p-3">
            <p className="text-sm text-green-200">SoD detection completed successfully!</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={uploading || !agrUsersFile || !agr1251File}
            className="flex-1 px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white font-semibold rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Processing...' : 'Run SoD Detection'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAgrUsersFile(null);
              setAgr1251File(null);
              setError(null);
              if (agrUsersRef.current) agrUsersRef.current.value = '';
              if (agr1251Ref.current) agr1251Ref.current.value = '';
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded transition-colors"
          >
            Clear
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          <strong>Expected CSV format:</strong> AGR_USERS should include columns: uname, user_full_name, user_type, locked_status. 
          AGR_1251 should include: role_name, tcode, tcode_description, auth_object. 
          Click "Download Sample CSVs" to see the expected format with realistic SAP data.
        </p>
      </form>
    </div>
  );
}
