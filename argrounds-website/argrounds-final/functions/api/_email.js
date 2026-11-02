// Live-text transactional emails styled after the approved Grounds Green concept.
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
const site = 'https://argrounds.com';
const display = value => value || 'Not provided';
const multiline = value => escapeHTML(display(value)).replace(/\r?\n/g, '<br>');
const services = {
  'commercial-grounds': 'Commercial Grounds Maintenance', 'residential-lawn': 'Residential Lawn Care',
  'property-cleanup': 'Property Cleanup / Overgrowth', 'hedges-shrubs': 'Shrub & Hedge Maintenance',
  'pressure-washing': 'Pressure Washing', 'multi-site': 'Institutional / Multi-Site Service',
  multiple: 'Multiple Services', unsure: 'Not sure — need a recommendation',
  driveway: 'Driveway Cleaning', sidewalk: 'Sidewalk / Walkway Cleaning', patio: 'Patio / Paver Cleaning',
  deck: 'Deck Cleaning', fence: 'Fence Cleaning', porch: 'Porch / Entryway Cleaning',
  storefront: 'Storefront / Entry Cleaning', bundle: 'Driveway + Walkway Bundle',
};
const times = {morning: 'Morning (8am–12pm)', afternoon: 'Afternoon (12pm–5pm)', evening: 'Evening (5pm–7pm)'};
const button = (href, label) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" bgcolor="#b9ed27" style="border-radius:8px;"><a href="${escapeHTML(href)}" style="display:block;padding:17px 14px;border:1px solid #b9ed27;border-radius:8px;color:#103b2b;font-size:17px;font-weight:bold;text-decoration:none;line-height:24px;">${escapeHTML(label)} &rarr;</a></td></tr></table>`;
const rows = fields => fields.map(([label,value]) => `<tr><td style="padding:12px 0;border-bottom:1px solid #dce5df;overflow-wrap:anywhere;word-break:break-word;"><div style="font-size:12px;font-weight:bold;letter-spacing:.5px;color:#52665b;margin-bottom:4px;">${escapeHTML(label)}</div><div style="font-size:16px;line-height:24px;color:#162c22;">${multiline(value)}</div></td></tr>`).join('');

// Export the same payload builder used in production for faithful design previews.
export function buildEmail(env, {type, lead}) {
  const internal = type === 'NEW_LEAD_INTERNAL';
  if (!internal && type !== 'NEW_LEAD_CUSTOMER_CONFIRMATION') throw new Error('Unknown email type');
  const stored = lead.storage_saved !== false;
  const name = lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
  const service = services[lead.service] || lead.service || lead.subject;
  const timing = times[lead.timing] || lead.timing || 'Any time';
  // Size values have different labels on the homepage and the legacy quote page.
  // Preserve the actual submitted value instead of guessing the property dimensions.
  const core = [['Name',name],['Phone',lead.phone],['Email',lead.email],['Property size / scope',lead.size],['Job details',lead.message],['Request ID',lead.id]];
  const summary = [['Service / subject',service],['Property address',lead.address],['Preferred callback time',timing]];
  const attribution = [['Source',lead.source],['Page',lead.page_path],['Landing page',lead.landing_page],['Referrer',lead.referrer],['UTM source',lead.utm_source],['UTM medium',lead.utm_medium],['Campaign',lead.utm_campaign]];
  const fields = [...summary,...core,...(internal ? attribution : [])];
  const detailsText = fields.map(([label,value]) => `${label}: ${display(value)}`).join('\n');
  const phone = String(lead.phone || '').replace(/[^+\d]/g, '');
  const requestSubject = `Property photos / request ${lead.id || ''}`.trim();
  const photosLink = `mailto:${env.ADMIN_EMAIL}?subject=${encodeURIComponent(requestSubject)}`;
  const internalIntro = `${stored ? 'A website service request has been saved.' : 'EMAIL-ONLY REQUEST: The request dashboard was unavailable. Keep this email, follow up with the requester, and add it to the dashboard manually.'} ${lead.email ? 'Reply to this email to contact the requester, or use the phone number below.' : 'No email was supplied; call or text the requester using the phone number below.'}`;
  const customerIntro = `Hi ${name || 'there'}, we received your request. We’ll review the details and contact you about the scope, pricing, and scheduling.`;
  const intro = internal ? internalIntro : customerIntro;
  const subject = internal ? `New Lead: ${name || 'Website Visitor'}` : 'Your Quote Request - Grounds Maintenance';
  const actions = internal
    ? `${button(lead.email ? `mailto:${lead.email}` : `tel:${phone}`,lead.email ? 'Reply to requester' : 'Call requester')}<p style="text-align:center;margin:16px 0 0;font-size:16px;line-height:28px;"><a style="color:#103b2b;" href="tel:${escapeHTML(phone)}">Call requester</a> &nbsp;&bull;&nbsp; <a style="color:#103b2b;" href="sms:${escapeHTML(phone)}">Text requester</a></p><p style="text-align:center;margin:12px 0 0;font-size:15px;"><a style="color:#103b2b;" href="${site}/admin/leads">${stored ? 'Open saved requests' : 'Open dashboard to add this email-only request'}</a></p>`
    : `<h2 style="margin:0 0 8px;font-size:21px;color:#103b2b;">Have photos of the property?</h2><p style="margin:0 0 18px;font-size:16px;line-height:25px;color:#52665b;">Reply with photos so we can better understand what you need.</p>${button(photosLink,'Reply with property photos')}<p style="text-align:center;margin:16px 0 4px;font-size:16px;line-height:28px;"><a style="color:#103b2b;" href="tel:+15019610788">Call</a> or <a style="color:#103b2b;" href="sms:+15019610788">text (501) 961-0788</a></p><p style="text-align:center;margin:4px 0 0;font-size:13px;line-height:21px;color:#52665b;">Your appointment will be confirmed separately.</p>`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHTML(subject)}</title><style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table{border-collapse:collapse}img{border:0;outline:none;text-decoration:none}a{color:#103b2b}@media only screen and (max-width:600px){.outer{padding:0!important}.pad{padding-left:24px!important;padding-right:24px!important}.headline{font-size:32px!important;line-height:34px!important}.brand{font-size:27px!important}.brand-sub{font-size:11px!important}.hero{background-position:center!important}.shell{border-radius:0!important}}</style></head><body style="margin:0;padding:0;background:#eef2ee;font-family:Arial,Helvetica,sans-serif;color:#162c22;"><div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHTML(internal ? 'New property service request — contact information and job details inside.' : 'We received your property service request. Send photos or call/text to discuss the work.')}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#eef2ee"><tr><td class="outer" align="center" style="padding:28px 12px;"><!--[if mso]><table role="presentation" width="600"><tr><td><![endif]--><table role="presentation" class="shell" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td class="pad hero" bgcolor="#0b3525" background="${site}/assets/email/grounds-green-v1.jpg" style="padding:34px 34px 30px;background-color:#0b3525;background-image:url('${site}/assets/email/grounds-green-v1.jpg');background-size:cover;background-position:center;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="50" style="padding-right:12px;"><img src="${site}/assets/brand/logo.png" width="48" height="48" alt="" style="display:block;background:#ffffff;border-radius:10px;"></td><td style="color:#ffffff;"><div class="brand" style="font-family:'Arial Narrow',Impact,Arial,sans-serif;font-size:34px;line-height:36px;font-weight:900;letter-spacing:.5px;color:#ffffff;">GROUNDS</div><div class="brand-sub" style="font-size:12px;line-height:18px;font-weight:bold;letter-spacing:2px;color:#ffffff;">MAINTENANCE LLC</div></td></tr></table>
<p style="margin:32px 0 12px;font-size:13px;line-height:20px;font-weight:bold;letter-spacing:3px;color:#b9ed27;">${internal ? 'NEW WEBSITE INQUIRY' : 'REQUEST RECEIVED'}</p><h1 class="headline" style="margin:0;font-family:'Arial Narrow',Impact,Arial,sans-serif;font-size:42px;line-height:44px;font-weight:900;letter-spacing:-1px;color:#ffffff;">${internal ? 'A PROPERTY NEEDS<br>YOUR ATTENTION.' : 'LET’S GET YOUR<br>PROPERTY<br>HANDLED.'}</h1><p style="margin:16px 0 0;font-size:16px;line-height:24px;font-weight:bold;color:#ffffff;">Residential &amp; commercial grounds care</p></td></tr>
<tr><td class="pad" style="padding:28px 34px 22px;"><p style="margin:0;font-size:17px;line-height:27px;${internal && !stored ? 'padding:16px;background:#fff3ce;border-left:4px solid #996511;' : ''}">${escapeHTML(intro)}</p></td></tr>
<tr><td class="pad" style="padding:0 34px 24px;"><table role="presentation" width="100%" bgcolor="#f3f6f3" cellspacing="0" cellpadding="0" border="0" style="border-radius:10px;"><tr><td style="padding:20px 22px;"><h2 style="margin:0 0 6px;font-size:13px;letter-spacing:2px;color:#103b2b;">${internal ? 'SERVICE REQUEST' : 'YOUR REQUEST'}</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows(summary)}</table></td></tr></table></td></tr>
<tr><td class="pad" style="padding:0 34px 28px;">${actions}</td></tr>
<tr><td class="pad" style="padding:0 34px 30px;"><h2 style="margin:0 0 4px;font-size:13px;letter-spacing:2px;color:#103b2b;">REQUEST DETAILS</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows(core)}</table>${internal ? `<h2 style="margin:24px 0 4px;font-size:13px;letter-spacing:2px;color:#52665b;">WEBSITE SOURCE</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows(attribution)}</table>` : ''}</td></tr>
<tr><td class="pad" bgcolor="#0b3525" style="padding:24px 34px;text-align:center;color:#ffffff;"><p style="margin:0 0 17px;font-size:13px;line-height:23px;color:#ffffff;">Lawn care &nbsp;&bull;&nbsp; Property cleanups &nbsp;&bull;&nbsp; Hedge care &nbsp;&bull;&nbsp; Pressure washing</p><p style="margin:0;padding-top:16px;border-top:1px solid #40634e;font-size:14px;line-height:26px;"><a href="${site}" style="color:#ffffff;font-weight:bold;">argrounds.com</a><br><a href="mailto:${escapeHTML(env.ADMIN_EMAIL)}" style="color:#ffffff;">${escapeHTML(env.ADMIN_EMAIL)}</a></p><p style="margin:12px 0 0;color:#c8d7cc;font-size:12px;line-height:19px;">Grounds Maintenance LLC${internal ? ' · Internal request notification' : ' · Sent in response to your service request'}</p></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
  return {
    from:env.FROM_EMAIL, to:internal ? env.ADMIN_EMAIL : lead.email,
    reply_to:internal ? (lead.email || env.ADMIN_EMAIL) : env.ADMIN_EMAIL, subject, html,
    text:`GROUNDS MAINTENANCE LLC\nResidential & commercial grounds care\n\n${internal ? 'NEW WEBSITE INQUIRY' : 'REQUEST RECEIVED — LET’S GET YOUR PROPERTY HANDLED.'}\n\n${intro}\n\n${detailsText}\n\n${internal ? `Saved requests: ${site}/admin/leads\n${lead.email ? 'Reply to this email to contact the requester.' : 'Call or text the requester.'}` : 'Have photos of the property? Reply with photos so we can better understand what you need.\nCall or text (501) 961-0788.\nYour appointment will be confirmed separately.'}\n\n${site}\n${env.ADMIN_EMAIL}`,
  };
}

export async function sendEmail(env, {type, lead}) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !env.ADMIN_EMAIL) throw new Error('Email configuration missing');
  const payload = buildEmail(env, {type, lead});
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
        signal: AbortSignal.timeout(10000),
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
