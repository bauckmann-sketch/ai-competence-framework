import { NextResponse } from 'next/server';
import { sendResultsEmail } from '@/lib/email';
import { calculateScore } from '@/lib/scoring-engine';
import scoringV8 from '@/data/v8/scoring.json';
import scoringV7 from '@/data/v7/scoring.json';
import scoringV6 from '@/data/v6/scoring.json';
import scoringV4 from '@/data/v4/scoring.json';
import scoringV3 from '@/data/v3/scoring.json';
import scoringV1 from '@/data/v1/scoring.json';

// Temporary test endpoint — send last Airtable record results to any email
// Usage: POST /api/test-email  { "to": "email@example.com", "secret": "inovatix-test-2026" }
// DELETE THIS ENDPOINT AFTER TESTING

export async function POST(request: Request) {
    const { to, secret } = await request.json();

    if (secret !== 'inovatix-test-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Submissions';

    if (!apiKey || !baseId) {
        return NextResponse.json({ error: 'Airtable not configured' }, { status: 500 });
    }

    // Fetch the most recent record
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1&sort[0][field]=Timestamp&sort[0][direction]=desc`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!r.ok) {
        return NextResponse.json({ error: 'Airtable fetch failed', status: r.status }, { status: 500 });
    }

    const data = await r.json();
    const record = data.records?.[0];
    if (!record) {
        return NextResponse.json({ error: 'No records found' }, { status: 404 });
    }

    const fields = record.fields;
    let answers: Record<string, any> = {};
    try {
        answers = JSON.parse(fields['Answers (JSON)'] || '{}');
    } catch { /* ignore */ }

    const version: string = fields.Version || 'v8';
    const scoringConfigs: Record<string, any> = {
        v1: scoringV1, v3: scoringV3, v4: scoringV4,
        v6: scoringV6, v7: scoringV7, v8: scoringV8,
    };
    const result = calculateScore(answers, scoringConfigs[version] || scoringV8 as any);

    // Send email using the record's Airtable ID as the share link ID
    await sendResultsEmail(to, result, record.id);

    return NextResponse.json({
        success: true,
        sentTo: to,
        recordId: record.id,
        level: result.level,
        score: result.totalPercent,
        version,
        timestamp: fields.Timestamp,
    });
}
