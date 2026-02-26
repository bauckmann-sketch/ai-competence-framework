import { sendResultsEmail } from '../src/lib/email';
import { calculateScore } from '../src/lib/scoring-engine';
import scoringV1 from '../src/data/v1/scoring.json';
import scoringV3 from '../src/data/v3/scoring.json';
import scoringV4 from '../src/data/v4/scoring.json';
import scoringV6 from '../src/data/v6/scoring.json';
import scoringV7 from '../src/data/v7/scoring.json';
import scoringV8 from '../src/data/v8/scoring.json';
import scoringV9 from '../src/data/v9/scoring.json';
import scoringV10 from '../src/data/v10/scoring.json';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function sendLatest() {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Submissions';

    if (!apiKey || !baseId) {
        console.error('Missing Airtable config');
        return;
    }

    console.log('Fetching latest record from Airtable...');
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1&sort[0][field]=Timestamp&sort[0][direction]=desc`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!res.ok) {
        console.error('Failed to fetch from Airtable');
        return;
    }

    const data = await res.json();
    if (!data.records || data.records.length === 0) {
        console.error('No records found');
        return;
    }

    const record = data.records[0];
    const fields = record.fields;
    const recordId = record.id;
    const email = fields.Email;

    let answers = {};
    try {
        answers = JSON.parse(fields['Answers (JSON)'] || '{}');
    } catch (e) { }

    const version: string = fields.Version || 'v10';
    const scoringConfigs: Record<string, any> = {
        v1: scoringV1, v3: scoringV3, v4: scoringV4, v6: scoringV6,
        v7: scoringV7, v8: scoringV8, v9: scoringV9, v10: scoringV10
    };
    const scoringConfig = scoringConfigs[version] || scoringV10;

    // Recalculate result from answers (source of truth)
    const result = calculateScore(answers, scoringConfig as any);
    (result as any).version = version;

    console.log(`Recalculated Score: ${result.totalPercent}%, Level: ${result.level}`);

    console.log('Sending email...');
    await sendResultsEmail(email, result, recordId);
    console.log('Done.');
}

sendLatest();
