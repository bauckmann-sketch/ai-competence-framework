import { NextResponse } from 'next/server';
import { sendResultsEmail } from '@/lib/email';
import { getAggregates } from '@/lib/persistence';
import { calculateScore } from '@/lib/scoring-engine';
import scoringV8 from '@/data/v8/scoring.json';

const SECRET = 'inovatix-test-2026';

export async function POST(request: Request) {
    try {
        const { to, secret } = await request.json();

        if (secret !== SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!to || !to.includes('@')) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        // Build a fake result for testing
        const fakeAnswers: Record<string, string> = {
            Q0: 'individual', Q1: '2', Q2: '2', Q3: '2',
            QA1: '2', QA2: '2', QA3: '2',
            QB1: '2', QB2: '2', QB3: '2',
            QC1: '2', QC2: '2', QC3: '2',
            QD1: '2', QD2: '2', QD3: '2',
            QE1: '2', QE2: '2', QE3: '2',
            QF1: '2', QF2: '2', QF3: '2',
        };

        const result = calculateScore(fakeAnswers, scoringV8 as any);
        const fakeRecordId = 'test-record-id-000';

        await sendResultsEmail(to, result, fakeRecordId);

        return NextResponse.json({ success: true, message: `Test email sent to ${to}` });
    } catch (error: any) {
        console.error('Test email error:', error);
        return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
    }
}
