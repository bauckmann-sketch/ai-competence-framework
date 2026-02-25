import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUBMISSIONS_FILE = path.join(process.cwd(), 'data', 'submissions.jsonl');

async function sync() {
    console.log('Starting sync to Airtable...');

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Submissions';

    if (!apiKey || !baseId) {
        console.error('Missing Airtable credentials in .env.local');
        return;
    }

    if (!fs.existsSync(SUBMISSIONS_FILE)) {
        console.error('No submissions file found.');
        return;
    }

    const lines = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8').split('\n').filter(Boolean);
    console.log(`Found ${lines.length} total local submissions.`);

    for (const line of lines) {
        const submission = JSON.parse(line);
        console.log(`Syncing submission from ${submission.timestamp}...`);

        try {
            const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
            const fields = {
                "ID": submission.answers.id || `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                "Timestamp": submission.timestamp,
                "Email": submission.answers.QX2 || submission.answers.Q0_EMAIL || "Nezadáno",
                "Group": submission.answers.Q0_GROUP || "Nezadáno",
                "Level": submission.level,
                "Score": Math.round(submission.totalPercent),
                "Version": submission.version || "v1",
                "Answers (JSON)": JSON.stringify(submission.answers)
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields })
            });

            if (response.ok) {
                console.log(`Successfully synced ${submission.timestamp}`);
            } else {
                const error = await response.json();
                console.error(`Failed to sync ${submission.timestamp}:`, JSON.stringify(error));
            }
        } catch (err) {
            console.error(`Error syncing ${submission.timestamp}:`, err);
        }
    }
}

sync();
