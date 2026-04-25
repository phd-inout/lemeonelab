const fs = require('fs');
const path = require('path');

/**
 * Lemeone Strategic Codebase Auditor (Core Engine)
 * Shared between MCP Server and Git Hooks.
 */
function analyzeCodebase(rootDir) {
    const results = {
        techDebtLambda: 0.5,
        dims: {
            D1_PERF: 0.5,
            D3_INTERACT: 0.5,
            D4_STABLE: 0.5,
            D5_ENTRY: 0.5,
            D6_MONETIZE: 0.5,
            D11_ECOSYSTEM: 0.5,
            D13_CURVE: 0.5
        },
        evidence: []
    };

    // 1. Vision Audit (README)
    const readmePath = path.join(rootDir, 'README.md');
    if (fs.existsSync(readmePath)) {
        const readme = fs.readFileSync(readmePath, 'utf-8').toLowerCase();
        if (readme.includes('performance') || readme.includes('real-time')) {
            results.dims.D1_PERF = 0.8;
            results.evidence.push("Vision: High performance focus detected.");
        }
        if (readme.includes('scientific') || readme.includes('deterministic')) {
            results.dims.D13_CURVE = 0.8;
            results.evidence.push("Vision: Scientific positioning detected.");
        }
    }

    // 2. Package Fingerprinting
    const packageJsonPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
            
            if (deps['framer-motion'] || deps['tailwindcss'] || deps['lucide-react']) {
                results.dims.D3_INTERACT = 0.8;
                results.evidence.push("Stack: Modern UI/Animation libraries detected.");
            }
            if (deps['jest'] || deps['vitest'] || deps['eslint']) {
                results.dims.D4_STABLE = 0.7;
                results.evidence.push("Stack: Quality assurance infra detected.");
            }
            if (deps['@ai-sdk/google'] || deps['ai']) {
                results.techDebtLambda = 1.8;
                results.evidence.push("AI-native stack increases λ volatility.");
            }
            
            const depCount = Object.keys(deps).length;
            if (depCount > 40) {
                results.techDebtLambda = Math.max(results.techDebtLambda, 1.4);
                results.evidence.push(`Dependency bloat (${depCount} packages).`);
            }
        } catch (e) {}
    }

    // 3. Ecosystem Density (Docs)
    const docsDir = path.join(rootDir, 'src/content/docs');
    if (fs.existsSync(docsDir)) {
        const docs = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
        if (docs.length > 5) {
            results.dims.D11_ECOSYSTEM = 0.9;
            results.evidence.push(`Ecosystem: High documentation density (${docs.length} docs).`);
        }
    }

    // 4. Structural Code Audit
    const srcDir = path.join(rootDir, 'src');
    if (fs.existsSync(srcDir)) {
        let authPoints = 0;
        let payPoints = 0;

        function walk(dir) {
            const list = fs.readdirSync(dir);
            list.forEach(file => {
                const p = path.join(dir, file);
                const stat = fs.statSync(p);
                if (stat.isDirectory()) {
                    if (!['node_modules', '.git', '.next'].includes(file)) walk(p);
                } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
                    const content = fs.readFileSync(p, 'utf-8').substring(0, 1000);
                    if (content.match(/auth|login|clerk|signup/i)) authPoints++;
                    if (content.match(/stripe|payment|checkout|price/i)) payPoints++;
                }
            });
        }
        try { walk(srcDir); } catch (e) {}

        if (authPoints > 3) results.dims.D5_ENTRY = 0.4;
        if (payPoints > 0) results.dims.D6_MONETIZE = 0.8;
    }

    return results;
}

module.exports = { analyzeCodebase };
