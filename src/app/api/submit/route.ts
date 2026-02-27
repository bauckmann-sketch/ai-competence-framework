// v12 - latest version
import { NextResponse } from 'next/server';
import { saveSubmission, getAggregates } from '@/lib/persistence';
import { calculateScore } from '@/lib/scoring-engine';
import { sendResultsEmail } from '@/lib/email';
import scoringV1 from '@/data/v1/scoring.json';
import scoringV3 from '@/data/v3/scoring.json';
import scoringV4 from '@/data/v4/scoring.json';
import scoringV6 from '@/data/v6/scoring.json';
import scoringV7 from '@/data/v7/scoring.json';
import scoringV8 from '@/data/v8/scoring.json';
import scoringV9 from '@/data/v9/scoring.json';
import scoringV10 from '@/data/v10/scoring.json';
import scoringV11 from '@/data/v11/scoring.json';
import scoringV12 from '@/data/v12/scoring.json';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { answers, version = 'v12' } = body;

        if (!answers) {
            return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
        }

        const scoringConfigs: Record<string, any> = {
            v1: scoringV1,
            v3: scoringV3,
            v4: scoringV4,
            v6: scoringV6,
            v7: scoringV7,
            v8: scoringV8,
            v9: scoringV9,
            v10: scoringV10,
            v11: scoringV11,
            v12: scoringV12,
        };

        const scoringConfig = scoringConfigs[version] || scoringV12;
        const result = calculateScore(answers, scoringConfig as any);

        // Save anonymized submission with version tag
        let recordId: string | null = null;
        try {
            recordId = await saveSubmission({ ...result, version });
        } catch (saveError: any) {
            // Surface Airtable config errors clearly — do NOT block the user from seeing results
            console.error('saveSubmission failed:', saveError?.message);
            const aggregates = await getAggregates().catch(() => null);
            return NextResponse.json({
                success: false,
                saveError: saveError?.message || 'Unknown save error',
                result,
                aggregates
            }, { status: 200 }); // still 200 so the UI shows results
        }

        // Fetch current aggregates for benchmarking
        const aggregates = await getAggregates().catch(() => null);

        // Send results email if user provided their email (not skipped)
        const email = answers.QX2 || answers.Q0_EMAIL;
        if (email && email !== '__skip__' && email.includes('@') && recordId) {
            console.log(`[Email] Attempting to send result to: ${email} for record: ${recordId}`);
            // Fire-and-forget — don't block response on email
            sendResultsEmail(email, result, recordId)
                .then(() => console.log(`[Email] sendResultsEmail triggered successfully for ${email}`))
                .catch((err) => {
                    console.error('[Email] sendResultsEmail error (non-blocking):', err);
                });
        } else {
            console.log('[Email] conditions not met, skipping (email:', email, 'recordId:', recordId, ')');
        }

        return NextResponse.json({ success: true, result, aggregates, recordId });
    } catch (error) {
        console.error('Submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
