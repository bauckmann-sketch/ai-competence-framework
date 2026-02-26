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

    console.log('Sending email...');
    await sendResultsEmail(email, result, recordId);
    console.log('Done.');
}

sendLatest();
