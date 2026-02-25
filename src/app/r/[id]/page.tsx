import { notFound } from 'next/navigation';
import { SharedResultsView } from './shared-results-view';
import { calculateScore } from '@/lib/scoring-engine';
import scoringV8 from '@/data/v8/scoring.json';
import scoringV7 from '@/data/v7/scoring.json';
import scoringV6 from '@/data/v6/scoring.json';
import scoringV4 from '@/data/v4/scoring.json';
import scoringV3 from '@/data/v3/scoring.json';
import scoringV1 from '@/data/v1/scoring.json';
import { getAggregates } from '@/lib/persistence';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function fetchAirtableRecord(recordId: string) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Submissions';

    if (!apiKey || !baseId) return null;

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 3600 }, // cache for 1h
    });

    if (!res.ok) return null;
    return res.json();
}

export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const record = await fetchAirtableRecord(id);
    if (!record) return { title: 'Report nenalezen' };
    const level = record.fields?.Level || '';
    const score = record.fields?.Score || '';
    return {
        title: `AI Competence Report — ${level} (${score}%)`,
        description: `Výsledky AI Competence Framework od Inovatix. Úroveň: ${level}.`,
    };
}

export default async function SharedResultPage({ params }: PageProps) {
    const { id } = await params;
    const record = await fetchAirtableRecord(id);

    if (!record) {
        notFound();
    }

    const fields = record.fields;
    let answers: Record<string, any> = {};
    try {
        answers = JSON.parse(fields['Answers (JSON)'] || '{}');
    } catch {
        // ignore parse error
    }

    const version: string = fields.Version || 'v8';
    const scoringConfigs: Record<string, any> = {
        v1: scoringV1,
        v3: scoringV3,
        v4: scoringV4,
        v6: scoringV6,
        v7: scoringV7,
        v8: scoringV8,
    };
    const scoringConfig = scoringConfigs[version] || scoringV8;

    // Recalculate result from stored answers (source of truth)
    const result = calculateScore(answers, scoringConfig as any);
    // Attach version so ResultsDashboard picks the right copy/benchmark
    (result as any).version = version;

    // Get community aggregates for comparison
    const aggregates = await getAggregates().catch(() => null);

    return (
        <main className="min-h-screen">
            {/* Shared report banner */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-center py-2 px-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
                    Sdílený report · AI Competence Framework by Inovatix
                </p>
            </div>

            <SharedResultsView result={result} aggregates={aggregates} />
        </main>
    );
}
