import { Resend } from 'resend';
import { CalculationResult } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-competence-framework-wfrx.vercel.app';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AI Competence Framework <onboarding@resend.dev>';

function levelCzech(level: string): string {
  const map: Record<string, string> = {
    'Observer': 'Pozorovatel',
    'Explorer': 'Průzkumník',
    'Implementer': 'Implementátor',
    'Practitioner': 'Praktik',
    'Amplifier': 'Amplifikátor',
    'Transformer': 'Transformátor',
  };
  return map[level] || level;
}

function areaRow(area: string, data: { raw: number; max: number; percent: number }): string {
  const barWidth = Math.round(data.percent);
  return `
        <tr>
            <td style="padding: 10px 0; font-weight: 700; font-size: 14px; color: #0f172a; width: 40px;">${area}</td>
            <td style="padding: 10px 0 10px 16px;">
                <div style="background: #f1f5f9; border-radius: 6px; overflow: hidden; height: 8px; width: 100%;">
                    <div style="background: #DD3C20; height: 8px; width: ${barWidth}%; border-radius: 6px;"></div>
                </div>
            </td>
            <td style="padding: 10px 0 10px 12px; font-size: 13px; font-weight: 700; color: #DD3C20; white-space: nowrap; width: 50px;">${data.percent}%</td>
        </tr>`;
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

  // Don't send to placeholder values
  if (!to || to === '__skip__' || !to.includes('@')) {
    return;
  }

  // Without a verified domain, Resend only delivers to the account owner email.
  // Set RESEND_TO_OVERRIDE to redirect all emails there (testing mode).
  // Once domain is verified, remove RESEND_TO_OVERRIDE and set RESEND_FROM_EMAIL.
  const toOverride = process.env.RESEND_TO_OVERRIDE;
  const actualTo = toOverride || to;
  const isOverride = !!toOverride && toOverride !== to;

  const resultUrl = `${APP_URL}/r/${airtableRecordId}`;
  const levelCz = levelCzech(result.level);
  const areaRows = Object.entries(result.areaScores)
    .map(([area, data]) => areaRow(area, data as any))
    .join('');

  // When redirected, show a notice banner in the email
  const overrideBanner = isOverride ? `
          <!-- Override Notice -->
          <tr>
            <td style="background: #fef3c7; border: 1px solid #fcd34d; padding: 12px 40px;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #92400e;">
                📧 TESTOVACÍ PŘESMĚROVÁNÍ — původně určeno pro: <strong>${to}</strong><br>
                Sdílený report: <a href="${resultUrl}" style="color: #DC2626;">${resultUrl}</a>
              </p>
            </td>
          </tr>` : '';

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Váš AI Competence Report</title>
</head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: #DD3C20; padding: 32px 40px;">
              <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase;">Metodika Inovatix</p>
              <h1 style="margin: 8px 0 0; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">AI Competence Framework</h1>
            </td>
          </tr>

          <!-- Score Hero -->
          <tr>
            <td style="padding: 40px 40px 24px;">
              <p style="margin: 0 0 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8;">Váš výsledek</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background: #fff7f5; border: 2px solid #fecaca; border-radius: 12px; padding: 20px 28px; text-align: center;">
                      <div style="font-size: 48px; font-weight: 900; color: #DD3C20; line-height: 1;">${result.totalPercent}%</div>
                      <div style="font-size: 13px; font-weight: 700; color: #64748b; margin-top: 4px;">celkové skóre</div>
                    </div>
                  </td>
                  <td style="padding-left: 20px;">
                    <div style="font-size: 22px; font-weight: 900; color: #0f172a;">${result.level}</div>
                    <div style="font-size: 15px; color: #64748b; font-weight: 600; margin-top: 2px;">${levelCz}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Area Scores -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0 0 12px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8;">Kompetenční profil A–F</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${areaRows}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
                Váš kompletní report s doporučeními, srovnáním s komunitou a detailní analýzou je dostupný online.
              </p>
              <a href="${resultUrl}"
                 style="display: inline-block; background: #DD3C20; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 15px; font-weight: 900; letter-spacing: 0.02em;">
                Zobrazit plný report →
              </a>
              <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">
                Nebo zkopírujte odkaz: <a href="${resultUrl}" style="color: #DD3C20;">${resultUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                Tento email byl odeslán na základě vašeho vyplnění dotazníku AI Competence Framework od Inovatix.<br>
                Pokud jste si nepřáli obdržet email, omluvte se — příště zaškrtněte políčko „Email nezadám".
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Insert the override banner into the HTML after the opening table
  const finalHtml = html.replace('<!-- Score Hero -->', `${overrideBanner}\n          <!-- Score Hero -->`);

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: actualTo,
      subject: isOverride
        ? `[PRE: ${to}] AI Report — ${result.level} (${result.totalPercent}%)`
        : `Váš AI Competence Report — ${result.level} (${result.totalPercent}%)`,
      html: finalHtml,
    });
    if (error) {
      console.error('Resend email error:', error);
    } else {
      console.log(`Email sent to ${actualTo} (intended: ${to}) for level ${result.level}`);
    }
  } catch (err) {
    console.error('Failed to send email:', err);
    // Don't throw — email failure should never block the user from seeing results
  }
}
