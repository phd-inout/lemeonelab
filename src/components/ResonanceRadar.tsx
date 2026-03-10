import React from 'react';
import { FounderVector } from '@/lib/engine/types';

interface Props {
    founderVector: FounderVector; // 20-100 scale
    marketVector: FounderVector;  // 0-1 scale
    resonance: number;
}

const LABELS = ['MKT', 'TEC', 'LRN', 'FIN', 'OPS', 'CHA'];

export default function ResonanceRadar({ founderVector, marketVector, resonance }: Props) {
    const size = 300;
    const center = size / 2;
    const maxRadius = 100;

    // vector format: (value, isFounder) -> convert to SVG points
    const getPoints = (vector: number[], isFounder: boolean) => {
        return vector.map((val, i) => {
            const normalizedValue = isFounder ? val / 100 : val;
            const r = normalizedValue * maxRadius;
            const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
    };

    const bgPolygons = [20, 40, 60, 80, 100].map(val =>
        LABELS.map((_, i) => {
            const r = (val / 100) * maxRadius;
            const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ')
    );

    return (
        <div className="flex flex-col items-center justify-center p-4 h-full">
            <div className="flex justify-between w-full mb-6 items-center border-b border-border-dark pb-2">
                <h3 className="font-bold text-white font-mono flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">radar</span>
                    RESONANCE_ANALYSIS
                </h3>
                <div className="text-right flex items-center gap-3">
                    <div className="text-[10px] text-gray-500 font-mono tracking-widest">ALIGNMENT</div>
                    <div className={`text-lg font-bold font-mono ${resonance > 0.8 ? 'text-[#10b981]' : resonance > 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {(resonance * 100).toFixed(1)}%
                    </div>
                </div>
            </div>

            <div className="relative w-full aspect-square max-w-[280px]">
                <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
                    {/* 背景雷达网 */}
                    {bgPolygons.map((points, j) => (
                        <polygon key={j} points={points} fill="none" stroke="#27272a" strokeWidth="1" />
                    ))}
                    {
                        // 6根轴线
                        LABELS.map((_, i) => {
                            const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
                            return (
                                <line key={`axis-${i}`} x1={center} y1={center} x2={center + maxRadius * Math.cos(angle)} y2={center + maxRadius * Math.sin(angle)} stroke="#27272a" strokeWidth="1" />
                            )
                        })
                    }

                    {/* 刻度文字 */}
                    {LABELS.map((label, i) => {
                        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
                        const x = center + (maxRadius + 25) * Math.cos(angle);
                        const y = center + (maxRadius + 20) * Math.sin(angle);
                        return (
                            <text key={label} x={x} y={y} fill="#71717a" fontSize="12" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">
                                {label}
                            </text>
                        )
                    })}

                    {/* Market Target Vector (Blue dashed) */}
                    <polygon
                        points={getPoints(marketVector, false)}
                        fill="rgba(59, 130, 246, 0.08)"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                    />

                    {/* Founder Vector (Green solid) */}
                    <polygon
                        points={getPoints(founderVector, true)}
                        fill="rgba(16, 185, 129, 0.15)"
                        stroke="#10b981"
                        strokeWidth="2"
                    />

                    {/* 节点原点修饰 */}
                    {founderVector.map((val, i) => {
                        const r = (val / 100) * maxRadius;
                        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
                        const cx = center + r * Math.cos(angle);
                        const cy = center + r * Math.sin(angle);
                        return <circle key={`dot-${i}`} cx={cx} cy={cy} r="3" fill="#0a0a0a" stroke="#10b981" strokeWidth="1.5" />
                    })}
                </svg>

                {/* 图例 */}
                <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-8 text-[10px] font-mono tracking-wider">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-1 bg-[#10b981]"></span>
                        <span className="text-gray-400">FOUNDER</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-px border-t border-dashed border-[#3b82f6]"></span>
                        <span className="text-gray-400">MARKET</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
