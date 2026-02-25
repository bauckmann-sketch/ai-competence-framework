import fs from 'fs/promises';
import path from 'path';

export interface AggregateStats {
    count: number;
    avgTotalScore: number;
    avgAreaScores: Record<string, number>;
    levelDistribution: Record<string, number>;
    questionDistributions: Record<string, Record<string, number>>; // Tracking counts for specific profiling questions
}

const CACHE_TTL = 60 * 1000; // 1 minute cache
let cachedAggregates: { data: any, timestamp: number } | null = null;

export async function saveSubmission(submission: any) {
    // Save to Airtable (Remote storage - Source of truth)
    await saveToAirtable(submission);

    // Invalidate cache after new submission
    cachedAggregates = null;
}

async function saveToAirtable(submission: any) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Submissions';

    if (!apiKey || !baseId) {
        const msg = 'Airtable: Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID environment variables in Vercel. Go to Project Settings → Environment Variables to add them.';
        console.error(msg);
        throw new Error(msg);
    }

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
    console.log(`Saving to Airtable: ${url} (Version: ${submission.version})`);

    const fields: Record<string, any> = {
        "ID": submission.answers?.id || `v7_${Date.now()}`,
        "Timestamp": new Date().toISOString(),
        "Email": submission.answers?.QX2 || submission.answers?.Q0_EMAIL || "Nezadáno",
        "Group": submission.answers?.Q0_GROUP || "Nezadáno",
        "Level": submission.level,
        "Score": Math.round(submission.totalPercent ?? 0),
        "Version": submission.version || "v7",
        // Embed _areaScores inside Answers JSON (reuses existing field, no schema change needed)
        "Answers (JSON)": JSON.stringify({
            ...(submission.answers || {}),
            _areaScores: submission.areaScores || {}
        }),
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        const msg = `Airtable Save Error ${response.status}: ${JSON.stringify(error)}`;
        console.error(msg);
        throw new Error(msg);
    }
    console.log('Airtable save OK');
}

export async function getAggregates(): Promise<AggregateStats> {
    const now = Date.now();
    if (cachedAggregates && (now - cachedAggregates.timestamp < CACHE_TTL)) {
        return cachedAggregates.data;
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Submissions';

    if (!apiKey || !baseId) {
        return { count: 0, avgTotalScore: 0, avgAreaScores: {}, levelDistribution: {}, questionDistributions: {} };
    }

    try {
        // Fetch all records from Airtable (max 1000 for efficiency)
        const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1000&sort%5B0%5D%5Bfield%5D=Timestamp&sort%5B0%5D%5Bdirection%5D=desc`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) throw new Error('Failed to fetch from Airtable');

        const data = await response.json();
        const records = data.records || [];

        const stats: AggregateStats = {
            count: records.length,
            avgTotalScore: 0,
            avgAreaScores: {},
            levelDistribution: {},
            questionDistributions: {}
        };

        if (stats.count === 0) return stats;

        let totalScoreSum = 0;
        // Track all multi-select (TOP3) and key single-choice questions
        const profilingIds = ['Q0_1', 'Q0_2', 'Q1_2', 'Q1_3', 'Q1_5', 'QB2', 'QF2'];

        records.forEach((record: any) => {
            const fields = record.fields;
            let answers = {};
            try {
                answers = JSON.parse(fields["Answers (JSON)"] || '{}');
            } catch (e) {
                console.warn('Failed to parse Answers (JSON) for record', record.id);
            }

            // Score and Level
            totalScoreSum += fields["Score"] || 0;
            const level = fields["Level"];
            if (level) stats.levelDistribution[level] = (stats.levelDistribution[level] || 0) + 1;

            // Market Context distributions
            profilingIds.forEach(qId => {
                const answer = (answers as any)[qId];
                if (answer === undefined) return;

                if (!stats.questionDistributions[qId]) stats.questionDistributions[qId] = {};

                if (Array.isArray(answer)) {
                    answer.forEach(val => {
                        stats.questionDistributions[qId][val] = (stats.questionDistributions[qId][val] || 0) + 1;
                    });
                } else {
                    stats.questionDistributions[qId][answer] = (stats.questionDistributions[qId][answer] || 0) + 1;
                }
            });
        });

        stats.avgTotalScore = Math.round(totalScoreSum / stats.count);

        // Compute avgAreaScores from _areaScores embedded in Answers JSON
        const areaScoreSums: Record<string, { sum: number; n: number }> = {};
        records.forEach((record: any) => {
            const fields = record.fields;
            let answers: any = {};
            try { answers = JSON.parse(fields["Answers (JSON)"] || '{}'); } catch { /**/ }

            // _areaScores is embedded as { A: { raw, max, percent }, ... }
            const areaScores = answers._areaScores;
            if (areaScores && typeof areaScores === 'object') {
                Object.entries(areaScores).forEach(([area, data]: [string, any]) => {
                    const pct = typeof data?.percent === 'number' ? data.percent
                        : typeof data === 'number' ? data : null;
                    if (pct !== null) {
                        if (!areaScoreSums[area]) areaScoreSums[area] = { sum: 0, n: 0 };
                        areaScoreSums[area].sum += pct;
                        areaScoreSums[area].n += 1;
                    }
                });
            }
        });
        Object.entries(areaScoreSums).forEach(([area, { sum, n }]) => {
            stats.avgAreaScores[area] = n > 0 ? Math.round(sum / n) : 0;
        });

        // Cache the result
        cachedAggregates = { data: stats, timestamp: now };
        return stats;
    } catch (err) {
        console.error('Failed to get aggregates from Airtable:', err);
        return { count: 0, avgTotalScore: 0, avgAreaScores: {}, levelDistribution: {}, questionDistributions: {} };
    }
}
