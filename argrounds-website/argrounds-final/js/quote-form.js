/* ================================================
   Grounds Maintenance — quote-form.js
   Handles quote form validation & submission.
   Works on: quote.html, contact.html, gallery.html
   
   Saves the request and checks notification delivery before redirecting.
   ================================================ */

(function () {
  'use strict';

  const form = document.getElementById('quoteForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const successEl = document.getElementById('formSuccess');
  const defaultButtonText = submitBtn?.querySelector('.submit-text')?.textContent || 'Send Request';
  function readSession(key) { try { return sessionStorage.getItem(key); } catch { return null; } }
  function writeSession(key, value) { try { sessionStorage.setItem(key, value); } catch {} }

  function showDeliveryMessage(saved) {
    let message = form.querySelector('.submit-error');
    if (!message) {
      message = document.createElement('div');
      message.className = 'submit-error field-error-msg';
      message.style.marginBottom = '12px';
      message.style.fontSize = '1rem';
      message.setAttribute('role', 'alert');
      message.tabIndex = -1;
      submitBtn.parentElement.insertBefore(message, submitBtn);
    }
    message.replaceChildren(document.createTextNode(saved
      ? 'Your request was saved, but our email alert could not be sent. Please call or text us to arrange follow-up. You do not need to submit again. '
      : 'We could not confirm your request. Your details are still here. Try again, or contact us directly: '));
    for (const [label, href] of [['Call (501) 961-0788', 'tel:+15019610788'], ['Text us', 'sms:+15019610788']]) {
      const link = document.createElement('a');
      link.textContent = label;
      link.href = href;
      link.style.display = 'inline-block';
      link.style.padding = '12px 8px';
      message.append(link);
    }
    message.focus();
  }

  // ── VALIDATION ─────────────────────────────────────────────────────────────

  function validateField(field) {
    const val = field.value.trim();

    if (field.required && !val) {
      setError(field, 'This field is required.');
      return false;
    }

    if (field.type === 'email' && val) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(val)) {
        setError(field, 'Please enter a valid email address.');
        return false;
      }
    }

    if (field.type === 'tel' && val) {
      const digitsOnly = val.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        setError(field, 'Please enter a valid phone number.');
        return false;
      }
    }

    clearError(field);
    return true;
  }

  function setError(field, msg) {
    field.classList.add('field-error');
    field.setAttribute('aria-invalid', 'true');

    // Add or update error message beneath the field
    let errEl = field.parentElement.querySelector('.field-error-msg');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'field-error-msg';
      errEl.setAttribute('role', 'alert');
      field.after(errEl);
    }
    errEl.textContent = msg;
  }

  function clearError(field) {
    field.classList.remove('field-error');
    field.removeAttribute('aria-invalid');
    const errEl = field.parentElement.querySelector('.field-error-msg');
    if (errEl) errEl.remove();
  }

  function validateForm() {
    const fields = form.querySelectorAll('input:not([type="hidden"]):not([tabindex="-1"]), select, textarea');
    let allValid = true;
    fields.forEach((f) => {
      if (!validateField(f)) allValid = false;
    });
    return allValid;
  }

  // ── LIVE VALIDATION (on blur) ───────────────────────────────────────────────
  form.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => clearError(field));
    field.addEventListener('change', () => clearError(field));
  });

  // ── SUBMIT ─────────────────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot check
    const honeypot = form.querySelector('[name="_gotcha"]');
    if (honeypot && honeypot.value) return;

    // Validate all fields
    if (!validateForm()) {
      const firstError = form.querySelector('.field-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }

    setLoading(true);
    form.querySelector('.submit-error')?.remove();

    // Collect data
    const data = Object.fromEntries(new FormData(form));
    const redirectUrl = form.dataset.redirect || 'thank-you.html';

    // ── ATTRIBUTION DATA ────────────────────────────────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const attributionData = {
      landing_page: readSession('ar_landing_page') || window.location.pathname,
      referrer: document.referrer || null,
      utm_source: urlParams.get('utm_source') || null,
      utm_medium: urlParams.get('utm_medium') || null,
      utm_campaign: urlParams.get('utm_campaign') || null,
      utm_term: urlParams.get('utm_term') || null,
      utm_content: urlParams.get('utm_content') || null,
      gclid: urlParams.get('gclid') || null,
      fbclid: urlParams.get('fbclid') || null,
      client_id: getCookie('_ga') || null,
      session_id: getCookie('_ga_session') || null, // Assuming standard GA naming, adjust as needed
      user_agent: navigator.userAgent,
      page_path: window.location.pathname,
      source: form.querySelector('[name="subject"]') ? 'contact_form' : 'quote_form'
    };

    function getCookie(name) {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    }

    const payload = { ...data, ...attributionData };

    // ── API SUBMISSION ────────────────────────────────────────────────────────
    try {
      const res = await fetch('/api/leads-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('Lead API error:', res.status, errText);
        throw new Error(`Lead API error (${res.status}): ${errText || 'Server error'}`);
      }
      const result = await res.json();
      if (result.captured && result.notification_sent === false) {
        setLoading(false);
        submitBtn.disabled = true;
        showDeliveryMessage(true);
        return;
      }

      // Store name so thank-you page can personalize
      const name = data.first_name || data.name || '';
      if (name) writeSession('ar_submitted_name', name.split(' ')[0]);

      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Form submission error:', err);
      setLoading(false);
      showDeliveryMessage(false);
    }
  });

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function setLoading(loading) {
    if (!submitBtn) return;
    const textEl = submitBtn.querySelector('.submit-text');
    submitBtn.disabled = loading;
    submitBtn.style.opacity = loading ? '0.75' : '1';
    if (textEl) textEl.textContent = loading ? 'Sending…' : defaultButtonText;
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── INJECT FIELD ERROR STYLES ─────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .field-error {
      border-color: #e53e3e !important;
      background: #fff5f5 !important;
    }
    .field-error-msg {
      display: block;
      color: #c53030;
      font-size: 0.8rem;
      font-weight: 600;
      margin-top: 4px;
    }
  `;
  document.head.appendChild(style);

})();
