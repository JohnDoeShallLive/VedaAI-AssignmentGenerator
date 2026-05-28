'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Lock, ArrowRight, BookOpen, Brain, FileSpreadsheet, FileText } from 'lucide-react';

interface ToolCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  active: boolean;
  category: string;
}

export default function ToolkitPage() {
  const tools: ToolCard[] = [
    {
      title: 'AI Assessment Creator',
      description: 'Generate fully-structured, curriculum-aligned question papers, answer keys, and reference blueprints in minutes with advanced AI pipelines.',
      icon: Brain,
      href: '/create',
      active: true,
      category: 'Assessment',
    },
    {
      title: 'Board Rubric Builder',
      description: 'Design custom grading rubrics and marking criteria sheets tailored to CBSE, ICSE, and custom boards criteria automatically.',
      icon: FileSpreadsheet,
      href: '#',
      active: false,
      category: 'Grading',
    },
    {
      title: 'Curriculum & Syllabus Planner',
      description: 'Generate granular lecture schedules, unit plan timelines, and learning targets maps based on textbooks or syllabus topics.',
      icon: BookOpen,
      href: '#',
      active: false,
      category: 'Planning',
    },
    {
      title: 'Student Progress Report AI',
      description: 'Draft constructive, personalized feedback paragraphs and report cards summaries to communicate strengths and progress areas.',
      icon: FileText,
      href: '#',
      active: false,
      category: 'Analytics',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text-primary md:text-2xl">AI Teacher's Toolkit</h2>
        <p className="text-sm text-text-secondary mt-1">
          Unlock state-of-the-art pedagogical AI engines. Speed up manual writing by 10x.
        </p>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, idx) => {
          const Icon = tool.icon;

          if (tool.active) {
            return (
              <div
                key={idx}
                className="bg-white border border-border p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-brand/40 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Glow highlight */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-2xl pointer-events-none transition-opacity opacity-70 group-hover:opacity-100"></div>

                <div>
                  <div className="flex justify-between items-center">
                    <span className="bg-brand/10 text-brand text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {tool.category}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-extrabold text-base text-text-primary">
                      {tool.title}
                    </h3>
                  </div>

                  <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-border/60">
                  <Link href={tool.href} className="w-full">
                    <button className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#333333] active:scale-[0.97] transition-all text-white font-semibold py-2.5 rounded-full text-xs shadow-sm">
                      <span>Launch Assessment Tool</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          }

          // Inactive / Disabled locked card
          return (
            <div
              key={idx}
              className="bg-white/80 border border-border p-6 rounded-3xl shadow-sm flex flex-col justify-between relative group select-none overflow-hidden"
            >
              {/* Overlay shading */}
              <div className="absolute inset-0 bg-[#FAFAFA]/40 pointer-events-none"></div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="bg-surface border border-border text-text-secondary/70 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {tool.category}
                  </span>
                  <span className="bg-surface border border-border text-text-secondary/70 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3 text-text-secondary/50" />
                    <span>Locked</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-4 opacity-75">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border text-text-secondary/60 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-text-secondary">
                    {tool.title}
                  </h3>
                </div>

                <p className="text-xs text-text-secondary/70 mt-3 leading-relaxed opacity-75">
                  {tool.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-border/50">
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 bg-surface border border-border text-text-secondary/40 font-semibold py-2.5 rounded-full text-xs cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Available in Premium Plan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
