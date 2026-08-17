// functions/api/_email.js
// Centralized email helper for transactional emails

export async function sendEmail(env, { type, lead }) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    console.warn('Email credentials missing. Skipping email.');
    return false;
  }

  const endpoint = 'https://api.resend.com/emails';
  let to, subject, html;

  // Build the email details based on the type
  if (type === 'NEW_LEAD_INTERNAL') {
    to = env.ADMIN_EMAIL || env.FROM_EMAIL;
    subject = `New Lead: ${lead.first_name || lead.name || 'Website Visitor'}`;
    html = `
      <h2>New Quote Request</h2>
      <p><strong>Name:</strong> ${lead.first_name || ''} ${lead.last_name || lead.name || ''}</p>
      <p><strong>Phone:</strong> ${lead.phone}</p>
      <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
      <p><strong>Address:</strong> ${lead.address || 'N/A'}</p>
      <p><strong>Service:</strong> ${lead.service || 'N/A'}</p>
      <p><strong>Notes:</strong> ${lead.message || 'N/A'}</p>
      <hr />
      <p><em>Source: ${lead.source || 'Website'}</em><br/>
      <em>UTM Source: ${lead.utm_source || 'N/A'}</em><br/>
      <em>Campaign: ${lead.utm_campaign || 'N/A'}</em></p>
    `;
  } else if (type === 'NEW_LEAD_CUSTOMER_CONFIRMATION') {
    to = lead.email;
    subject = `Your Quote Request - Grounds Maintenance`;
    html = `
      <p>Hi ${lead.first_name || lead.name || 'there'},</p>
      <p>Thanks for reaching out to Grounds Maintenance! We've received your request and will get back to you shortly to discuss your project.</p>
      <p>If you need immediate assistance, feel free to call us at (501) 961-0788.</p>
      <p>Best regards,<br/>The Grounds Maintenance Team</p>
    `;
  }

  // Send the email using the Resend API (standard Cloudflare Pages fetch)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Email API error:', errorBody);
    throw new Error('Failed to send email');
  }

  return response.json();
}
