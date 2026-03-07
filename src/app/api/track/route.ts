import { NextResponse } from 'next/server';

/**
 * Event tracking endpoint — logs events to Airtable "Events" table.
 * Body: { event: string, properties?: Record<string, unknown>, ts?: string }
 *
 * Tracked events:
 *   webinar_click           — user clicked "Zobrazit termíny" on results page
 *   training_lead_sent      — user submitted individual training inquiry
 *   implementation_lead_sent — user submitted company implementation inquiry
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

        // Save to Airtable "Events" table if configured
        const apiKey = process.env.AIRTABLE_API_KEY;
        const baseId = process.env.AIRTABLE_BASE_ID;
        const eventsTable = process.env.AIRTABLE_EVENTS_TABLE || 'Events';

        if (apiKey && baseId) {
            const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(eventsTable)}`;
            const fields: Record<string, any> = {
                'Event': event,
                'Timestamp': ts || new Date().toISOString(),
                'Properties': JSON.stringify(properties ?? {}),
                'Level': properties?.level ?? '',
                'Score': properties?.score ?? null,
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
                // Log but don't fail — tracking must never break the user flow
                const err = await r.json().catch(() => ({}));
                console.warn('[TRACK] Airtable save failed:', err);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        // Silently swallow errors — tracking must never break the user flow
        console.error('[TRACK] Error:', err);
        return NextResponse.json({ ok: true }); // still 200
    }
}
