// Transactional request receipts. Never interpolate visitor HTML into email.
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

export async function sendEmail(env, { type, lead }) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !env.ADMIN_EMAIL) {
    throw new Error('Email configuration missing');
  }
  const internal = type === 'NEW_LEAD_INTERNAL';
  if (!internal && type !== 'NEW_LEAD_CUSTOMER_CONFIRMATION') throw new Error('Unknown email type');
  const name = lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
  const fields = [
    ['Request ID', lead.id], ['Name', name], ['Phone', lead.phone],
    ['Email', lead.email], ['Property address', lead.address],
    ['Service / subject', lead.service || lead.subject], ['Property size', lead.size],
    ['Preferred callback time', lead.timing || 'Any time'], ['Job details', lead.message],
    ['Source', lead.source], ['Page', lead.page_path],
  ];
  if (internal) fields.push(['Landing page', lead.landing_page], ['Referrer', lead.referrer],
    ['UTM source', lead.utm_source], ['UTM medium', lead.utm_medium], ['Campaign', lead.utm_campaign]);
  const detailsText = fields.map(([label, value]) => `${label}: ${value || 'Not provided'}`).join('\n');
  const detailsHTML = fields.map(([label, value]) => `<p><strong>${label}:</strong> ${escapeHTML(value || 'Not provided').replace(/\n/g, '<br>')}</p>`).join('\n');
  const subject = internal ? `New Lead: ${name || 'Website Visitor'}` : 'Your Quote Request - Grounds Maintenance';
  const intro = internal
    ? 'A website service request has been saved. Reply to this email to contact the requester, or use the phone number below.'
    : 'Thanks for contacting Grounds Maintenance. We received your request and will follow up to discuss the work. This is a request, not a confirmed booking.';
  const contactHTML = internal
    ? `<p><a href="tel:${escapeHTML(String(lead.phone || '').replace(/[^+\d]/g, ''))}">Call requester</a>${lead.email ? ` · <a href="mailto:${escapeHTML(lead.email)}">Email requester</a>` : ''}</p><p><a href="https://argrounds.com/admin/leads">Open saved requests</a></p>`
    : '<p>Questions? Reply to this email, or <a href="tel:+15019610788">call</a> / <a href="sms:+15019610788">text (501) 961-0788</a>.</p>';
  const payload = {
    from: env.FROM_EMAIL,
    to: internal ? env.ADMIN_EMAIL : lead.email,
    reply_to: internal ? (lead.email || env.ADMIN_EMAIL) : env.ADMIN_EMAIL,
    subject,
    html: `<h2>${internal ? 'New Service Request' : 'Request received'}</h2><p>${intro}</p>${detailsHTML}${contactHTML}`,
    text: `${intro}\n\n${detailsText}\n\n${internal ? 'Saved requests: https://argrounds.com/admin/leads' : 'Call or text (501) 961-0788. You can also reply to this email.'}`,
  };
  // Retry with the same key to avoid duplicate notifications on transient errors.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          ...(lead.id ? { 'Idempotency-Key': `${lead.id}/${type}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) return response.json();
      console.error('Email delivery API status:', response.status);
      if (response.status < 500 && response.status !== 429) break;
    } catch {
      console.error('Email delivery API unavailable');
    }
  }
  throw new Error('Email delivery failed');
}
