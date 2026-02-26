import { calculateScore } from '../src/lib/scoring-engine';
import scoringV10 from '../src/data/v10/scoring.json';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Submissions';
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1&sort[0][field]=Timestamp&sort[0][direction]=desc`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    const d: any = await res.json();
    const rec = d.records[0];
    const f = rec.fields;

    console.log('ID:', rec.id);
    console.log('Email:', f.Email);
    console.log('Score (stored):', f.Score);
    console.log('Level (stored):', f.Level);
    console.log('Version:', f.Version);

    let answers: Record<string, any> = {};
    try {
        answers = JSON.parse(f['Answers (JSON)'] || '{}');
    } catch (e) { }

    console.log('\n--- FULL ANSWERS JSON ---');
    console.log(JSON.stringify(answers, null, 2));

    // Recalculate using the scoring engine
    const result = calculateScore(answers, scoringV10 as any);
    console.log('\n--- RECALCULATED RESULT ---');
    console.log('Total %:', result.totalPercent);
    console.log('Level:', result.level);
    console.log('Area Scores:', JSON.stringify(result.areaScores, null, 2));
    console.log('Secondary Metrics:', JSON.stringify(result.secondaryMetrics, null, 2));
}

main();
