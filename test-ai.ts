import { generateWeekNarrative } from './src/lib/engine/cortex-ai';

async function test() {
    console.log('Testing generateWeekNarrative...');

    const mockState: any = {
        company: {
            stage: 'SEED',
            devProgress: 25.5,
            cash: 85000,
            techDebt: 15,
            mrr: 0
        }
    };

    const mockLog: any = {
        week: 2,
        progressDelta: 10.2,
        cashDelta: -15000
    };

    try {
        const res = await generateWeekNarrative(mockState, mockLog);
        console.log('\n--- AI Response ---');
        console.log(res);
        console.log('-------------------\n');
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
