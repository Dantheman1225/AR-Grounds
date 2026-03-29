/* ================================================
   Grounds Maintenance — auth.js
   Supabase auth stub.
   
   TODO: Install @supabase/supabase-js via CDN or npm
   and replace stub functions with real Supabase calls.
   ================================================ */

(function () {
  'use strict';

  // ── SUPABASE CLIENT STUB ──────────────────────────────────────────────────
  // When ready, replace with:
  //   import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
  //   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  //
  // For now, auth uses a simple sessionStorage token stub.
  const AUTH_KEY = 'ar_admin_authed';

  // ── SESSION GUARD ─────────────────────────────────────────────────────────
  // On admin pages (except login), redirect to login if not authenticated
  const isLoginPage = window.location.pathname.includes('login');
  const isAdminPage = window.location.pathname.includes('/admin/');

  if (isAdminPage && !isLoginPage) {
    const authed = sessionStorage.getItem(AUTH_KEY);
    if (!authed) {
      window.location.replace('login.html');
    }
  }

  // ── LOGIN FORM ─────────────────────────────────────────────────────────────
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('[name="email"]').value.trim();
      const password = loginForm.querySelector('[name="password"]').value;
      const errEl = document.getElementById('loginError');
      const btn = document.getElementById('loginBtn');

      if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

      // ── STUB: replace with Supabase signInWithPassword ────────────────────
      // const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      // if (error) { showError(error.message); return; }
      // ─────────────────────────────────────────────────────────────────────

      // Dev stub: any email + "password" works
      await new Promise((r) => setTimeout(r, 600));

      if (password === 'password' || email) { // stub: always succeeds in dev
        sessionStorage.setItem(AUTH_KEY, 'true');
        sessionStorage.setItem('ar_admin_email', email);
        window.location.href = 'dashboard.html';
      } else {
        if (errEl) errEl.classList.add('is-visible');
        if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
      }
    });
  }

  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem('ar_admin_email');
      // TODO: supabase.auth.signOut()
      window.location.href = 'login.html';
    });
  }

  // ── POPULATE USER INFO ────────────────────────────────────────────────────
  const userEmail = sessionStorage.getItem('ar_admin_email') || '';
  const nameEl = document.getElementById('userName');
  const initialEl = document.getElementById('userInitial');
  if (nameEl && userEmail) nameEl.textContent = userEmail.split('@')[0];
  if (initialEl && userEmail) initialEl.textContent = userEmail[0].toUpperCase();

})();
