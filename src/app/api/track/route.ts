import { NextResponse } from 'next/server';

/**
 * Event tracking endpoint — saves events to the existing Airtable Submissions table.
 * Uses EVT_ prefix in ID field to distinguish event rows from quiz submissions.
 * Body: { event: string, properties?: Record<string, unknown>, ts?: string }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { event, properties, ts } = body;

        if (!event || typeof event !== 'string') {
            return NextResponse.json({ error: 'event is required' }, { status: 400 });
        }

        // Always log to console (visible in Vercel function logs)
        console.log(`[TRACK] ${event}`, JSON.stringify(properties ?? {}));

        const apiKey = process.env.AIRTABLE_API_KEY;
        const baseId = process.env.AIRTABLE_BASE_ID;
        const tableName = process.env.AIRTABLE_TABLE_NAME || 'Submissions';

        if (apiKey && baseId) {
            const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

            // Reuse existing Submissions table columns — EVT_ prefix makes events easy to filter
            const fields: Record<string, any> = {
                'ID': `EVT_${event}_${Date.now()}`,
                'Timestamp': ts || new Date().toISOString(),
                'Level': String(properties?.level ?? ''),
                'Score': typeof properties?.score === 'number' ? properties.score : null,
                'Version': event,  // repurpose Version field as event name
                'Group': 'event_track',
                'Email': '',
                'Answers (JSON)': JSON.stringify({ event, ...properties }),
            };

            const r = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fields }),
            });

            if (!r.ok) {
                const err = await r.json().catch(() => ({}));
                console.warn('[TRACK] Airtable save failed:', JSON.stringify(err));
            } else {
                console.log(`[TRACK] Saved to Airtable: ${event}`);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[TRACK] Error:', err);
        return NextResponse.json({ ok: true }); // always 200 — never block user
    }
}
