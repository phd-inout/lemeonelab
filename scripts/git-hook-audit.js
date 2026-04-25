#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function analyzeCodebase() {
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

    // 1. Vision Audit
    const readmePath = path.join(rootDir, 'README.md');
    if (fs.existsSync(readmePath)) {
        const readme = fs.readFileSync(readmePath, 'utf-8').toLowerCase();
        if (readme.includes('high performance') || readme.includes('real-time')) {
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
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        
        if (deps['framer-motion'] || deps['tailwindcss']) results.dims.D3_INTERACT = 0.8;
        if (deps['jest'] || deps['eslint']) results.dims.D4_STABLE = 0.7;

        const depCount = Object.keys(deps).length;
        if (depCount > 40) {
            results.techDebtLambda = 1.4;
            results.evidence.push(`Dependency bloat (${depCount} packages).`);
        }
    }

    // 3. Documentation (D11)
    const docsDir = path.join(rootDir, 'src/content/docs');
    if (fs.existsSync(docsDir)) {
        const docs = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
        if (docs.length > 5) results.dims.D11_ECOSYSTEM = 0.9;
    }

    return results;
}

const commitMsgFile = process.argv[2];
if (!commitMsgFile) process.exit(0);

try {
    const analysis = analyzeCodebase();
    const brief = `
# --- LEMEONE-LAB STRATEGIC BRIEF ---
# 
# [📊 实时商业基因快照]
# - 技术债重力 (λ): ${analysis.techDebtLambda}
# - D5 (ENTRY): ${analysis.dims.D5_ENTRY} | D6 (MONETIZE): ${analysis.dims.D6_MONETIZE}
# - 生态潜力 (D11): ${analysis.dims.D11_ECOSYSTEM}
# 
# [⚠️ 战略风险提示]
# ${analysis.evidence.length ? analysis.evidence.map(e => '# * ' + e).join('\n') : '# * No critical risks detected.'}
#
# 请在提交前确认本次代码改动是否符合上述商业重力趋势。
# -----------------------------------
`;

    const currentMsg = fs.readFileSync(commitMsgFile, 'utf-8');
    fs.writeFileSync(commitMsgFile, brief + currentMsg);
} catch (e) {
    // Fail silently to not block commit
}
