/* Grounds Maintenance — main.js */

// ── NAV TOGGLE ──────────────────────────────────────────────────────────────
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navMenu.classList.toggle('is-open');
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── REVEAL ON SCROLL ─────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal-up').forEach((el) => revealObserver.observe(el));

// ── FLOATING CTA BAR ─────────────────────────────────────────────────────────
// Show after hero scrolled past
const floatBar = document.getElementById('floatBar');
const heroSection = document.querySelector('.hero');

if (floatBar && heroSection) {
  const floatObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        floatBar.style.display = 'flex';
      } else {
        floatBar.style.display = 'none';
      }
    },
    { threshold: 0 }
  );
  floatObserver.observe(heroSection);
}

// ── QUOTE FORM HANDLING ───────────────────────────────────────────────────────
const quoteForm = document.getElementById('quoteForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');

if (quoteForm) {
  quoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic client-side validation
    const required = quoteForm.querySelectorAll('[required]');
    let valid = true;
    required.forEach((field) => {
      field.classList.remove('field-error');
      if (!field.value.trim()) {
        field.classList.add('field-error');
        valid = false;
      }
    });

    if (!valid) {
      const firstError = quoteForm.querySelector('.field-error');
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Check honeypot
    const honeypot = quoteForm.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value) return;

    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
      submitBtn.querySelector('.submit-text').textContent = 'Sending…';
    }

    const formData = new FormData(quoteForm);
    const formspreeAction = quoteForm.getAttribute('action') || '';

    // If Formspree ID is configured, submit there
    if (formspreeAction && !formspreeAction.includes('YOUR_FORM_ID')) {
      try {
        const res = await fetch(formspreeAction, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          showSuccess();
        } else {
          resetSubmit('Send My Free Quote Request');
          alert('Something went wrong. Please call us at (501) 961-0788 or try again.');
        }
      } catch (err) {
        resetSubmit('Send My Free Quote Request');
        alert('Network error. Please call us at (501) 961-0788 or try again.');
      }
    } else {
      // Dev mode — simulate success after brief delay
      setTimeout(() => {
        showSuccess();
      }, 800);
    }
  });

  function showSuccess() {
    if (submitBtn) submitBtn.style.display = 'none';
    if (formSuccess) {
      formSuccess.classList.add('is-visible');
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function resetSubmit(label) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.querySelector('.submit-text').textContent = label;
    }
  }

  // Live field error clearing
  quoteForm.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('input', () => field.classList.remove('field-error'));
    field.addEventListener('change', () => field.classList.remove('field-error'));
  });
}

// ── SMOOTH SCROLL OFFSET (sticky header) ────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const header = document.querySelector('.site-header');
    const topbar = document.querySelector('.topbar');
    const offset = (header ? header.offsetHeight : 0) + (topbar ? topbar.offsetHeight : 0) + 16;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── FIELD ERROR STYLES (injected) ───────────────────────────────────────────
const errorStyle = document.createElement('style');
errorStyle.textContent = `.field-error { border-color: #e53e3e !important; background: #fff5f5 !important; }`;
document.head.appendChild(errorStyle);
