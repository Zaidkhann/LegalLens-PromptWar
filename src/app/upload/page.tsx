"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Shield, 
  Loader2
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('Uploading document to server...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);
    setUploadStatusText('Uploading document to backend service...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      setUploadStatusText('Extracting text & page structure...');

      const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to upload document.');
      }

      setUploadStatusText('Processing complete! Navigating to workspace...');
      
      setTimeout(() => {
        router.push(`/workspace/${data.document_id}`);
      }, 500);

    } catch (err: any) {
      setIsUploading(false);
      setErrorMessage(err.message || 'An unexpected error occurred during document processing.');
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Upload Document for Legal Analysis</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Upload any legal contract, rental lease, employment agreement, or policy document. Supported formats: PDF, DOCX, TXT (up to 25MB).
        </p>
      </div>

      {/* Main Dropzone Card */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl">
        {!selectedFile ? (
          /* Drag & Drop Area */
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-700/80 hover:border-brand-500/60 rounded-2xl p-10 text-center space-y-4 cursor-pointer transition-colors bg-slate-950/40"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
              <Upload className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-white">
                Drag & drop your document here, or <span className="text-brand-400 underline">browse files</span>
              </p>
              <p className="text-xs text-slate-400">Supports PDF, DOCX, TXT (Up to 25MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          /* Selected File Preview Card */
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedFile.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="uppercase">{selectedFile.name.split('.').pop()} Document</span>
                    <span>•</span>
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                </div>
              </div>

              {!isUploading && (
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setErrorMessage(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Grounded Security Note */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Shield className="w-4 h-4 text-brand-400" /> Isolated Server Extraction Engine
              </span>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-rose-300 text-xs shadow-lg">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-semibold text-rose-200">Processing Error:</strong>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Uploading Progress Indicator */}
            {isUploading ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-300 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                    Processing Legal Document...
                  </span>
                  <span className="text-slate-400 font-mono">Status</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 animate-pulse w-full" />
                </div>

                <p className="text-xs text-slate-300 font-mono animate-pulse">
                  {uploadStatusText}
                </p>
              </div>
            ) : (
              /* Action CTA */
              <button
                onClick={handleUploadAndProcess}
                className="w-full flex items-center justify-center gap-2 font-semibold px-6 py-4 rounded-xl text-base shadow-glow transition-all bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white active:scale-98"
              >
                <Sparkles className="w-5 h-5 text-brand-200" />
                Process & Extract Text
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
        <span>Uploaded files are stored isolated and processed safely.</span>
      </div>
    </div>
  );
}
