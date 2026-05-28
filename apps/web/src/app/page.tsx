'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { FileText, Plus, BookOpen, Wrench, Sparkles, Brain, ArrowRight, Loader2, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';

interface StatsData {
  totalAssignments: number;
  assignmentsThisMonth: number;
  totalQuestionsGenerated: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { assignments, fetchAssignments, loadingList } = useAssignmentStore();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    // Fetch stats
    const getStats = async () => {
      try {
        const res = await axios.get(`${apiURL}/api/stats`);
        if (res.data && res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    getStats();
    fetchAssignments();
  }, [fetchAssignments]);

  const recentAssignments = assignments.slice(0, 3);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Hero Panel */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1A1A1A] to-[#2E2E2E] rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none">
          {/* Abstract SVG Background grid */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 L100 0 L100 100 Z" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/20 text-brand text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Assessments</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Teacher'}!
          </h2>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            Generate high-quality, fully customized, curriculum-aligned exam papers in minutes using state-of-the-art AI. Gated strictly under your institution layout.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/create">
              <button className="flex items-center gap-2 bg-brand hover:bg-[#D84D1B] active:scale-95 transition-all text-white font-semibold py-2.5 px-5 rounded-full text-sm shadow-md">
                <Plus className="w-4 h-4" />
                <span>Create New Assignment</span>
              </button>
            </Link>
            <Link href="/toolkit">
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white font-semibold py-2.5 px-5 rounded-full text-sm border border-white/10">
                <span>View Toolkit</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Analytics / KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Assignments</p>
            <h3 className="text-2xl font-bold text-text-primary mt-1">
              {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-text-secondary" /> : stats?.totalAssignments ?? 0}
            </h3>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Created This Month</p>
            <h3 className="text-2xl font-bold text-text-primary mt-1">
              {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-text-secondary" /> : stats?.assignmentsThisMonth ?? 0}
            </h3>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4 transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Questions Generated</p>
            <h3 className="text-2xl font-bold text-text-primary mt-1">
              {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-text-secondary" /> : stats?.totalQuestionsGenerated ?? 0}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Recent Activity & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Assignments list (takes 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-text-primary">Recent Assignments</h3>
              <Link href="/assignments" className="text-sm font-semibold text-brand hover:underline flex items-center gap-1">
                <span>View Library</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingList ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <p className="text-sm text-text-secondary">Retrieving recent assignments...</p>
              </div>
            ) : recentAssignments.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-12 h-12 text-text-secondary/35 mx-auto mb-3" />
                <p className="text-sm text-text-secondary font-medium">No assignments generated yet.</p>
                <p className="text-xs text-text-secondary/70 mt-1">Generate your very first assessment to start cataloging files.</p>
                <Link href="/create" className="mt-4 inline-block">
                  <button className="bg-brand text-white text-xs font-bold py-2 px-4 rounded-full">
                    Create Assignment
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAssignments.map((assignment) => (
                  <div key={assignment._id} className="p-4 rounded-xl bg-surface border border-border/60 hover:border-brand/40 transition-colors flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-white border border-border text-[10px] font-bold px-2 py-0.5 rounded-full text-text-secondary">
                          {assignment.subject}
                        </span>
                        {assignment.className && (
                          <span className="bg-white border border-border text-[10px] font-bold px-2 py-0.5 rounded-full text-text-secondary">
                            {assignment.className}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-text-primary mt-1.5 truncate">
                        {assignment.title}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1">
                        Due: {new Date(assignment.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      {/* Status indicator */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        assignment.status === 'done' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : assignment.status === 'failed'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-orange-50 text-orange-700 animate-pulse'
                      }`}>
                        {assignment.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {assignment.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                        <span>{assignment.status}</span>
                      </span>

                      {assignment.status === 'done' && (
                        <Link href={`/assignments/${assignment._id}/result`}>
                          <button className="text-xs font-bold text-brand hover:underline p-1">
                            View Result
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Action Shortcuts & Info Cards */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-text-primary">Quick Shortcuts</h3>
          
          {/* Card 1 */}
          <Link href="/create" className="block group">
            <div className="p-5 rounded-2xl bg-white border border-border shadow-sm hover:border-brand/40 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary group-hover:text-brand transition-colors">AI Generator Wizard</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Spin up custom exams in real time.</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 2 */}
          <Link href="/toolkit" className="block group">
            <div className="p-5 rounded-2xl bg-white border border-border shadow-sm hover:border-brand/40 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E85D2B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary group-hover:text-brand transition-colors">Teacher's Toolkit</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Access specialized AI utilities.</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 3 */}
          <Link href="/library" className="block group">
            <div className="p-5 rounded-2xl bg-white border border-border shadow-sm hover:border-brand/40 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary group-hover:text-brand transition-colors">My Library</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Review printed question sheets.</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
