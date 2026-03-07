import { CalculationResult } from '@/types';

/**
 * RFC 5322-based email validation.
 * Much stricter than a simple includes('@') check.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 simplified — covers 99.9 % of real addresses
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-competence-framework-wfrx.vercel.app';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AI Competence Framework <onboarding@resend.dev>';

function areaRow(area: string, label: string, score: number): string {
  const percent = Math.round((score / 20) * 100);
  return `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; font-weight: 600;">
        <span>${area} ${label}</span>
        <span style="color: #DD3C20; margin-left: 8px;">${score} / 20</span>
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
  aggregates?: { avgAreaScores?: Record<string, number>; avgTotalScore?: number; count?: number } | null
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return;
  }

  if (!to || to === '__skip__' || !isValidEmail(to)) return;

  const actualTo = process.env.RESEND_TO_OVERRIDE || to;
  const resultUrl = `${APP_URL}/r/${airtableRecordId}`;

  // Data for template — adoption/reliability removed from user email per design decision

  const areaLabels: Record<string, string> = {
    A: 'Základy', B: 'Promptování', C: 'Ověřování',
    D: 'Workflow', E: 'Systémy', F: 'Tvorba'
  };

  // Persona image mapping (absolute URL for email clients)
  const personaImages: Record<string, string> = {
    'Explorer': `${APP_URL}/images/personas/couch-potato.jpg`,
    'User': `${APP_URL}/images/personas/jogger.jpg`,
    'Power User': `${APP_URL}/images/personas/gym-rat.jpg`,
    'Builder': `${APP_URL}/images/personas/builder.jpg`,
    'Architect': `${APP_URL}/images/personas/architect.jpg`,
  };
  const personaImgUrl = personaImages[result.level ?? ''] ?? null;

  // v13 has only areas A-E (F removed)
  const isV13 = (result as any).version === 'v13';
  const activeAreas = isV13 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D', 'E', 'F'];

  const profileHtml = activeAreas.map(area => {
    const score = result.areaScores[area]?.raw ?? 0;
    return areaRow(area, areaLabels[area], score);
  }).join('');

  // Radar Chart generation via QuickChart.io
  const radarData = activeAreas.map(a => result.areaScores[a]?.raw ?? 0);
  // Build dual-dataset radar: user vs community avg
  const communityData = activeAreas.map(a => aggregates?.avgAreaScores?.[a] != null
    ? Math.round((aggregates.avgAreaScores![a] / 20) * 20) // already raw
    : 0
  );
  const chartConfig = {
    type: 'radar',
    data: {
      labels: activeAreas,
      datasets: [
        {
          label: 'Váš výsledek',
          data: radarData,
          backgroundColor: 'rgba(221, 60, 32, 0.15)',
          borderColor: '#DD3C20',
          pointBackgroundColor: '#DD3C20',
          borderWidth: 2.5
        },
        ...(aggregates?.avgAreaScores && Object.keys(aggregates.avgAreaScores).length > 0 ? [{
          label: 'Průměr komunity',
          data: activeAreas.map(a => {
            const pct = aggregates!.avgAreaScores![a] ?? 0;
            return Math.round((pct / 100) * 20);
          }),
          backgroundColor: 'rgba(100, 116, 139, 0.1)',
          borderColor: '#94a3b8',
          pointBackgroundColor: '#94a3b8',
          borderWidth: 2,
          borderDash: [4, 4]
        }] : [])
      ]
    },
    options: {
      scale: {
        ticks: { beginAtZero: true, max: 20, stepSize: 5, fontSize: 10 },
        pointLabels: { fontSize: 12, fontStyle: 'bold' }
      },
      legend: { display: true, position: 'bottom', labels: { fontSize: 11 } }
    }
  };
  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=520&h=340`;

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; }
    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
    .hero-card { background: #fff7f5; border: 2px solid #fecaca; border-radius: 12px; padding: 24px; margin-bottom: 24px; display: table; width: 100%; box-sizing: border-box; }
    .score-value { font-size: 48px; font-weight: 900; color: #DD3C20; display: table-cell; vertical-align: middle; width: 100px; }
    .score-info { display: table-cell; vertical-align: middle; padding-left: 20px; }
    .section { margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
    .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; }
    .btn { display: inline-block; background: #DD3C20; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 800; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #DD3C20; font-weight: 800; margin-bottom: 8px;">AI Competence Framework</div>
    <h1 class="title">Vaše výsledky diagnostiky</h1>
    
    <div class="hero-card">
      ${personaImgUrl ? `<div style="display:table-cell;vertical-align:middle;width:90px;"><img src="${personaImgUrl}" alt="${result.level}" width="80" height="80" style="border-radius:50%;object-fit:cover;border:3px solid #DD3C20;display:block;"/></div>` : ''}
      <div class="score-value">${result.totalPercent}%</div>
      <div class="score-info">
        <div style="font-size: 12px; color: #DD3C20; font-weight: 800; text-transform: uppercase;">Vaše úroveň</div>
        <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${result.level}</div>
      </div>
    </div>

    <!-- Spider Chart -->
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="${chartUrl}" width="100%" style="max-width: 520px; height: auto;" alt="Graf kompetencí" />
      ${aggregates?.avgAreaScores && Object.keys(aggregates.avgAreaScores).length > 0 ? `
      <p style="font-size:11px;color:#94a3b8;margin:8px 0 0;">Červená — váš výsledek · Šedá — průměr komunity (${aggregates.count ?? '?'} respondentů)</p>
      ` : ''}
    </div>

    <div class="section">
      <div class="section-title">Profil kompetencí A–E</div>
      ${profileHtml}
    </div>

    <div style="text-align: center; margin-top: 40px;">
      <a href="${resultUrl}" class="btn">Zobrazit plný report →</a>
      <p style="font-size: 11px; color: #cbd5e1; margin-top: 16px;">Odkaz: ${resultUrl}</p>
    </div>

    <div style="font-size: 12px; margin-top: 40px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px;">
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
