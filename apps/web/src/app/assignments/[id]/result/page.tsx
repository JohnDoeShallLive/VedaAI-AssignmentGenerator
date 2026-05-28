'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { 
  Download, 
  RotateCw, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useJobSocket } from '@/hooks/useJobSocket';
import { GeneratedPaper, Section, Question } from '@vedaai/types';

export default function AssignmentOutputPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const id = params.id as string;
  const isPrintMode = searchParams.get('print') === 'true';

  // Zustand Store
  const {
    generationStatus,
    setGenerationStatus,
    currentJobAssignmentId,
    setCurrentJobAssignmentId,
  } = useAssignmentStore();

  // Socket listener for regeneration support
  useJobSocket(currentJobAssignmentId);

  // Local state
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Fetch paper result on load
  const fetchPaper = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/assignments/${id}/result`);
      if (response.data && response.data.success) {
        setPaper(response.data.data);
      } else {
        setError(response.data?.error || 'Failed to retrieve assessment paper.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred while loading the paper.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPaper();
    }
  }, [id]);

  // Handle PDF download
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      console.log(`[pdf-client]: Triggering Puppeteer PDF download stream for assignment ${id}`);
      
      // Use direct window location assignment for clean native browser downloads
      window.location.href = `${API_BASE_URL}/api/v1/assignments/${id}/pdf`;
      
      // Keep state simple
      setTimeout(() => setDownloading(false), 2000);
    } catch (err: any) {
      console.error('[pdf-client]: Triggering failed:', err);
      setDownloading(false);
    }
  };

  // Handle Paper Regeneration
  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/assignments/${id}/regenerate`);
      if (response.data && response.data.success) {
        // Mark Zustand states
        setCurrentJobAssignmentId(id);
        setGenerationStatus('queued');
        
        // Navigate to Create page or keep on output page showing the WS progress overlay!
        // We will show the processing overlay right on this page by routing to /create or syncing!
        // Let's redirect them back to /create wizard which has the perfect step indicator and live WS workflow overlay!
        router.push('/create');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to trigger regeneration.');
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
        <p className="text-text-secondary text-sm font-medium">Fetching examination paper sheet...</p>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-border rounded-xl p-8 max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-danger mb-3" />
        <h3 className="text-base font-semibold text-text-primary mb-1">Assessment Not Found</h3>
        <p className="text-text-secondary text-xs text-center mb-6 leading-relaxed">
          {error || 'No assessment has been generated for this assignment yet, or it is currently queued.'}
        </p>
        <button 
          onClick={() => router.push('/assignments')}
          className="bg-brand hover:bg-brand-dark text-white font-medium py-2 px-5 rounded-md text-xs transition-colors active:scale-95 shadow-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Helper for Difficulty Badges
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy':
        return 'bg-badge-easy-bg text-badge-easy-text';
      case 'moderate':
        return 'bg-badge-moderate-bg text-badge-moderate-text';
      case 'hard':
        return 'bg-badge-hard-bg text-badge-hard-text';
      default:
        return 'bg-surface text-text-secondary';
    }
  };

  return (
    <div className="relative">
      
      {/* 1. Header Action bar (Hidden in print mode) */}
      {!isPrintMode && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 no-print">
          <div>
            <h2 className="text-md font-semibold text-text-primary">{paper.subject} Assessment</h2>
            <p className="text-[12px] text-text-secondary">Review generated question sheet, inspect keys or print PDF.</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Regenerate Button */}
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="border border-border hover:bg-surface text-text-primary text-xs font-semibold py-2 px-3 rounded-md active:scale-95 transition-transform shadow-sm flex items-center gap-1.5 disabled:opacity-50 select-none bg-white"
            >
              {regenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-text-primary" />
              ) : (
                <RotateCw className="w-3.5 h-3.5 text-text-secondary" />
              )}
              <span>Regenerate</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-semibold py-2 px-4 rounded-md active:scale-95 transition-transform shadow-sm flex items-center gap-1.5 disabled:opacity-50 select-none"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span>Download as PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Structured Printed Paper Canvas */}
      <div 
        className={`bg-white select-none ${
          isPrintMode 
            ? 'print-page w-full p-0 shadow-none font-print' 
            : 'max-w-[800px] mx-auto border border-border shadow-card rounded-xl p-8 md:p-12 font-print'
        }`}
      >
        
        {/* Paper Header */}
        <div className="text-center mb-6">
          <h1 className="text-md font-bold uppercase tracking-wide text-black mb-1">
            {paper.schoolName}
          </h1>
          <h2 className="text-sm font-semibold text-black/80 mb-2">
            Summative Assessment — {paper.subject} ({paper.className})
          </h2>
          
          <div className="border-t border-b border-black py-2 my-3 flex items-center justify-between text-xs font-medium text-black px-1">
            <span>Time Allowed: {paper.timeAllowed}</span>
            <span>Maximum Marks: {paper.totalMarks}</span>
          </div>
        </div>

        {/* Global Compulsory instructions line */}
        <p className="text-xs italic text-black/80 mb-5">
          Instructions: All questions are compulsory. Marks are indicated against each question.
        </p>

        {/* Student identification Blanks */}
        <div className="grid grid-cols-3 gap-4 border border-black/40 p-3 mb-8 text-xs font-semibold text-black/80 rounded-sm">
          <div className="flex items-end">
            <span>Name: </span>
            <span className="flex-1 border-b border-black/40 border-dotted ml-2 h-4"></span>
          </div>
          <div className="flex items-end">
            <span>Roll No: </span>
            <span className="flex-1 border-b border-black/40 border-dotted ml-2 h-4"></span>
          </div>
          <div className="flex items-end">
            <span>Section: </span>
            <span className="flex-1 border-b border-black/40 border-dotted ml-2 h-4"></span>
          </div>
        </div>

        {/* Dynamic Paper Sections (A, B, C...) */}
        <div className="space-y-8">
          {paper.sections.map((section: Section, secIdx: number) => (
            <div key={secIdx} className="space-y-4">
              {/* Section Header */}
              <div className="text-center border-b border-black/10 pb-1.5">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-black">
                  {section.title}
                </h3>
                <p className="text-[11px] italic text-black/70">
                  {section.instruction}
                </p>
              </div>

              {/* Questions list */}
              <div className="space-y-4">
                {section.questions.map((q: Question, qIdx: number) => (
                  <div key={qIdx} className="flex items-start justify-between gap-3 text-sm text-black leading-relaxed">
                    
                    {/* Left: Question Text */}
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <span className="font-bold min-w-[20px]">{qIdx + 1}.</span>
                        <div className="whitespace-pre-wrap flex-1">{q.text}</div>
                      </div>
                    </div>

                    {/* Right: Difficulty Badges (Hidden in print mode) + Marks */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isPrintMode && (
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full select-none ${getDifficultyColor(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                      )}
                      <span className="font-bold text-[12px] whitespace-nowrap min-w-[50px] text-right">
                        [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                      </span>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* 3. Collapsible Answer Key Section (Hidden in print view) */}
      {!isPrintMode && (
        <div className="max-w-[800px] mx-auto mt-6 bg-white border border-border rounded-xl shadow-card overflow-hidden no-print">
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className="w-full flex items-center justify-between p-5 hover:bg-surface font-semibold text-sm transition-colors text-text-primary focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              <span>Assessment Answer Key</span>
            </div>
            {showAnswerKey ? (
              <ChevronUp className="w-5 h-5 text-text-secondary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-secondary" />
            )}
          </button>

          {showAnswerKey && (
            <div className="p-6 border-t border-border bg-[#FAFAFA] space-y-6 animate-fade-in divide-y divide-border">
              {paper.sections.map((section: Section, secIdx: number) => (
                <div key={secIdx} className="pt-4 first:pt-0 space-y-3">
                  <h4 className="text-xs font-bold text-brand uppercase tracking-wider">
                    {section.title} Solutions
                  </h4>
                  <div className="space-y-3">
                    {section.questions.map((q: Question, qIdx: number) => (
                      <div key={qIdx} className="text-xs text-text-primary leading-normal">
                        <p className="font-bold mb-1">
                          Q{qIdx + 1}. {q.text.split('\n')[0]}...
                        </p>
                        <p className="text-text-secondary bg-white p-2.5 rounded border border-border border-l-2 border-l-brand italic">
                          Solution: {q.answer || 'No solution provided.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
