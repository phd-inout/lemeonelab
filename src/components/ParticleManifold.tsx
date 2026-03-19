"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLemeoneStore } from '@/lib/store';
import { DIM } from '@/lib/engine/types';

/**
 * Pseudo Random generator for stable agent properties
 */
function sfc32(a: number, b: number, c: number, d: number) {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
      var t = (a + b | 0) + d | 0;
      d = d + 1 | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

/**
 * 13D Particle Manifold (T-SNE approximation)
 */
const ParticleManifold: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sandboxState = useLemeoneStore((s) => s.sandboxState);
  const agents = sandboxState?.agents || [];
  const productVector = sandboxState?.productVector;
  const pushLine = useLemeoneStore((s) => s.pushLine);

  // Camera State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredAgent, setHoveredAgent] = useState<any>(null);
  
  // Cache for stable agent coordinates and awareness state
  const agentCache = useRef<Array<{ x: number, y: number, isAware: boolean, isViral: boolean }>>([]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const delta = -e.deltaY;
    const newScale = Math.max(0.1, Math.min(20, transform.scale + delta * zoomSpeed * transform.scale));
    setTransform(prev => ({ ...prev, scale: newScale }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    } else {
      // Logic for semantic drill-down hover/click target check
      const canvas = canvasRef.current;
      if (!canvas || !productVector) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = null;
      // Reverse check for z-index
      for (let i = agents.length - 1; i >= 0; i--) {
         const agent = agents[i];
         const cache = agentCache.current[i];
         if (!cache) continue;
         
         // screen pos
         const sx = cache.x * transform.scale + transform.x;
         const sy = cache.y * transform.scale + transform.y;
         const distSq = (sx - mouseX) ** 2 + (sy - mouseY) ** 2;
         
         if (distSq < (5 * transform.scale) ** 2) {
             found = { agent, cache, i };
             break;
         }
      }
      setHoveredAgent(found);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleMouseClick = () => {
      if (hoveredAgent && hoveredAgent.agent.resonance > 0.6 && !hoveredAgent.cache.isAware) {
          pushLine(`[SYSTEM] Reason: Potential Customer (Resonance: ${(hoveredAgent.agent.resonance).toFixed(2)}), but Awareness (D13) is below detection threshold. No channel touchpoint found.`);
      }
  };

  const autoFocus = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 0.8 });
  }, []);

  // --- RENDERING ENGINE ---

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    if (!productVector || agents.length === 0) return;

    // --- REBUILD CACHE IF NEEDED ---
    if (agentCache.current.length !== agents.length) {
       agentCache.current = agents.map((agent, i) => {
           // Radian Projection (Pseudo T-SNE based on 12D topological distance to product center)
           let dx = 0;
           let dy = 0;
           for(let d=0; d<12; d++) {
               const angle = (d / 12) * Math.PI * 2;
               const mag = agent.vector[d] - 0.5; // Spread from center
               dx += Math.cos(angle) * mag;
               dy += Math.sin(angle) * mag;
           }
           
           // Scatter based on resonance to form clusters
           const getRnd = sfc32(i, i*2, i*3, i*4);
           
           return {
               x: (width / 2) + dx * (width / 3) + (getRnd() - 0.5) * 50,
               y: (height / 2) + dy * (height / 3) + (getRnd() - 0.5) * 50,
               isAware: false,
               isViral: false
           };
       });
    }

    // Update dynamic state (D13 Awareness & D7 Social Virality)
    const awarenessThreshold = productVector[DIM.AWARENESS];
    const socialLeverage = productVector[DIM.SOCIAL]; // D7
    
    agentCache.current.forEach((cache, i) => {
        const getRnd = sfc32(i*5, i*6, i*7, 1);
        const randSeed = getRnd();
        // Base awareness chance
        cache.isAware = randSeed < awarenessThreshold;
        
        // Virality chance (D7 connecting dots)
        if (!cache.isAware && randSeed < awarenessThreshold + (socialLeverage * 0.5) && agents[i].resonance > 0.5) {
            cache.isViral = true; // infected via social
            cache.isAware = true;
        } else {
            cache.isViral = false;
        }
    });

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // DRAW EDGES (D7 VIRALITY)
    ctx.lineWidth = 0.5 / transform.scale;
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.15)';
    for (let i = 0; i < agents.length; i+=10) { // sample to avoid drawing 10M lines
        const cache = agentCache.current[i];
        if (cache.isViral) {
            // Find a nearby "source" bright particle
            for(let j=Math.max(0, i-50); j<Math.min(agents.length, i+50); j++) {
                if(agentCache.current[j].isAware && !agentCache.current[j].isViral) {
                    ctx.beginPath();
                    ctx.moveTo(cache.x, cache.y);
                    ctx.lineTo(agentCache.current[j].x, agentCache.current[j].y);
                    ctx.stroke();
                    break;
                }
            }
        }
    }

    // DRAW PARTICLES
    agents.forEach((agent, i) => {
      const cache = agentCache.current[i];
      const res = agent.resonance;
      
      let fillStyle = '';
      if (cache.isAware) {
         // Bright Particles (Reached)
         const r = Math.floor(255 * Math.max(0, 1 - res * 1.5));
         const g = Math.floor(255 * Math.min(1, res * 1.5));
         fillStyle = `rgba(${r}, ${g}, 250, ${0.8 + res * 0.2})`; 
      } else {
         // Dark Particles 
         if (res > 0.7) {
             fillStyle = 'rgba(100, 100, 100, 0.5)'; // High match but unaware
         } else {
             fillStyle = 'rgba(20, 20, 20, 0.4)'; // Low match, unaware
         }
      }

      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      ctx.arc(cache.x, cache.y, (cache.isAware ? 2.5 : 1.5) / transform.scale, 0, Math.PI * 2); 
      ctx.fill();
    });

    ctx.restore();

    // 3. UI Overlays
    ctx.fillStyle = 'rgba(0, 242, 255, 0.8)';
    ctx.font = '10px monospace';
    ctx.fillText(`N=${agents.length.toLocaleString()} | ZOOM:${transform.scale.toFixed(1)}x`, 10, 20);
    ctx.fillText(`D13_AWARENESS: ${(awarenessThreshold * 100).toFixed(1)}% | D7_VIRAL_SPREAD`, 10, height - 10);

  }, [agents, productVector, transform]);

  return (
    <div className="relative w-full aspect-square bg-black border border-border-dark rounded overflow-hidden shadow-2xl group">
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        className="w-full h-full cursor-crosshair"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleMouseClick}
        onDoubleClick={autoFocus}
      />
      
      {/* HUD Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={autoFocus}
          className="bg-primary/20 hover:bg-primary/40 border border-primary/50 text-primary text-[9px] px-2 py-1 rounded font-mono uppercase"
        >
          [ Reset_Origin ]
        </button>
      </div>

      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 border border-primary/30 rounded text-[9px] text-primary font-mono uppercase tracking-widest pointer-events-none">
        13D T-SNE Manifold
      </div>

      {hoveredAgent && (
          <div 
             className="absolute pointer-events-none bg-black/90 border border-primary/50 p-2 text-[10px] font-mono whitespace-pre text-primary z-50 rounded"
             style={{ 
                 left: (hoveredAgent.cache.x * transform.scale + transform.x) + 10, 
                 top: (hoveredAgent.cache.y * transform.scale + transform.y) + 10 
             }}
          >
              ID: {hoveredAgent.i}{'\n'}
              Resonance: {hoveredAgent.agent.resonance.toFixed(3)}{'\n'}
              Aware: {hoveredAgent.cache.isAware ? 'YES' : 'NO'}{'\n'}
              {hoveredAgent.agent.resonance > 0.6 && !hoveredAgent.cache.isAware && (
                  <span className="text-orange-400">Click for drill-down analysis...</span>
              )}
          </div>
      )}
    </div>
  );
};

export default ParticleManifold;
