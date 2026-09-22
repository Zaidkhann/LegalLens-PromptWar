"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  Shield,
  FileCheck,
  Loader2
} from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<{ name: string; size: string; type: string } | null>({
    name: 'Residential_Rental_Agreement_2026.pdf',
    size: '2.4 MB',
    type: 'PDF Document',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [showError, setShowError] = useState(false);

  const steps = [
    'Parsing PDF layout & extracting text coordinates...',
    'Chunking document into structural legal sections...',
    'Generating text embeddings & vector indices...',
    'Extracting key clauses & evaluating attention signals...',
    'Finalizing plain-language intelligence layer...',
  ];

  const handleStartAnalysis = () => {
    if (showError) return;
    setIsUploading(true);
    setUploadStep(0);

    const interval = setInterval(() => {
      setUploadStep((prev: number) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            router.push('/workspace/demo-doc-1');
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 900);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Upload Document for Legal Analysis</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Upload any legal contract, rental lease, employment agreement, or policy document. Supported formats: PDF, DOCX, TXT.
        </p>
      </div>

      {/* Main Dropzone Card */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl">
        {!file ? (
          /* Drag & Drop Area */
          <div className="border-2 border-dashed border-slate-700/80 hover:border-brand-500/60 rounded-2xl p-10 text-center space-y-4 cursor-pointer transition-colors bg-slate-950/40">
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
              type="file"
              className="hidden"
              onChange={() => {
                setFile({
                  name: 'Sample_Employment_Contract.pdf',
                  size: '1.8 MB',
                  type: 'PDF Document',
                });
              }}
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
                  <h4 className="text-sm font-bold text-white">{file.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{file.type}</span>
                    <span>•</span>
                    <span>{file.size}</span>
                  </div>
                </div>
              </div>

              {!isUploading && (
                <button
                  onClick={() => setFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Simulated Error State Toggle */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Shield className="w-4 h-4 text-brand-400" /> Grounded Analysis Ready
              </span>
              <button
                onClick={() => setShowError(!showError)}
                className="text-slate-500 underline hover:text-slate-300"
              >
                {showError ? 'Disable Error Demo' : 'Test Error State UI'}
              </button>
            </div>

            {/* Error Message Display */}
            {showError && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-semibold text-rose-200">Processing Error Simulation:</strong>
                  <p>Unable to parse PDF text layer. Please ensure the file is not password protected or corrupted.</p>
                </div>
              </div>
            )}

            {/* Uploading Progress Indicator */}
            {isUploading ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-300 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                    Analyzing Legal Document...
                  </span>
                  <span className="text-slate-400 font-mono">Step {uploadStep + 1} of {steps.length}</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${((uploadStep + 1) / steps.length) * 100}%` }}
                  />
                </div>

                <p className="text-xs text-slate-300 font-mono animate-pulse">
                  {steps[uploadStep]}
                </p>
              </div>
            ) : (
              /* Action CTA */
              <button
                onClick={handleStartAnalysis}
                disabled={showError}
                className={`w-full flex items-center justify-center gap-2 font-semibold px-6 py-4 rounded-xl text-base shadow-glow transition-all ${
                  showError
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white active:scale-98'
                }`}
              >
                <Sparkles className="w-5 h-5 text-brand-200" />
                Start LegalLens Analysis
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
        <span>Files are processed confidentially for plain-language comprehension.</span>
        <Link href="/workspace/demo-doc-1" className="text-brand-400 hover:underline">
          Skip to Sample Demo Workspace →
        </Link>
      </div>
    </div>
  );
}
