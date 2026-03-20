"use client";

import React, { useState } from 'react';
import ParticleManifold from './ParticleManifold';
import GrowthChart from './GrowthChart';

const C = {
    cyan: '#00f2ff',
    gray: '#666',
    border: '#1a1a1a'
}

type Tab = 'SPATIAL' | 'TEMPORAL';

export default function VisualizationPanel() {
    const [activeTab, setActiveTab] = useState<Tab>('SPATIAL');

    return (
        <div className="flex flex-col h-full bg-[#050505] rounded overflow-hidden border border-gray-900 shadow-2xl">
            {/* Tab Header */}
            <div className="flex bg-black border-b border-gray-900 h-8 shrink-0">
                <button 
                    onClick={() => setActiveTab('SPATIAL')}
                    className={`flex-1 flex items-center justify-center text-[9px] font-mono tracking-widest transition-all duration-200 border-r border-gray-900 ${
                        activeTab === 'SPATIAL' 
                        ? 'bg-[#111] text-[#00f2ff] shadow-[inset_0_-2px_0_#00f2ff]' 
                        : 'text-gray-600 hover:text-gray-400'
                    }`}
                >
                    [SPATIAL_DNA]
                </button>
                <button 
                    onClick={() => setActiveTab('TEMPORAL')}
                    className={`flex-1 flex items-center justify-center text-[9px] font-mono tracking-widest transition-all duration-200 ${
                        activeTab === 'TEMPORAL' 
                        ? 'bg-[#111] text-[#00f2ff] shadow-[inset_0_-2px_0_#00f2ff]' 
                        : 'text-gray-600 hover:text-gray-400'
                    }`}
                >
                    [TEMPORAL_MOMENTUM]
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden p-2">
                {activeTab === 'SPATIAL' ? (
                    <div className="h-full flex flex-col">
                        <div className="text-[9px] text-gray-700 uppercase mb-2 px-1">Gravity_Field_Manifold</div>
                        <ParticleManifold />
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="text-[9px] text-gray-700 uppercase mb-2 px-1">Momentum_Growth_Curve</div>
                        <GrowthChart />
                    </div>
                )}
            </div>

            {/* Bottom Status */}
            <div className="h-4 bg-black border-t border-gray-900 flex items-center px-2 text-[8px] text-gray-800 font-mono justify-between">
                <span>MODE: {activeTab === 'SPATIAL' ? 'TOPOLOGY_PROJECTION' : 'TIME_SERIES_ANALYSIS'}</span>
                <span className="animate-pulse">● LIVE</span>
            </div>
        </div>
    );
}
