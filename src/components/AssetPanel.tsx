"use client";

import React, { useState } from 'react';
import { useLemeoneStore } from '@/lib/store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * AssetPanel: Displays the 4 core AI-generated Markdown reports.
 * Optimized for Geek UI: Small text, proper scrolling, and typography.
 */
const AssetPanel: React.FC = () => {
  const assets = useLemeoneStore((s) => s.sandboxState?.assets);
  const [activeTab, setActiveTab] = useState<string>('proposal');

  if (!assets) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 font-mono text-[10px] italic animate-pulse">
        [ OFFLINE: WAITING_FOR_INITIALIZATION ]
      </div>
    );
  }

  const tabs = [
    { id: 'proposal', label: 'PROPOSAL' },
    { id: 'backlog', label: 'BACKLOG' },
    { id: 'marketFeedback', label: 'FEEDBACK' },
    { id: 'stressTestReport', label: 'AUDIT' },
    { id: 'competitiveRadar', label: 'RADAR' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#050505] border border-border-dark rounded overflow-hidden">
      {/* 1. Terminal-style Tabs */}
      <div className="flex border-b border-border-dark bg-black/60 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-[9px] font-mono tracking-tighter transition-all border-r border-border-dark last:border-r-0 relative ${
              activeTab === tab.id
                ? 'bg-primary/5 text-primary'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {tab.label}.md
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-primary shadow-[0_0_5px_#00f2ff]"></div>
            )}
          </button>
        ))}
      </div>

      {/* 2. Markdown Content with Optimized Typography */}
      <div className="flex-1 overflow-y-auto p-4 selection:bg-primary/30 min-h-0 scrollbar-thin scrollbar-thumb-gray-800">
        <article className="prose prose-invert prose-xs max-w-none 
          prose-headings:font-mono prose-headings:tracking-tighter prose-headings:uppercase prose-headings:text-primary/80
          prose-h1:text-[13px] prose-h1:border-b prose-h1:border-primary/20 prose-h1:pb-1 prose-h1:mb-4
          prose-h2:text-[11px] prose-h2:mt-6 prose-h2:mb-2
          prose-p:text-[11px] prose-p:text-gray-400 prose-p:leading-relaxed
          prose-li:text-[11px] prose-li:text-gray-400
          prose-strong:text-white prose-strong:font-bold
          prose-code:text-primary/90 prose-code:bg-primary/5 prose-code:px-1 prose-code:rounded
          ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {(assets as any)[activeTab] || `[ EMPTY_BUFFER: ${activeTab} ]`}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};

export default AssetPanel;
