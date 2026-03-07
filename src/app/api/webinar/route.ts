import { NextResponse } from 'next/server';

/**
 * GET /api/webinar
 * Returns the nearest upcoming free training from Airtable "Termíny školení" table
 * in the "Produkty Inovatix" base.
 *
 * Cached for 1 hour (revalidated on-demand).
 */
export const revalidate = 3600; // 1 hour ISR cache

export async function GET() {
    try {
        const apiKey = process.env.AIRTABLE_API_KEY;
        const baseId = process.env.AIRTABLE_PRODUKTY_BASE_ID || 'appbzMMDlGJLu4VUa';
        const tableId = 'tblj6T7Xv6usBqOjk'; // Termíny školení

        if (!apiKey) {
            return NextResponse.json({ error: 'Airtable not configured' }, { status: 500 });
        }

        const url = `https://api.airtable.com/v0/${baseId}/${tableId}?pageSize=100`;
        const r = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            next: { revalidate: 3600 },
        });

        if (!r.ok) {
            return NextResponse.json({ error: 'Airtable fetch failed' }, { status: 500 });
        }

        const data = await r.json();
        const records = data.records ?? [];
        const now = new Date();

        const freeUpcoming: { name: string; date: string; registrationUrl: string }[] = [];

        for (const rec of records) {
            const f = rec.fields ?? {};
            const price = f['Price'];
            const termín = f['Termín CE(S)T'] ?? '';

            // Free = price is 0, null, undefined, empty, or list [0]
            const isFree =
                price === null ||
                price === undefined ||
                price === 0 ||
                price === 0.0 ||
                (Array.isArray(price) && (price.length === 0 || price[0] === 0)) ||
                String(price).trim() === '' ||
                String(price).trim() === '0';

            if (!isFree || !termín) continue;

            try {
                const dt = new Date(termín);
                if (isNaN(dt.getTime()) || dt <= now) continue;

                // Clean up name — remove "Clone of" prefix
                let name: string = f['Název'] ?? '';
                if (Array.isArray(name)) name = name[0] ?? '';
                name = name.replace(/^Clone of\s+/i, '').replace(/^\d+\.\s*\d+\.\s*\d+\s*[-–]+\s*/, '').trim();

                // Registration URL — use inovatix.cz webinars page as fallback
                const regUrl = 'https://www.inovatix.cz/bezplatne-seminare-a-kurzy';

                freeUpcoming.push({ name, date: dt.toISOString(), registrationUrl: regUrl });
            } catch {
                // skip unparseable dates
            }
        }

        if (freeUpcoming.length === 0) {
            return NextResponse.json({ webinar: null });
        }

        // Sort by date ascending, return nearest
        freeUpcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const webinar = freeUpcoming[0];

        return NextResponse.json({ webinar });
    } catch (err) {
        console.error('[/api/webinar]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
