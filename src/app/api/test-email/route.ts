import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Temporary test endpoint — send last Airtable record results email to any address
// Usage: POST /api/test-email  { "to": "email@example.com", "secret": "inovatix-test-2026" }
// DELETE THIS ENDPOINT AFTER TESTING

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-competence-framework-wfrx.vercel.app';

export async function POST(request: Request) {
    const { to, secret } = await request.json();

    if (secret !== 'inovatix-test-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Submissions';
    const resendKey = process.env.RESEND_API_KEY;

    if (!apiKey || !baseId) {
        return NextResponse.json({ error: 'Airtable not configured', has_airtable: !!apiKey }, { status: 500 });
    }
    if (!resendKey) {
        return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
    }

    // Fetch the most recent record from Airtable
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1&sort[0][field]=Timestamp&sort[0][direction]=desc`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!r.ok) {
        return NextResponse.json({ error: 'Airtable fetch failed', status: r.status }, { status: 500 });
    }

    const data = await r.json();
    const record = data.records?.[0];
    if (!record) {
        return NextResponse.json({ error: 'No records found' }, { status: 404 });
    }

    const fields = record.fields;
    const recordId = record.id;
    const level = fields.Level || 'N/A';
    const totalScore = fields['Total Score'] || 0;
    const version = fields.Version || 'v8';
    const timestamp = fields.Timestamp;
    const resultUrl = `${APP_URL}/r/${recordId}`;

    // Build simple email HTML without importing the full scoring engine
    const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>AI Competence Report – Test</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:#DD3C20;padding:32px 40px;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;">Metodika Inovatix</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:26px;font-weight:900;">AI Competence Framework</h1>
          </td>
        </tr>

        <!-- Test notice -->
        <tr>
          <td style="background:#fef3c7;border-bottom:1px solid #fcd34d;padding:12px 40px;">
            <p style="margin:0;font-size:12px;font-weight:700;color:#92400e;">
              📧 TESTOVACÍ EMAIL — záznam z ${timestamp || 'poslední submise'}<br>
              Verze dotazníku: ${version} | Airtable ID: ${recordId}
            </p>
          </td>
        </tr>

        <!-- Score -->
        <tr>
          <td style="padding:40px 40px 24px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#94a3b8;">Výsledek posledního záznamu</p>
            <div style="display:inline-block;background:#fff7f5;border:2px solid #fecaca;border-radius:12px;padding:20px 28px;text-align:center;">
              <div style="font-size:48px;font-weight:900;color:#DD3C20;line-height:1;">${totalScore}%</div>
              <div style="font-size:13px;font-weight:700;color:#64748b;margin-top:4px;">celkové skóre</div>
            </div>
            <div style="display:inline-block;padding-left:20px;vertical-align:middle;">
              <div style="font-size:22px;font-weight:900;color:#0f172a;">${level}</div>
            </div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 40px;">
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
              Váš kompletní report s doporučeními, srovnáním s komunitou a detailní analýzou je dostupný online.
            </p>
            <a href="${resultUrl}" style="display:inline-block;background:#DD3C20;color:#fff;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:15px;font-weight:900;">
              Zobrazit plný report →
            </a>
            <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
              Přímý odkaz: <a href="${resultUrl}" style="color:#DD3C20;">${resultUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Tento email byl odeslán ze systému AI Competence Framework — Inovatix.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const resend = new Resend(resendKey);
    const toOverride = process.env.RESEND_TO_OVERRIDE;
    const actualTo = toOverride || to;

    const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'AI Competence Framework <onboarding@resend.dev>',
        to: actualTo,
        subject: `[TEST] AI Report — ${level} (${totalScore}%) | ${version}`,
        html,
    });

    if (error) {
        return NextResponse.json({ error: 'Resend error', details: error }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        sentTo: actualTo,
        intendedFor: to,
        overrideActive: !!toOverride,
        recordId,
        level,
        score: totalScore,
        version,
        resultUrl,
    });
}
