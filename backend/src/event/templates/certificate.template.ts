export interface CertificateTemplateData {
  volunteerName: string;
  eventTitle: string;
  orgName: string;
  orgLogoUrl?: string | null;
  eventDate: string;    // pre-formatted: "12 April 2026"
  hoursContributed: number;
  verificationId: string;
  issuedDate: string;   // pre-formatted: "12 April 2026"
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  const display = rounded % 1 === 0 ? rounded.toFixed(0) : String(rounded);
  return `${display} ${rounded === 1 ? 'hour' : 'hours'}`;
}

export function renderCertificateHTML(data: CertificateTemplateData): string {
  const {
    volunteerName,
    eventTitle,
    orgName,
    orgLogoUrl,
    eventDate,
    hoursContributed,
    verificationId,
    issuedDate,
  } = data;

  const brand = '#0F4F3F';
  const hours = formatHours(hoursContributed);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Certificate of Contribution – KINDLY</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after {
      margin: 0; padding: 0; box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      width: 297mm;
      height: 210mm;
      overflow: hidden;
      background: #fff;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .page {
      width: 297mm;
      height: 210mm;
      padding: 13mm 18mm 11mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      background: #ffffff;
      /* Outer border */
      outline: 1px solid ${brand}20;
      outline-offset: -1px;
    }

    /* Inner decorative rule */
    .page::before {
      content: '';
      position: absolute;
      inset: 5.5mm;
      border: 0.5px solid ${brand}14;
      pointer-events: none;
    }

    /* ---- HEADER ---- */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }

    .wordmark {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 20pt;
      color: ${brand};
      letter-spacing: -0.03em;
      line-height: 1;
    }

    .cert-type {
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      font-size: 7.5pt;
      color: #9ca3af;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      text-align: right;
      padding-top: 3pt;
    }

    /* ---- BODY ---- */
    .body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0;
      flex: 1;
      justify-content: center;
      padding: 0 10mm;
    }

    .certify-label {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-weight: 400;
      font-size: 11pt;
      color: #9ca3af;
      margin-bottom: 7pt;
    }

    .volunteer-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700;
      font-size: 42pt;
      color: ${brand};
      line-height: 1.05;
      max-width: 230mm;
      word-break: break-word;
      margin-bottom: 10pt;
      letter-spacing: -0.02em;
    }

    .contribution-line {
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      font-size: 11pt;
      color: #6b7280;
      margin-bottom: 5pt;
    }

    .contribution-line strong {
      font-weight: 600;
      color: #374151;
    }

    .event-title {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 16pt;
      color: #111827;
      max-width: 215mm;
      line-height: 1.25;
      margin-bottom: 5pt;
    }

    .org-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6pt;
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      color: #6b7280;
      margin-bottom: 4pt;
    }

    .org-logo {
      max-height: 26px;
      max-width: 80px;
      object-fit: contain;
      border-radius: 3px;
      vertical-align: middle;
    }

    .date-line {
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      color: #9ca3af;
      letter-spacing: 0.04em;
    }

    /* ---- FOOTER ---- */
    .footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }

    .footer-left {
      display: flex;
      flex-direction: column;
      gap: 1.5pt;
    }

    .issued-label {
      font-family: 'Inter', sans-serif;
      font-size: 7pt;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .issued-value {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 8pt;
      color: ${brand};
    }

    .footer-wordmark {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 8pt;
      color: ${brand}60;
      letter-spacing: -0.01em;
      margin-top: 4pt;
    }

    .footer-right {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 2.5pt;
    }

    .verification-id {
      font-family: 'Courier New', Courier, monospace;
      font-size: 7pt;
      color: #9ca3af;
      letter-spacing: 0.05em;
    }

    .verify-url {
      font-family: 'Inter', sans-serif;
      font-size: 7pt;
      color: ${brand}90;
    }
  </style>
</head>
<body>
  <div class="page">

    <div class="header">
      <span class="wordmark">KINDLY</span>
      <span class="cert-type">Certificate of Contribution</span>
    </div>

    <div class="body">
      <p class="certify-label">This is to certify that</p>
      <h1 class="volunteer-name">${escapeHtml(volunteerName)}</h1>
      <p class="contribution-line">contributed <strong>${escapeHtml(hours)}</strong> of meaningful service at</p>
      <p class="event-title">${escapeHtml(eventTitle)}</p>
      <div class="org-row">
        <span>organized by ${escapeHtml(orgName)}</span>
        ${orgLogoUrl ? `<img src="${escapeHtml(orgLogoUrl)}" alt="" class="org-logo" />` : ''}
      </div>
      <p class="date-line">on ${escapeHtml(eventDate)}</p>
    </div>

    <div class="footer">
      <div class="footer-left">
        <span class="issued-label">Issued on</span>
        <span class="issued-value">${escapeHtml(issuedDate)}</span>
        <span class="footer-wordmark">KINDLY</span>
      </div>
      <div class="footer-right">
        <span class="verification-id">ID: ${escapeHtml(verificationId)}</span>
        <span class="verify-url">kindly.co.in/verify/${escapeHtml(verificationId)}</span>
      </div>
    </div>

  </div>
</body>
</html>`;
}
