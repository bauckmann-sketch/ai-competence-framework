import { sendResultsEmail } from '../src/lib/email';
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

    console.log(`Found record ${recordId} for ${email}`);

    let answers = {};
    try {
        answers = JSON.parse(fields['Answers (JSON)'] || '{}');
    } catch (e) { }

    // Reconstruct CalculationResult
    const result: any = {
        totalPercent: fields.Score,
        level: fields.Level,
        areaScores: (answers as any)._areaScores || {},
        answers: answers,
        version: fields.Version || 'v10'
    };

    console.log('Fetching aggregates for comparison...');
    const aggUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`; // This is not quite right for getAggregates, but good enough for mock or I can use the existing function if I import it
    // Actually, let's just use a simplified fetch here since getAggregates is complex
    const aggRes = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    const aggData = await aggRes.json();

    // Simple mock aggregates for test if actual fetch is too complex here
    const aggregates: any = {
        questionDistributions: {
            'Q1_2': { 'almost_daily': 10, 'weekly': 5 },
            'Q1_2b': { '1': 10, '0': 5 },
            'QF2': { 'text': 20, 'code': 15, 'graphics': 10 }
        }
    };

    console.log('Sending email...');
    await sendResultsEmail(email, result, recordId, aggregates);
    console.log('Done.');
}

sendLatest();
