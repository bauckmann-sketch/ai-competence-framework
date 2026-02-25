import { NextResponse } from 'next/server';

// Lead capture endpoint — saves lead + result snapshot, sends email to bauckmann@inovatix.cz
// Body: { lead_type, email, ...contact, ...formData, ...resultSnapshot }
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, consent_marketing, lead_type } = body;

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Vyžadujeme platný email' }, { status: 400 });
        }
        if (!consent_marketing) {
            return NextResponse.json({ error: 'Souhlas s kontaktováním je povinný' }, { status: 400 });
        }

        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) {
            console.warn('RESEND_API_KEY not set — lead captured but email not sent');
            return NextResponse.json({ success: true });
        }

        const isImpl = lead_type === 'implementation';
        const subject = isImpl
            ? `[LEAD – Implementace] ${email}${body.company ? ` · ${body.company}` : ''}`
            : `[LEAD – Školení 1:1] ${email}`;

        const html = buildLeadEmail(body);

        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || 'AI Competence Framework <onboarding@resend.dev>',
                to: process.env.RESEND_TO_OVERRIDE || 'bauckmann@inovatix.cz',
                subject,
                html,
            }),
        });

        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            console.error('Resend lead email error:', err);
        } else {
            console.log(`Lead email sent for ${lead_type}: ${email}`);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Lead API error:', err);
        return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 });
    }
}

function row(label: string, value: string | undefined | null, highlight = false): string {
    if (!value) return '';
    return `<tr>
        <td style="padding:8px 12px;font-size:12px;font-weight:700;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;white-space:nowrap;">${label}</td>
        <td style="padding:8px 12px;font-size:13px;color:${highlight ? '#DD3C20' : '#0f172a'};font-weight:${highlight ? '900' : '500'};background:#fff;border:1px solid #e2e8f0;">${value}</td>
    </tr>`;
}

function section(title: string, content: string): string {
    return `
    <tr><td colspan="2" style="padding:20px 0 8px;"><p style="margin:0;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;">${title}</p></td></tr>
    ${content}`;
}

function buildLeadEmail(body: any): string {
    const {
        lead_type, email, phone, company, role, notes,
        consent_marketing, consent_newsletter,
        // Implementation
        people_count, program_depth, speed, format: fmt, priority_areas, price_range,
        // Training
        improve_areas, preferred_format,
        // Result snapshot
        skill_score_total, level, area_scores, usage_frequency,
        paid_tools_count, tool_categories, barrier, instrument_version,
        answers_raw,
    } = body;

    const isImpl = lead_type === 'implementation';
    const typeLabel = isImpl ? '🏢 Firemní implementace' : '👤 Individuální školení 1:1';
    const now = new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' });

    const areaRows = area_scores
        ? Object.entries(area_scores as Record<string, any>).map(([area, data]: any) =>
            `<td style="text-align:center;padding:6px 12px;font-size:14px;font-weight:900;color:#DD3C20;">${area}<br><span style="font-size:11px;color:#64748b;font-weight:500;">${data.percent ?? Math.round((data.raw / data.max) * 100)}%</span></td>`
        ).join('')
        : '';

    const implRows = isImpl ? `
        ${row('Počet lidí', people_count)}
        ${row('Hloubka programu', program_depth)}
        ${row('Rychlost / délka', speed)}
        ${row('Formát', fmt)}
        ${row('Prioritní oblasti', Array.isArray(priority_areas) ? priority_areas.join(', ') : priority_areas)}
        ${row('Orientační cena', price_range, true)}
    ` : `
        ${row('Co chce zlepšit', Array.isArray(improve_areas) ? improve_areas.join(', ') : improve_areas)}
        ${row('Preferovaný formát', preferred_format)}
    `;

    return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><title>Nový lead – AI Competence Framework</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 20px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:#DD3C20;padding:24px 32px;">
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;">AI Competence Framework · Inovatix</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:900;">Nový lead: ${typeLabel}</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">${now}</p>
    </td>
  </tr>

  <tr><td style="padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0">

      ${section('Kontakt', `
        ${row('Email', email, true)}
        ${row('Telefon', phone)}
        ${row('Firma', company)}
        ${row('Role / pozice', role)}
        ${row('Poznámka', notes)}
        ${row('Souhlas kontaktování', consent_marketing ? 'ANO ✓' : 'NE')}
        ${row('Souhlas novinky', consent_newsletter ? 'ANO ✓' : 'NE')}
      `)}

      ${section('Zájem: ' + (isImpl ? 'Firemní implementace' : 'Školení 1:1'), implRows)}

      ${section('Snapshot výsledku dotazníku', `
        ${row('Celkové skóre', skill_score_total != null ? `${skill_score_total}%` : undefined, true)}
        ${row('Úroveň', level, true)}
        ${row('Verze dotazníku', instrument_version)}
        ${row('Frekvence AI', usage_frequency)}
        ${row('Placené nástroje', paid_tools_count)}
        ${row('Kategorie nástrojů', Array.isArray(tool_categories) ? tool_categories.join(', ') : tool_categories)}
        ${row('Hlavní bariéra', barrier)}
      `)}

    </table>

    ${areaRows ? `
    <p style="margin:20px 0 8px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;">Oblasti A–F</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <tr>${areaRows}</tr>
    </table>` : ''}

  </td></tr>

  <tr>
    <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">Automaticky odesláno ze systému AI Competence Framework · Inovatix</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
