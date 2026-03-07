import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/email';
import copyData from '@/data/v10/copy.json';

// Lead capture endpoint — saves lead + result snapshot, sends email to bauckmann@inovatix.cz
// Body: { lead_type, email, ...contact, ...formData, ...resultSnapshot }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, consent_marketing, lead_type } = body;

    if (!email || !isValidEmail(email)) {
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
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'AI Competence Framework <onboarding@resend.dev>';

    // 1. Internal notification to Inovatix
    const internalSubject = isImpl
      ? `[LEAD – Implementace] ${email}${body.company ? ` · ${body.company}` : ''}`
      : `[LEAD – Vzdělání pro jednotlivce] ${email}`;

    const internalHtml = buildLeadEmail(body);

    const r1 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail,
        to: process.env.RESEND_TO_OVERRIDE || 'bauckmann@inovatix.cz',
        subject: internalSubject,
        html: internalHtml,
      }),
    });
    if (!r1.ok) {
      const err = await r1.json().catch(() => ({}));
      console.error('Resend internal lead email error:', err);
    } else {
      console.log(`Internal lead email sent for ${lead_type}: ${email}`);
    }

    // 2. Confirmation email back to the user (texts from copy.json)
    const conf = (copyData as any).lead_confirmation_email ?? {};
    const confSubject = conf.subject ?? 'Děkujeme za váš zájem o Inovatix';
    const confBody = isImpl ? (conf.body_implementation ?? '') : (conf.body_training ?? '');
    const confirmationHtml = buildConfirmationEmail({ greeting: conf.greeting, body: confBody, footer: conf.footer, ps: conf.ps, isImpl });

    const actualTo = process.env.RESEND_TO_OVERRIDE || email;
    const r2 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to: actualTo, subject: confSubject, html: confirmationHtml }),
    });
    if (!r2.ok) {
      const err = await r2.json().catch(() => ({}));
      console.error('Resend confirmation email error:', err);
    } else {
      console.log(`Confirmation email sent to: ${email}`);
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
    consent_marketing,
    // Implementation
    people_count, program_depth, speed, format: fmt, priority_areas, price_range, estimated_price,
    // Training
    improve_areas, preferred_format,
    // Result snapshot
    skill_score_total, level, area_scores, usage_frequency,
    paid_tools_count, tool_categories, barrier, instrument_version,
  } = body;

  const isImpl = lead_type === 'implementation';
  const typeLabel = isImpl ? '🏢 Firemní implementace' : '👤 Vzdělání pro jednotlivce';
  const now = new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' });

  // Full label lookups
  const PEOPLE_LABELS: Record<string, string> = {
    '1-10': '1–10 lidí', '11-30': '11–30 lidí', '31-80': '31–80 lidí',
    '81-200': '81–200 lidí', '200+': '200+ lidí',
  };
  const DEPTH_LABELS: Record<string, string> = {
    start: '🟢 Start — AI základy + bezpečný provoz',
    practical: '🟡 Praktický výkon — workflow + šablony',
    advanced: '🔴 Pokročilá implementace — automatizace + governance',
  };
  const SPEED_LABELS: Record<string, string> = {
    '1': '1 den – rychlý start', '2': '2–3 dny – reálný posun',
    '8': '4–8 týdnů – implementace + změna procesů',
  };
  const FORMAT_LABELS: Record<string, string> = {
    Online: 'Online', Onsite: 'Na místě', Kombinace: 'Kombinace',
  };
  const TRAINING_DEPTH_LABELS: Record<string, string> = {
    start: '🟢 Chci začít — online kurz ~16h (cca 8 000 Kč)',
    intensive: '🟡 Naučit se rychle — 40h za 3 měsíce (cca 15 000 Kč)',
    select: '🔵 Vyberu si kurzy — 1 200 Kč / kurz (od 1 200 Kč)',
    coaching: '🔴 Individuální lekce a konzultace (na dotaz)',
  };

  const areaRows = area_scores
    ? Object.entries(area_scores as Record<string, any>).map(([area, data]: any) =>
      `<td style="text-align:center;padding:6px 12px;font-size:14px;font-weight:900;color:#DD3C20;">${area}<br><span style="font-size:11px;color:#64748b;font-weight:500;">${data.percent ?? Math.round((data.raw / data.max) * 100)}%</span></td>`
    ).join('')
    : '';

  const implRows = isImpl ? `
        ${row('Počet lidí', PEOPLE_LABELS[people_count] ?? people_count)}
        ${row('Hloubka programu', DEPTH_LABELS[program_depth] ?? program_depth)}
        ${row('Délka programu', SPEED_LABELS[speed] ?? speed)}
        ${row('Formát', FORMAT_LABELS[fmt] ?? fmt)}
        ${row('Orientační cena', estimated_price ?? price_range, true)}
    ` : `
        ${row('Telefon', phone)}
        ${row('Zájem o', TRAINING_DEPTH_LABELS[body.depth] ?? body.depth)}
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
    <p style="margin:20px 0 8px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;">Oblasti A–E</p>
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

function buildConfirmationEmail({ greeting, body, footer, ps, isImpl }: {
  greeting: string; body: string; footer: string; ps?: string; isImpl: boolean;
}): string {
  const topicLabel = isImpl ? 'firemní implementaci AI' : 'vzdělávání v oblasti AI';
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><title>Děkujeme za zájem o Inovatix</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:#DD3C20;padding:24px 32px;">
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;">AI Competence Framework · Inovatix</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:900;">Děkujeme za zájem o ${topicLabel}</h1>
    </td>
  </tr>

  <tr><td style="padding:32px;">
    <p style="margin:0 0 16px;font-size:15px;color:#0f172a;">${greeting}</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7;">${body}</p>

    <div style="background:#fff7f5;border:2px solid #fecaca;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0;font-size:13px;color:#DD3C20;font-weight:700;">⏱ Odpovíme do 24 hodin</p>
      <p style="margin:8px 0 0;font-size:12px;color:#64748b;">V pracovní dny obvykle reagujeme ještě týž den.</p>
    </div>

    ${ps ? `<p style="margin:0;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:20px;">${ps}</p>` : ''}
  </td></tr>

  <tr>
    <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#64748b;font-weight:600;">${footer}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Inovatix · AI školení a implementace · <a href="https://www.inovatix.cz" style="color:#DD3C20;">inovatix.cz</a></p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
