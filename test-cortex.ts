import { scanSeed } from './src/lib/engine/cortex-ai';

async function main() {
    console.log("Testing scanSeed...");
    try {
        const resp = await scanSeed(["User: 我想做一个面向独立开发者的 AI 自动化财务工具"], "");
        console.log("SUCCESS:", resp);
    } catch (err) {
        console.error("FATAL ERROR:", err);
    }
}

main();
