'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  useAssignmentStore 
} from '@/store/assignmentStore';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Eye, 
  Plus, 
  Calendar, 
  BookOpen, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { Assignment } from '@vedaai/types';

export default function AssignmentsListPage() {
  const router = useRouter();
  
  // Zustand Store
  const {
    assignments,
    loadingList,
    errorList,
    searchQuery,
    setSearchQuery,
    subjectFilter,
    setSubjectFilter,
    fetchAssignments,
    deleteAssignment
  } = useAssignmentStore();

  // Component UI State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch list on mount
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Click outside to close dropdown menu
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Format date helper: converts ISO string (or other formats) to DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  // Perform delete action
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAssignment(id);
      showToast('Assignment deleted successfully');
      setDeleteConfirmId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete assignment');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Toast popup
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter & Search Logic
  const filteredAssignments = assignments.filter((asg) => {
    const matchesSearch = asg.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asg.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = subjectFilter === 'All' || 
                           asg.subject.toLowerCase() === subjectFilter.toLowerCase();
    
    return matchesSearch && matchesSubject;
  });

  // Extract unique subjects for dropdown filter
  const allSubjects = ['All', ...Array.from(new Set(assignments.map(a => a.subject)))];

  // Helper for Status Badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return <span className="text-[11px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Done</span>;
      case 'processing':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
            <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
            <span>Generating</span>
          </span>
        );
      case 'queued':
        return <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">Queued</span>;
      case 'failed':
        return <span className="text-[11px] font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200 font-medium">Failed</span>;
      default:
        return <span className="text-[11px] font-semibold bg-gray-50 text-text-secondary px-2 py-0.5 rounded-full border border-border">Draft</span>;
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Toast Alert banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-[#1A1A1A] text-white py-3 px-5 rounded-lg shadow-modal text-sm font-medium z-50 animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grid Filter and search header (Only when cards exist or search is active) */}
      {(assignments.length > 0 || searchQuery !== '' || subjectFilter !== 'All') && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 no-print">
          {/* Left: Filter triggers */}
          <div className="flex items-center gap-2">
            <div className="relative inline-block text-left">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="appearance-none bg-white border border-border rounded-md pl-9 pr-8 py-2 text-[13px] font-medium text-text-primary hover:bg-surface focus:outline-none focus:border-brand cursor-pointer shadow-sm min-w-[140px]"
              >
                {allSubjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <Filter className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary pointer-events-none" />
              <div className="absolute right-3 top-3.5 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-text-secondary pointer-events-none"></div>
            </div>
          </div>

          {/* Right: Search box */}
          <div className="relative max-w-full sm:max-w-[280px] w-full">
            <input
              type="text"
              placeholder="Search Assignment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-border rounded-md pl-9 pr-4 py-2 text-[13px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-brand shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-disabled" />
          </div>
        </div>
      )}

      {/* Main loading state */}
      {loadingList && assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
          <p className="text-text-secondary text-sm font-medium">Retrieving assignments...</p>
        </div>
      ) : errorList ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-border rounded-lg p-8 max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-danger mb-3" />
          <h3 className="text-base font-semibold text-text-primary mb-1">Failed to load</h3>
          <p className="text-text-secondary text-sm text-center mb-6">{errorList}</p>
          <button 
            onClick={() => fetchAssignments()}
            className="bg-brand hover:bg-brand-dark text-white font-medium py-2 px-4 rounded-md text-xs transition-colors active:scale-95 shadow-sm"
          >
            Retry Fetching
          </button>
        </div>
      ) : filteredAssignments.length === 0 ? (
        /* Empty state view */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          {/* Custom vector illustration */}
          <svg className="w-full max-w-[280px] h-auto mb-6 text-text-disabled" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="20" width="140" height="110" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="55" y="45" width="90" height="8" rx="4" fill="#F3F4F6" />
            <rect x="55" y="65" width="70" height="8" rx="4" fill="#F3F4F6" />
            <rect x="55" y="85" width="80" height="8" rx="4" fill="#F3F4F6" />
            <circle cx="100" cy="75" r="28" fill="#FFF0EB" />
            <path d="M96 66H104V74H112V82H104V90H96V82H88V74H96V66Z" fill="#E85D2B" />
          </svg>

          <h2 className="text-lg font-semibold text-text-primary mb-2">No assignments yet</h2>
          <p className="text-text-secondary text-sm max-w-[340px] leading-relaxed mb-6">
            Create structured exam-aligned papers and track classroom due dates effortlessly in one place.
          </p>

          <Link href="/create">
            <button className="bg-[#1A1A1A] hover:bg-[#333333] active:scale-95 transition-all text-white font-medium py-3 px-6 rounded-md text-sm shadow-md inline-flex items-center gap-2">
              <Plus className="w-4 h-4 text-white" />
              <span>Create Your First Assignment</span>
            </button>
          </Link>
        </div>
      ) : (
        /* Filled Grid view */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {filteredAssignments.map((asg) => (
            <div 
              key={asg._id}
              className="bg-white border border-border rounded-lg p-5 relative shadow-card animate-hover-card flex flex-col justify-between"
            >
              {/* Card Top Title & Details */}
              <div className="mb-4 pr-6">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-brand tracking-wider bg-brand-light px-2.5 py-0.5 rounded-full">
                    {asg.subject}
                  </span>
                  {getStatusBadge(asg.status)}
                </div>
                <h3 className="text-md font-semibold text-text-primary line-clamp-1 mb-3">
                  {asg.title}
                </h3>

                {/* Dates information */}
                <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-text-disabled" />
                    <span>Assigned: {formatDate(asg.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-text-primary">
                    <Calendar className="w-3.5 h-3.5 text-brand" />
                    <span>Due: {formatDate(asg.dueDate)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer actions */}
              <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                <span className="text-[12px] text-text-secondary truncate max-w-[120px]">
                  {asg.questionTypes.length} question types
                </span>

                {asg.status === 'done' && asg.resultId ? (
                  <Link href={`/assignments/${asg._id}/result`} className="no-print">
                    <button className="flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-dark hover:underline">
                      <Eye className="w-4 h-4" />
                      <span>View Paper</span>
                    </button>
                  </Link>
                ) : asg.status === 'failed' ? (
                  <span className="text-xs text-danger font-medium">Generation Errored</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-text-secondary">
                    <Loader2 className="w-3 h-3 animate-spin text-text-disabled" />
                    <span>Pipeline running</span>
                  </span>
                )}
              </div>

              {/* 3-dot overflow menu (Only when not processing) */}
              {asg.status !== 'processing' && (
                <div className="absolute top-4 right-4 no-print">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === asg._id ? null : asg._id);
                    }}
                    className="p-1.5 hover:bg-surface rounded-full text-text-secondary hover:text-text-primary active:scale-90 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Dropdown Menu layout */}
                  {activeMenuId === asg._id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-modal py-1 z-40 animate-fade-in">
                      {asg.status === 'done' && (
                        <button
                          onClick={() => router.push(`/assignments/${asg._id}/result`)}
                          className="w-full text-left px-4 py-2 text-[13px] text-text-primary hover:bg-surface flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4 text-text-secondary" />
                          <span>View Assignment</span>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirmId(asg._id)}
                        className="w-full text-left px-4 py-2 text-[13px] text-danger hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4 text-danger" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) on mobile */}
      <Link href="/create" className="lg:hidden no-print">
        <button className="fixed bottom-20 right-4 w-12 h-12 bg-brand hover:bg-brand-dark text-white rounded-full flex items-center justify-center shadow-elevated z-40 active:scale-95 transition-transform">
          <Plus className="w-6 h-6 text-white" />
        </button>
      </Link>

      {/* Delete Confirmation Modal Dialog */}
      {deleteConfirmId && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in no-print"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-modal max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-md font-semibold text-text-primary mb-2">Delete Assignment?</h3>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              This action is permanent. All generated exam papers, questions, and cached files associated with this assignment will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deletingId !== null}
                className="border border-border text-text-primary px-4 py-2 rounded-md text-[13px] font-medium hover:bg-surface active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deletingId !== null}
                className="bg-danger hover:bg-red-600 text-white px-5 py-2 rounded-md text-[13px] font-medium active:scale-95 transition-all flex items-center gap-1.5"
              >
                {deletingId ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Trash2 className="w-4 h-4 text-white" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
