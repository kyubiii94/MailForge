/**
 * MJML compilation utilities.
 * In production, this uses the mjml package; for MVP we provide a fallback HTML generator.
 */

/**
 * Compile MJML source to responsive HTML email.
 * Falls back to wrapping in basic HTML if mjml package is unavailable.
 */
export async function compileMjml(mjmlSource: string): Promise<{
  html: string;
  errors: string[];
}> {
  try {
    const mjml2html = (await import('mjml')).default;
    const result = mjml2html(mjmlSource, {
      validationLevel: 'soft',
      minify: false,
    });

    return {
      html: result.html,
      errors: result.errors?.map((e: { message: string }) => e.message) || [],
    };
  } catch {
    // Fallback: return MJML as-is wrapped in basic HTML structure
    return {
      html: generateFallbackHtml(mjmlSource),
      errors: ['MJML compilation unavailable, using fallback HTML'],
    };
  }
}

/**
 * Generate a basic fallback HTML email when MJML is not available.
 */
function generateFallbackHtml(content: string): string {
  // Try to extract content from MJML tags
  const textMatch = content.match(/<mj-text[^>]*>([\s\S]*?)<\/mj-text>/g);
  const bodyContent = textMatch
    ? textMatch.map((t) => t.replace(/<\/?mj-text[^>]*>/g, '')).join('\n')
    : content;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;max-width:600px;width:100%;">
          <tr>
            <td style="padding:30px;">
              ${bodyContent}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Calculate deliverability score for an email.
 */
export function calculateDeliverabilityScore(params: {
  html: string;
  subject: string;
}): {
  spamScore: number;
  textImageRatio: number;
  subjectLength: number;
  overallScore: number;
} {
  const { html, subject } = params;

  // Subject length check (ideal: 30-60 chars)
  const subjectLength = subject.length;
  const subjectScore =
    subjectLength >= 30 && subjectLength <= 60
      ? 100
      : subjectLength < 30
      ? Math.round((subjectLength / 30) * 100)
      : Math.max(0, 100 - (subjectLength - 60) * 2);

  // Text/Image ratio
  const imgCount = (html.match(/<img/gi) || []).length;
  const textLength = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().length;
  const textImageRatio = imgCount > 0 ? Math.round(textLength / imgCount) : textLength;
  const ratioScore = textImageRatio > 200 ? 100 : Math.round((textImageRatio / 200) * 100);

  // Spam word check
  const spamWords = ['free', 'gratuit', 'urgent', 'act now', 'limited time', 'click here', '!!!', '$$$', 'winner'];
  const lowerHtml = html.toLowerCase();
  const spamHits = spamWords.filter((w) => lowerHtml.includes(w)).length;
  const spamScore = Math.max(0, 100 - spamHits * 15);

  const overallScore = Math.round((subjectScore + ratioScore + spamScore) / 3);

  return { spamScore, textImageRatio: ratioScore, subjectLength: subjectScore, overallScore };
}
