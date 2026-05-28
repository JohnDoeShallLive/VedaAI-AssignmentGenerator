'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BookOpen, Search, Calendar, FileText, Download, Loader2, AlertCircle } from 'lucide-react';

interface GeneratedPaperData {
  _id: string;
  assignmentId: string;
  pdfUrl?: string;
  pdfPath?: string;
  sections: any[];
  institutionName?: string;
  subject?: string;
  className?: string;
  generatedAt: string;
  createdAt: string;
}

export default function LibraryPage() {
  const [papers, setPapers] = useState<GeneratedPaperData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchPapers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get(`${apiURL}/api/library`, { params });
      if (res.data && res.data.success) {
        setPapers(res.data.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to search library database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [search, startDate, endDate]);

  const handleClearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text-primary md:text-2xl">My Printed Exam Library</h2>
        <p className="text-sm text-text-secondary mt-1">
          Review and redownload previously generated and finalized assessment papers.
          All documents are securely archived.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-end">
        {/* Search */}
        <div className="flex-1 w-full">
          <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1.5">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-text-secondary/50" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand"
              placeholder="Search by Subject or Institution..."
            />
          </div>
        </div>

        {/* Start Date */}
        <div className="w-full md:w-44">
          <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1.5">
            Start Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="w-4 h-4 text-text-secondary/50" />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* End Date */}
        <div className="w-full md:w-44">
          <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1.5">
            End Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="w-4 h-4 text-text-secondary/50" />
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Clear CTA */}
        {(search || startDate || endDate) && (
          <button
            onClick={handleClearFilters}
            className="w-full md:w-auto px-4 py-2 border border-border text-xs font-semibold rounded-xl hover:bg-surface text-text-secondary transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-2 border border-red-100">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Library listings */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
          <p className="text-sm text-text-secondary">Searching printed archive...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="bg-white border border-border rounded-3xl py-16 text-center max-w-xl mx-auto shadow-sm">
          <BookOpen className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-text-primary">No Archived Papers</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
            You don't have any finalized and generated papers matching your query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {papers.map((paper) => {
            // Determine printable PDF link (Cloudinary secure_url OR local static mapping)
            const printableUrl = paper.pdfUrl || (paper.pdfPath ? `${apiURL}${paper.pdfPath}` : '#');
            
            // Calculate total questions count
            let totalQ = 0;
            if (paper.sections && Array.isArray(paper.sections)) {
              paper.sections.forEach(sec => {
                if (sec.questions && Array.isArray(sec.questions)) {
                  totalQ += sec.questions.length;
                }
              });
            }

            return (
              <div
                key={paper._id}
                className="bg-white border border-border p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-brand/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="bg-brand/10 text-brand text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      {paper.subject || 'General'}
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {new Date(paper.generatedAt || paper.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-text-primary mt-3 truncate">
                    {paper.subject} Exam Paper
                  </h4>

                  <div className="mt-4 space-y-2 text-xs text-text-secondary">
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span>Institution:</span>
                      <span className="font-semibold text-text-primary">{paper.institutionName || 'Default'}</span>
                    </div>
                    {paper.className && (
                      <div className="flex justify-between border-b border-border/40 pb-1">
                        <span>Class:</span>
                        <span className="font-semibold text-text-primary">{paper.className}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span>Total Questions:</span>
                      <span className="font-semibold text-text-primary">{totalQ}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60">
                  <a
                    href={printableUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#333333] active:scale-[0.97] transition-all text-white font-semibold py-2 rounded-full text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download / Print PDF</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
