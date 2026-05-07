import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import axios from 'axios';
import { generateSampleAgrUsersCSV, generateSampleAgr1251CSV, downloadSampleCSV } from '../../utils/sod-sample-data.js';
export default function SoDUploadComponent({ projectId, onDetectionComplete }) {
    const [agrUsersFile, setAgrUsersFile] = useState(null);
    const [agr1251File, setAgr1251File] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const agrUsersRef = useRef(null);
    const agr1251Ref = useRef(null);
    const handleFileSelect = (file, type) => {
        if (type === 'users') {
            setAgrUsersFile(file);
        }
        else {
            setAgr1251File(file);
        }
        setError(null);
    };
    const handleSubmit = async (e) => {
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
            const response = await axios.post(`/api/projects/${projectId}/sod/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setSuccess(true);
            onDetectionComplete(response.data);
            setAgrUsersFile(null);
            setAgr1251File(null);
            if (agrUsersRef.current)
                agrUsersRef.current.value = '';
            if (agr1251Ref.current)
                agr1251Ref.current.value = '';
            setTimeout(() => setSuccess(false), 3000);
        }
        catch (err) {
            setError(err.response?.data?.error || 'Failed to process files');
        }
        finally {
            setUploading(false);
        }
    };
    const downloadSamples = () => {
        downloadSampleCSV('AGR_USERS_sample.csv', generateSampleAgrUsersCSV());
        downloadSampleCSV('AGR_1251_sample.csv', generateSampleAgr1251CSV());
    };
    return (_jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "SoD Detection Engine - Upload SAP Data" }), _jsx("button", { type: "button", onClick: downloadSamples, className: "text-sm px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded transition-colors", children: "Download Sample CSVs" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "border-2 border-dashed border-slate-600 rounded-lg p-4 hover:border-shield-accent transition-colors cursor-pointer", onClick: () => agrUsersRef.current?.click(), children: [_jsx("input", { ref: agrUsersRef, type: "file", accept: ".csv", onChange: (e) => handleFileSelect(e.target.files?.[0] || null, 'users'), className: "hidden" }), _jsxs("div", { className: "text-center", children: [_jsx("svg", { className: "w-8 h-8 mx-auto mb-2 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }) }), _jsx("p", { className: "text-sm font-medium text-white mb-1", children: "AGR_USERS CSV" }), agrUsersFile ? (_jsx("p", { className: "text-xs text-green-400", children: agrUsersFile.name })) : (_jsx("p", { className: "text-xs text-gray-400", children: "Click to upload or drag and drop" }))] })] }), _jsxs("div", { className: "border-2 border-dashed border-slate-600 rounded-lg p-4 hover:border-shield-accent transition-colors cursor-pointer", onClick: () => agr1251Ref.current?.click(), children: [_jsx("input", { ref: agr1251Ref, type: "file", accept: ".csv", onChange: (e) => handleFileSelect(e.target.files?.[0] || null, 'tcodes'), className: "hidden" }), _jsxs("div", { className: "text-center", children: [_jsx("svg", { className: "w-8 h-8 mx-auto mb-2 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" }) }), _jsx("p", { className: "text-sm font-medium text-white mb-1", children: "AGR_1251 CSV" }), agr1251File ? (_jsx("p", { className: "text-xs text-green-400", children: agr1251File.name })) : (_jsx("p", { className: "text-xs text-gray-400", children: "Click to upload or drag and drop" }))] })] })] }), error && (_jsx("div", { className: "bg-red-900 border border-red-700 rounded p-3", children: _jsx("p", { className: "text-sm text-red-200", children: error }) })), success && (_jsx("div", { className: "bg-green-900 border border-green-700 rounded p-3", children: _jsx("p", { className: "text-sm text-green-200", children: "SoD detection completed successfully!" }) })), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "submit", disabled: uploading || !agrUsersFile || !agr1251File, className: "flex-1 px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white font-semibold rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: uploading ? 'Processing...' : 'Run SoD Detection' }), _jsx("button", { type: "button", onClick: () => {
                                    setAgrUsersFile(null);
                                    setAgr1251File(null);
                                    setError(null);
                                    if (agrUsersRef.current)
                                        agrUsersRef.current.value = '';
                                    if (agr1251Ref.current)
                                        agr1251Ref.current.value = '';
                                }, className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded transition-colors", children: "Clear" })] }), _jsxs("p", { className: "text-xs text-gray-400 mt-4", children: [_jsx("strong", { children: "Expected CSV format:" }), " AGR_USERS should include columns: uname, user_full_name, user_type, locked_status. AGR_1251 should include: role_name, tcode, tcode_description, auth_object. Click \"Download Sample CSVs\" to see the expected format with realistic SAP data."] })] })] }));
}
