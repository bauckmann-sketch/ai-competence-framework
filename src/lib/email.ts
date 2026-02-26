import { CalculationResult, AggregateStats } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-competence-framework-wfrx.vercel.app';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AI Competence Framework <onboarding@resend.dev>';

function areaRow(area: string, label: string, score: number): string {
  const percent = Math.round((score / 20) * 100);
  return `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; font-weight: 600;">
        <span>${area} ${label}</span>
        <span style="color: #DD3C20;">${score}/20</span>
      </div>
      <div style="background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden; width: 100%;">
        <div style="background: #DD3C20; height: 100%; border-radius: 4px; width: ${percent}%;"></div>
      </div>
    </div>`;
}

export async function sendResultsEmail(
  to: string,
  result: CalculationResult,
  airtableRecordId: string,
  _aggregates: AggregateStats | null = null // Kept for signature compatibility but unused
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return;
  }

  if (!to || to === '__skip__' || !to.includes('@')) return;

  const actualTo = process.env.RESEND_TO_OVERRIDE || to;
  const resultUrl = `${APP_URL}/r/${airtableRecordId}`;

  // Data for template
  const adoptionIndex = result.secondaryMetrics?.adoption_investment_index?.value ?? '-';
  const adoptionBand = result.secondaryMetrics?.adoption_investment_index?.label ?? 'Nezadáno';
  const reliabilityBadge = result.secondaryMetrics?.reliability_badge ?? 'Nezadáno';

  const areaLabels: Record<string, string> = {
    A: 'Základy', B: 'Promptování', C: 'Ověřování',
    D: 'Workflow', E: 'Systémy', F: 'Tvorba'
  };

  const profileHtml = ['A', 'B', 'C', 'D', 'E', 'F'].map(area => {
    const score = result.areaScores[area]?.raw ?? 0;
    return areaRow(area, areaLabels[area], score);
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { margin-bottom: 30px; text-align: left; }
    .brand { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #DD3C20; font-weight: 800; margin-bottom: 8px; }
    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; }
    .intro { color: #64748b; font-size: 15px; }
    .section { margin-bottom: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
    .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 20px; }
    .hero-card { background: #fff7f5; border: 2px solid #fecaca; border-radius: 12px; padding: 24px; display: flex; align-items: center; margin-bottom: 20px; }
    .score-value { font-size: 48px; font-weight: 900; color: #DD3C20; line-height: 1; margin-right: 20px; }
    .score-level { font-size: 20px; font-weight: 800; color: #0f172a; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .metric-item { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .metric-label { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
    .metric-value { font-size: 14px; font-weight: 700; color: #1e293b; }
    .btn { display: inline-block; background: #DD3C20; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 15px; margin-top: 10px; text-align: center; }
    .footer { font-size: 12px; margin-top: 40px; color: #94a3b8; line-height: 1.8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">AI Competence Framework</div>
      <h1 class="title">Vaše výsledky diagnostiky</h1>
      <p class="intro">Dobrý den / Ahoj,<br>děkujeme za vyplnění diagnostiky. Tady je rychlý přehled vašich výsledků, které vám pomohou lépe využívat AI v každodenní praxi.</p>
    </div>

    <div class="hero-card">
      <div class="score-value">${result.totalPercent}%</div>
      <div>
        <div style="font-size: 12px; color: #DD3C20; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Vaše úroveň</div>
        <div class="score-level">${result.level}</div>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-item">
        <div class="metric-label">Adopce & Investice</div>
        <div class="metric-value">${adoptionIndex}/10 (${adoptionBand})</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Spolehlivost faktů</div>
        <div class="metric-value">${reliabilityBadge}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Profil kompetencí A–F</div>
      <div style="margin-top: 10px;">
        ${profileHtml}
      </div>
    </div>

    <div class="section" style="border-top: none; text-align: center;">
      <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Kompletní report s doporučeními a srovnáním s komunitou najdete online na unikátní adrese:</p>
      <a href="${resultUrl}" class="btn">Zobrazit plný report →</a>
      <p style="font-size: 11px; color: #cbd5e1; margin-top: 16px;">Odkaz na report: ${resultUrl}</p>
    </div>

    <div class="footer">
      Berte prosím tento výsledek jako orientační diagnostiku, nikoliv audit. Cílem je identifikovat oblasti, které vám přinesou největší posun.<br><br>
      Ať vám AI šetří čas i nervy 🙂<br>
      <strong>Tým Inovatix</strong>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: actualTo,
        subject: `Vaše výsledky AI diagnostiky: ${result.totalPercent}% • ${result.level}`,
        html,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Resend email error:', err);
    } else {
      console.log(`Email sent to ${actualTo} for level ${result.level}`);
    }
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}
