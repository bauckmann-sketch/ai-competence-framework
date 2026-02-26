import { CalculationResult, AggregateStats } from '@/types';

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
  airtableRecordId: string
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

  // Radar Chart generation via QuickChart.io
  const radarData = ['A', 'B', 'C', 'D', 'E', 'F'].map(a => result.areaScores[a]?.raw ?? 0);
  const chartConfig = {
    type: 'radar',
    data: {
      labels: ['A', 'B', 'C', 'D', 'E', 'F'],
      datasets: [{
        label: 'Profil AI kompetencí',
        data: radarData,
        backgroundColor: 'rgba(221, 60, 32, 0.1)',
        borderColor: '#DD3C20',
        pointBackgroundColor: '#DD3C20',
        borderWidth: 2
      }]
    },
    options: {
      scale: {
        ticks: { beginAtZero: true, max: 20, stepSize: 5, fontSize: 10 },
        pointLabels: { fontSize: 12, fontStyle: 'bold' }
      },
      legend: { display: false }
    }
  };
  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300`;

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
      <div class="score-value">${result.totalPercent}%</div>
      <div class="score-info">
        <div style="font-size: 12px; color: #DD3C20; font-weight: 800; text-transform: uppercase;">Vaše úroveň</div>
        <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${result.level}</div>
      </div>
    </div>

    <!-- Spider Chart -->
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="${chartUrl}" width="100%" style="max-width: 500px; height: auto;" alt="Graf kompetencí" />
    </div>

    <div style="display: table; width: 100%; border-spacing: 10px 0;">
      <div style="display: table-cell; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; width: 50%;">
        <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Adopce & Investice</div>
        <div style="font-size: 14px; font-weight: 700;">${adoptionIndex}/10 (${adoptionBand})</div>
      </div>
      <div style="display: table-cell; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; width: 50%;">
        <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Spolehlivost faktů</div>
        <div style="font-size: 14px; font-weight: 700;">${reliabilityBadge}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Profil kompetencí A–F</div>
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
