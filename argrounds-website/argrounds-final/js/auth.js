import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

/* ================================================
   Grounds Maintenance — auth.js
   Supabase auth integration.
   ================================================ */

// Provide your actual Supabase URL and ANON Key here or via window.env
const SUPABASE_URL = window.SUPABASE_URL || 'https://eldlzdyqntbymmoxykff.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZGx6ZHlxbnRieW1tb3h5a2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzEzNDgsImV4cCI6MjA5MTc0NzM0OH0.90nC91-ivpieYTZdP0eGSYkQB-EPPDEnE4TcaATmO0w';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const isLoginPage = window.location.pathname.includes('login');
const isAdminPage = window.location.pathname.includes('/admin/');

async function checkSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (isAdminPage && !isLoginPage) {
    if (!session) {
      window.location.replace('login.html');
    } else {
      populateUserInfo(session.user);
    }
  } else if (isLoginPage && session) {
    window.location.replace('dashboard.html');
  }
}

function populateUserInfo(user) {
  const userEmail = user?.email || '';
  const nameEl = document.getElementById('userName');
  const initialEl = document.getElementById('userInitial');
  if (nameEl && userEmail) nameEl.textContent = userEmail.split('@')[0];
  if (initialEl && userEmail) initialEl.textContent = userEmail[0].toUpperCase();
}

// Initialize session check
checkSession();

// Listen for auth state changes globally
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && isAdminPage && !isLoginPage) {
    window.location.replace('login.html');
  } else if (event === 'SIGNED_IN' && isLoginPage) {
    window.location.replace('dashboard.html');
  }
});

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('[name="email"]').value.trim();
    const password = loginForm.querySelector('[name="password"]').value;
    const errEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (errEl) {
        errEl.textContent = error.message;
        errEl.classList.add('is-visible');
      }
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
    } else {
      window.location.href = 'dashboard.html';
    }
  });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
  });
}
