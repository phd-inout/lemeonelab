/**
 * LemeoneLab 2.0: Shared Industry Knowledge Loader
 * Provides unified industry detection & profile loading for both
 * Cortex Scanner (Gravity) and Research System (Weather).
 */

import fs from 'fs'
import path from 'path'

export interface IndustryContext {
  id: string;          // e.g. "ind_001_robotics"
  filename: string;    // e.g. "ind_001_robotics.md"
  name: string;        // e.g. "垂直领域专业机器人 (Specialized Robotics)"
  keywords: string[];  // search keywords extracted from the industry profile
  rawMarkdown: string; // full MD content for prompt injection
  hardConstraints: { dim: string; floor: number }[]; // Physics Laws survival floors
  baselineARPU: number; // Monthly ARPU in USD for MRR calculation
  techDebtLambda: number; // Tech debt gravity coefficient
}

interface IndustryRoute {
  pattern: RegExp;
  file: string;
  keywords: string[];
  defaultARPU: number;
  fullPath: string;
}

/** 
 * Dynamically scan directories for industry files and build routes
 */
function scanIndustries(): IndustryRoute[] {
  const routes: IndustryRoute[] = [];
  const searchPaths = [
    path.join(process.cwd(), 'src/assets/knowledge/industries'),
    path.join(process.cwd(), 'skills')
  ];

  for (const basePath of searchPaths) {
    if (!fs.existsSync(basePath)) continue;

    // Recursive search for .md files that look like industry files
    const findMdFiles = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(findMdFiles(fullPath));
        } else if (file.endsWith('.md') && file.startsWith('ind_')) {
          results.push(fullPath);
        }
      }
      return results;
    };

    const files = basePath.includes('src/assets') ? 
      fs.readdirSync(basePath).filter(f => f.endsWith('.md')).map(f => path.join(basePath, f)) :
      findMdFiles(basePath);

    for (const fullPath of files) {
      try {
        const rawMarkdown = fs.readFileSync(fullPath, 'utf-8');
        const filename = path.basename(fullPath);
        const name = parseIndustryName(rawMarkdown);
        
        // Extract keywords from markdown or use name
        const keywordsMatch = rawMarkdown.match(/Keywords:\s*(.+)/i);
        const keywords = keywordsMatch ? 
          keywordsMatch[1].split(/[，,]/).map(k => k.trim()) : 
          [name.split(' ')[0]];

        const arpu = parseARPU(rawMarkdown) || 45;

        // Create a pattern from keywords and name
        const patternStr = [...keywords, name].join('|');
        
        routes.push({
          pattern: new RegExp(patternStr, 'i'),
          file: filename,
          keywords,
          defaultARPU: arpu,
          fullPath
        });
      } catch (e) {
        console.error(`[IndustryLoader] Failed to parse ${fullPath}:`, e);
      }
    }
  }

  return routes;
}

// Initial routes
let cachedRoutes: IndustryRoute[] | null = null;
function getRoutes() {
  if (!cachedRoutes) cachedRoutes = scanIndustries();
  return cachedRoutes;
}

/** Match input text to an industry file name */
export function matchIndustry(text: string): string {
  const textLower = text.toLowerCase();
  const routes = getRoutes();
  for (const route of routes) {
    if (textLower.match(route.pattern)) return route.file;
  }
  return 'ind_005_solopreneur.md'; // Fallback
}

/** Get all available industries for AI selection */
export function getAllIndustries() {
  return getRoutes().map(r => ({
    id: r.file.replace('.md', ''),
    keywords: r.keywords,
    file: r.file
  }));
}

/** Extract hard constraint floors from Physics Laws in the raw MD */
function parseHardConstraints(markdown: string): { dim: string; floor: number }[] {
  const constraints: { dim: string; floor: number }[] = [];
  const regex = /IF\s+(D\d+)\s*<\s*([\d.]+)\s*->\s*TRIGGER/gi;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    constraints.push({ dim: match[1].toUpperCase(), floor: parseFloat(match[2]) });
  }
  return constraints;
}

/** Extract TechDebt λ from industry MD (e.g. "TechDebt λ: 1.5") */
function parseTechDebtLambda(markdown: string): number {
  const match = markdown.match(/TechDebt\s*λ:\s*([\d.]+)/i);
  return match ? parseFloat(match[1]) : 0.5;
}

/** Extract ARPU_Baseline from industry MD (e.g. "ARPU_Baseline: $5000") */
function parseARPU(markdown: string): number | null {
  const match = markdown.match(/ARPU_Baseline:\s*\$?([\d,]+)/i);
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : null;
}

/** Extract industry display name from "# Industry DNA: <name>" header */
function parseIndustryName(markdown: string): string {
  const match = markdown.match(/^#\s*Industry DNA:\s*(.+)$/m);
  return match ? match[1].trim() : 'Unknown Industry';
}

/**
 * Load a complete IndustryContext from the user's text.
 */
export function loadIndustryProfile(text: string): IndustryContext | null {
  try {
    const filename = matchIndustry(text);
    const routes = getRoutes();
    const route = routes.find(r => r.file === filename);
    
    if (!route || !fs.existsSync(route.fullPath)) return null;

    const rawMarkdown = fs.readFileSync(route.fullPath, 'utf-8');
    const id = filename.replace('.md', '');

    const parsedARPU = parseARPU(rawMarkdown);
    const fallbackARPU = route.defaultARPU;

    return {
      id,
      filename,
      name: parseIndustryName(rawMarkdown),
      keywords: route.keywords,
      rawMarkdown,
      hardConstraints: parseHardConstraints(rawMarkdown),
      baselineARPU: parsedARPU ?? fallbackARPU,
      techDebtLambda: parseTechDebtLambda(rawMarkdown),
    };
  } catch (e) {
    console.error('[IndustryLoader] Failed to load profile:', e);
    return null;
  }
}
