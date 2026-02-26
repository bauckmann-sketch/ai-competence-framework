import { CalculationResult, AggregateStats } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-competence-framework-wfrx.vercel.app';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AI Competence Framework <onboarding@resend.dev>';

// Labels for Q1_2 (Frequency)
const FREQUENCY_LABELS: Record<string, string> = {
  never: 'Nikdy',
  lt_weekly: 'Méně než 1× týdně',
  weekly: '1–2× týdně',
  almost_daily: 'Skoro denně',
  multi_daily: 'Denně vícekrát'
};

// Labels for Q1_2b (Paid tools)
const PAID_TOOLS_LABELS: Record<string, string> = {
  '0': 'Žádné',
  '1': 'Jeden',
  '2_3': 'Dva až tři',
  'up_to_6': 'Do šesti',
  'up_to_10': 'Do deseti',
  'gt_10': 'Více než 10'
};

// Labels for QF2 (Tool types)
const TOOL_TYPES_LABELS: Record<string, string> = {
  text: 'Texty',
  code: 'Programování',
  graphics: 'Grafika',
  video: 'Video',
  voice: 'Hlas / Audio',
  presentations: 'Prezentace'
};

function getAverageLabel(dist: Record<string, number> | undefined, labelMap: Record<string, string>, indexMap: Record<string, number>): string {
  if (!dist) return 'Nezadáno';
  let totalWeight = 0;
  let totalCount = 0;
  for (const [val, count] of Object.entries(dist)) {
    const weight = indexMap[val] ?? 0;
    totalWeight += weight * count;
    totalCount += count;
  }
  if (totalCount === 0) return 'Nezadáno';
  const avgIndex = totalWeight / totalCount;

  // Find closest index
  let closestKey = Object.keys(indexMap)[0];
  let minDiff = Infinity;
  for (const [key, weight] of Object.entries(indexMap)) {
    const diff = Math.abs(avgIndex - weight);
    if (diff < minDiff) {
      minDiff = diff;
      closestKey = key;
    }
  }
  return labelMap[closestKey] || 'Nezadáno';
}

function getTop3Labels(dist: Record<string, number> | undefined, labelMap: Record<string, string>): string {
  if (!dist) return 'Nezadáno';
  return Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([val]) => labelMap[val] || val)
    .join(', ');
}

export async function sendResultsEmail(
  to: string,
  result: CalculationResult,
  airtableRecordId: string,
  aggregates: AggregateStats | null = null
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

  // Competence Profile A-F
  const profile = ['A', 'B', 'C', 'D', 'E', 'F'].map(area => {
    const score = result.areaScores[area]?.raw ?? 0;
    const labels: Record<string, string> = {
      A: 'Základy', B: 'Promptování', C: 'Ověřování',
      D: 'Workflow', E: 'Systémy', F: 'Tvorba'
    };
    return `${area} ${labels[area]}: ${score}/20`;
  }).join('<br>');

  // Comparison data
  const freqYou = FREQUENCY_LABELS[result.answers.Q1_2] || 'Nezadáno';
  const freqAvg = getAverageLabel(aggregates?.questionDistributions?.['Q1_2'], FREQUENCY_LABELS, { never: 0, lt_weekly: 1, weekly: 2, almost_daily: 4, multi_daily: 5 });

  const paidYou = PAID_TOOLS_LABELS[result.answers.Q1_2b] || 'Nezadáno';
  const paidAvg = getAverageLabel(aggregates?.questionDistributions?.['Q1_2b'], PAID_TOOLS_LABELS, { '0': 0, '1': 1, '2_3': 2, 'up_to_6': 3, 'up_to_10': 4, 'gt_10': 5 });

  const toolsYou = (result.answers.QF2 || []).map((v: string) => TOOL_TYPES_LABELS[v] || v).join(', ') || 'Žádné';
  const toolsAvg = getTop3Labels(aggregates?.questionDistributions?.['QF2'], TOOL_TYPES_LABELS);

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
    .section { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
    .section-title { font-weight: bold; margin-bottom: 10px; text-decoration: underline; }
    .item { margin-bottom: 5px; }
    .footer { font-size: 14px; margin-top: 30px; color: #666; }
    .btn { display: inline-block; background: #DD3C20; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Dobrý den / Ahoj,</p>
      <p>tady jsou vaše výsledky z diagnostiky: <strong>AI competence framework by Inovatix</strong>.<br>
      Výsledek berte jako orientační diagnostiku, ne audit – cílem je rychle ukázat, co vám přinese největší posun v praxi.</p>
    </div>

    <div class="section">
      <div class="section-title">Rychlé shrnutí</div>
      <div class="item"><strong>Kompetence (Skill):</strong> ${result.totalPercent}% – ${result.level}</div>
      <div class="item"><strong>Adopce & investice:</strong> ${adoptionIndex}/10 (${adoptionBand})</div>
      <div class="item"><strong>Spolehlivost práce s fakty:</strong> ${reliabilityBadge}</div>
    </div>

    <div class="section">
      <div class="section-title">Profil kompetencí A–F (0–20)</div>
      <div class="item">${profile}</div>
    </div>

    <div class="section">
      <div class="section-title">Srovnání s komunitou (anonymní benchmark)</div>
      <div class="item"><strong>Frekvence používání AI:</strong> vy ${freqYou} • průměr komunity ${freqAvg}</div>
      <div class="item"><strong>Placené AI nástroje:</strong> vy ${paidYou} • průměr komunity ${paidAvg}</div>
      <div class="item"><strong>TOP 3 typy nástrojů, které používáte:</strong> ${toolsYou}</div>
      <div class="item"><strong>Nejčastější TOP 3 v komunitě:</strong> ${toolsAvg}</div>
    </div>

    <div class="section" style="border-bottom: none;">
      <p>Plný report najdete zde:</p>
      <a href="${resultUrl}" class="btn">Zobrazit plný report →</a>
      <p style="font-size: 12px; color: #999; margin-top: 10px;">${resultUrl}</p>
    </div>

    <div class="footer">
      Díky a ať vám AI šetří čas i nervy 🙂<br>
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
