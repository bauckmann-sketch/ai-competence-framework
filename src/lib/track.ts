/**
 * Client-side event tracking utility.
 * Sends events to /api/track (fire-and-forget, never blocks UI).
 *
 * Usage: track('webinar_click', { level: 'Builder', score: 77 })
 */
export function track(event: string, properties?: Record<string, unknown>): void {
    try {
        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, properties, ts: new Date().toISOString() }),
        }).catch(() => { /* fire-and-forget — never surface errors to user */ });
    } catch {
        // noop
    }
}
