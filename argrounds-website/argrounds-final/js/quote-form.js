/* ================================================
   Grounds Maintenance — quote-form.js
   Handles quote form validation & submission.
   Works on: quote.html, contact.html, gallery.html
   
   Backend: stub — redirects to thank-you.html
   When you're ready to add a real API, replace the
   submitForm() function body with a fetch() call.
   ================================================ */

(function () {
  'use strict';

  const form = document.getElementById('quoteForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const successEl = document.getElementById('formSuccess');

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

    // Collect data
    const data = Object.fromEntries(new FormData(form));
    const redirectUrl = form.dataset.redirect || 'thank-you.html';

    // ── BACKEND STUB ──────────────────────────────────────────────────────────
    // Currently: simulates a 700ms delay then redirects to thank-you.
    //
    // TODO when backend is ready:
    //   const res = await fetch('/api/leads-create', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(data),
    //   });
    //   if (!res.ok) throw new Error('Server error');
    // ─────────────────────────────────────────────────────────────────────────

    await delay(700); // remove when using real API

    // Store name so thank-you page can personalize
    const name = data.first_name || data.name || '';
    if (name) sessionStorage.setItem('ar_submitted_name', name.split(' ')[0]);

    // Store submission locally (useful for debugging before API)
    try {
      const prev = JSON.parse(localStorage.getItem('ar_submissions') || '[]');
      prev.push({ ...data, submitted_at: new Date().toISOString() });
      localStorage.setItem('ar_submissions', JSON.stringify(prev));
    } catch (_) {}

    window.location.href = redirectUrl;
  });

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function setLoading(loading) {
    if (!submitBtn) return;
    const textEl = submitBtn.querySelector('.submit-text');
    submitBtn.disabled = loading;
    submitBtn.style.opacity = loading ? '0.75' : '1';
    if (textEl) textEl.textContent = loading ? 'Sending…' : 'Send My Free Quote Request';
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
