// v8 - final_v4 data: secondary_metrics, no C brake, dual-axis
import { NextResponse } from 'next/server';
import { saveSubmission, getAggregates } from '@/lib/persistence';
import { calculateScore } from '@/lib/scoring-engine';
import scoringV1 from '@/data/v1/scoring.json';
import scoringV3 from '@/data/v3/scoring.json';
import scoringV4 from '@/data/v4/scoring.json';
import scoringV6 from '@/data/v6/scoring.json';
import scoringV7 from '@/data/v7/scoring.json';
import scoringV8 from '@/data/v8/scoring.json';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { answers, version = 'v8' } = body;

        if (!answers) {
            return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
        }

        const scoringConfigs: Record<string, any> = {
            v1: scoringV1,
            v3: scoringV3,
            v4: scoringV4,
            v6: scoringV6,
            v7: scoringV7,
            v8: scoringV8
        };

        const scoringConfig = scoringConfigs[version] || scoringV8;
        const result = calculateScore(answers, scoringConfig as any);

        // Save anonymized submission with version tag
        try {
            await saveSubmission({ ...result, version });
        } catch (saveError: any) {
            // Surface Airtable config errors clearly — do NOT block the user from seeing results
            console.error('saveSubmission failed:', saveError?.message);
            // Return result anyway, but flag the save error
            const aggregates = await getAggregates().catch(() => null);
            return NextResponse.json({
                success: false,
                saveError: saveError?.message || 'Unknown save error',
                result,
                aggregates
            }, { status: 200 }); // still 200 so the UI shows results
        }

        // Fetch current aggregates for benchmarking
        const aggregates = await getAggregates();

        return NextResponse.json({ success: true, result, aggregates });
    } catch (error) {
        console.error('Submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

