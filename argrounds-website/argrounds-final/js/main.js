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


