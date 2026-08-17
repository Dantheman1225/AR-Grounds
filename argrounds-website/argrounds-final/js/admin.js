/* ================================================
   Grounds Maintenance — admin.js
   Full CRUD admin UI using real API endpoints.
   ================================================ */

import { supabase } from './auth.js';

(async function () {
  'use strict';

  let currentLeads = []; // Store leads in memory after fetching
  
  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  async function apiRequest(url, method = 'GET', body = null) {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (body) {
      config.body = JSON.stringify(body);
    }

    const res = await fetch(url, config);
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json();
  }

  async function fetchLeads() {
    try {
      const res = await apiRequest('/api/leads-list');
      currentLeads = res.leads || [];
      return currentLeads;
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      return [];
    }
  }

  // ── HELPERS ──────────────────────────────────────────────────────────────
  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function badgeFor(status) {
    const map = { new:'badge-new', quoted:'badge-quoted', booked:'badge-booked', done:'badge-done', paid:'badge-paid', sent:'badge-sent', overdue:'badge-overdue' };
    return `<span class="badge ${map[status] || 'badge-new'}">${status || 'new'}</span>`;
  }

  // ── MODAL SYSTEM ─────────────────────────────────────────────────────────
  function createModal(title, bodyHTML, onSave) {
    document.getElementById('adminModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'adminModal';
    modal.style.cssText = [
      'position:fixed;inset:0;z-index:9999;',
      'background:rgba(0,0,0,0.7);',
      'display:flex;align-items:center;justify-content:center;padding:20px;',
    ].join('');

    modal.innerHTML = `
      <div style="background:var(--admin-surface);border:1px solid var(--admin-border);border-radius:18px;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:22px 24px;border-bottom:1px solid var(--admin-border);">
          <h2 style="font-family:'Barlow Condensed',sans-serif;font-size:1.3rem;font-weight:800;color:#fff;margin:0;">${title}</h2>
          <button id="modalClose" style="background:none;border:none;color:var(--admin-muted);font-size:1.5rem;cursor:pointer;line-height:1;padding:4px 8px;">&times;</button>
        </div>
        <div style="padding:24px;" id="modalBody">
          ${bodyHTML}
        </div>
        <div style="padding:16px 24px;border-top:1px solid var(--admin-border);display:flex;gap:12px;justify-content:flex-end;">
          <button class="admin-btn admin-btn-ghost" id="modalCancel">Cancel</button>
          <button class="admin-btn admin-btn-primary" id="modalSave">Save Lead</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('modalClose').onclick  = () => modal.remove();
    document.getElementById('modalCancel').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('modalSave').onclick = async () => {
      const btn = document.getElementById('modalSave');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      const success = await onSave(modal);
      if (success) {
        modal.remove();
      } else {
        btn.disabled = false;
        btn.textContent = 'Save Lead';
      }
    };
  }

  function leadFormHTML(lead) {
    const v = (k) => lead[k] || '';
    // simple heuristic to split name
    let fn = lead.first_name || '';
    let ln = lead.last_name || '';
    if (!fn && !ln && lead.name) {
      const parts = lead.name.split(' ');
      fn = parts[0];
      ln = parts.slice(1).join(' ');
    }

    return `
      <div class="admin-form" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="admin-field">
          <label>First Name *</label>
          <input type="text" id="lf_first_name" value="${fn}" placeholder="John" required>
        </div>
        <div class="admin-field">
          <label>Last Name</label>
          <input type="text" id="lf_last_name" value="${ln}" placeholder="Smith">
        </div>
        <div class="admin-field">
          <label>Phone *</label>
          <input type="tel" id="lf_phone" value="${v('phone')}" placeholder="(501) 000-0000" required>
        </div>
        <div class="admin-field">
          <label>Email</label>
          <input type="email" id="lf_email" value="${v('email')}" placeholder="email@example.com">
        </div>
        <div class="admin-field" style="grid-column:1/-1">
          <label>Property Address</label>
          <input type="text" id="lf_address" value="${v('address')}" placeholder="123 Main St, Little Rock, AR 72201">
        </div>
        <div class="admin-field">
          <label>Service Requested</label>
          <select id="lf_service">
            <option value="">— Select —</option>
            <option value="driveway" ${v('service')==='driveway'?'selected':''}>Driveway Cleaning</option>
            <option value="sidewalk" ${v('service')==='sidewalk'?'selected':''}>Sidewalk Cleaning</option>
            <option value="bundle" ${v('service')==='bundle'?'selected':''}>Driveway + Walkway Bundle</option>
            <option value="unsure" ${v('service')==='unsure'?'selected':''}>Not sure</option>
          </select>
        </div>
        <div class="admin-field">
          <label>Status</label>
          <select id="lf_status">
            <option value="new" ${v('status')==='new'||!v('status')?'selected':''}>New</option>
            <option value="quoted" ${v('status')==='quoted'?'selected':''}>Quoted</option>
            <option value="booked" ${v('status')==='booked'?'selected':''}>Booked</option>
            <option value="done" ${v('status')==='done'?'selected':''}>Done</option>
          </select>
        </div>
        <div class="admin-field" style="grid-column:1/-1">
          <label>Notes</label>
          <textarea id="lf_message" rows="3" placeholder="Job notes, special instructions…" style="background:var(--admin-surface-2);border:1px solid var(--admin-border);border-radius:8px;padding:11px 14px;color:var(--admin-text);font-family:inherit;font-size:0.9rem;resize:vertical;width:100%">${v('message')}</textarea>
        </div>
      </div>
    `;
  }

  function collectLeadForm() {
    const get = (id) => document.getElementById(id)?.value.trim() || '';
    const fn = get('lf_first_name');
    const phone = get('lf_phone');
    if (!fn) { alert('First name is required.'); return null; }
    if (!phone) { alert('Phone number is required.'); return null; }
    return {
      name: `${fn} ${get('lf_last_name')}`.trim(),
      phone,
      email: get('lf_email'),
      address: get('lf_address'),
      service: get('lf_service'),
      status: get('lf_status') || 'new',
      message: get('lf_message'),
      source: 'manual'
    };
  }

  // ── OPEN NEW LEAD MODAL ───────────────────────────────────────────────────
  function openNewLeadModal() {
    createModal('Add New Lead', leadFormHTML({}), async (modal) => {
      const data = collectLeadForm();
      if (!data) return false;
      try {
        await apiRequest('/api/leads-create', 'POST', data);
        await reloadData();
        return true;
      } catch (e) {
        alert('Failed to save lead: ' + e.message);
        return false;
      }
    });
  }

  // ── OPEN EDIT LEAD MODAL ──────────────────────────────────────────────────
  function openEditLeadModal(id) {
    const lead = currentLeads.find(l => l.id === id);
    if (!lead) return alert('Lead not found.');

    createModal('Edit Lead', leadFormHTML(lead), async (modal) => {
      const data = collectLeadForm();
      if (!data) return false;
      try {
        data.id = id; // attach ID for update
        await apiRequest('/api/leads-update', 'PUT', data);
        await reloadData();
        return true;
      } catch (e) {
        alert('Failed to update lead: ' + e.message);
        return false;
      }
    });
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  async function loadDashboard() {
    const countEl = document.getElementById('statNewLeads');
    if (countEl) countEl.textContent = currentLeads.filter(l => !l.status || l.status === 'new').length;

    const tbody = document.getElementById('recentLeadsBody');
    if (!tbody) return;

    if (currentLeads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="admin-empty">
          <div class="admin-empty-icon">...</div>
          <div class="admin-empty-title">No leads yet</div>
          <div class="admin-empty-sub">Quote requests will appear here.</div>
        </div></td></tr>`;
      return;
    }

    tbody.innerHTML = currentLeads.slice(0, 5).map((s) => `
      <tr>
        <td><strong>${s.name || '—'}</strong></td>
        <td><a href="tel:${s.phone}" style="color:var(--admin-accent-light)">${s.phone || '—'}</a></td>
        <td>${s.service || '—'}</td>
        <td>${s.address || '—'}</td>
        <td>${badgeFor(s.status || 'new')}</td>
        <td>${formatDate(s.created_at)}</td>
        <td><button class="admin-btn admin-btn-ghost admin-btn-sm" data-edit="${s.id}">Edit</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openEditLeadModal(btn.dataset.edit));
    });

    const badge = document.getElementById('newLeadCount');
    if (badge) badge.textContent = currentLeads.filter(l => !l.status || l.status === 'new').length;
  }

  // ── LEADS PAGE ────────────────────────────────────────────────────────────
  async function loadLeads() {
    const tbody = document.getElementById('leadsBody');
    if (!tbody) return;

    if (currentLeads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="admin-empty">
          <div class="admin-empty-title">No leads yet</div>
          <div class="admin-empty-sub">Add your first lead manually or connect the quote form to the backend.</div>
        </div></td></tr>`;
      return;
    }

    tbody.innerHTML = currentLeads.map((s) => `
      <tr>
        <td><strong>${s.name || '—'}</strong></td>
        <td><a href="tel:${s.phone}" style="color:var(--admin-accent-light)">${s.phone || '—'}</a></td>
        <td>${s.service || '—'}</td>
        <td>${s.address || '—'}</td>
        <td>${badgeFor(s.status || 'new')}</td>
        <td>${formatDate(s.created_at)}</td>
        <td style="white-space:nowrap">
          <button class="admin-btn admin-btn-ghost admin-btn-sm" data-edit="${s.id}">Edit</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" data-did="${s.id}" style="margin-left:6px">Delete</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openEditLeadModal(btn.dataset.edit));
    });

    tbody.querySelectorAll('[data-did]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this lead? This cannot be undone.')) return;
        try {
          await apiRequest('/api/leads-delete?id=' + btn.dataset.did, 'DELETE');
          await reloadData();
        } catch (e) {
          alert('Failed to delete lead: ' + e.message);
        }
      });
    });

    const badge = document.getElementById('newLeadCount');
    if (badge) badge.textContent = currentLeads.filter(l => !l.status || l.status === 'new').length;
  }

  // Load Data and route
  async function reloadData() {
    await fetchLeads();
    const path = window.location.pathname;
    if (path.includes('dashboard')) loadDashboard();
    if (path.includes('leads')) loadLeads();
  }

  // Initial load
  await reloadData();

  // ── NEW LEAD BUTTON ───────────────────────────────────────────────────────
  // Works on both dashboard topbar and leads page
  ['newLeadBtn', 'newLeadBtnTop'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', openNewLeadModal);
  });

  // Also wire the "+ New Lead" link that currently goes to leads.html
  document.querySelectorAll('[data-new-lead]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); openNewLeadModal(); });
  });

  // ── SEARCH FILTER (leads page) ────────────────────────────────────────────
  const search = document.getElementById('leadSearch');
  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      document.querySelectorAll('#leadsBody tr').forEach((row) => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  // ── STATUS FILTER (leads page) ────────────────────────────────────────────
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      const val = statusFilter.value.toLowerCase();
      document.querySelectorAll('#leadsBody tr').forEach((row) => {
        row.style.display = (!val || row.textContent.toLowerCase().includes(val)) ? '' : 'none';
      });
    });
  }

  // ── MOBILE SIDEBAR TOGGLE (admin) ─────────────────────────────────────────
  const adminHamburger = document.getElementById('adminHamburger');
  const adminSidebar = document.querySelector('.admin-sidebar');
  if (adminHamburger && adminSidebar) {
    adminHamburger.addEventListener('click', () => {
      adminSidebar.classList.toggle('sidebar-open');
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!adminSidebar.contains(e.target) && e.target !== adminHamburger) {
        adminSidebar.classList.remove('sidebar-open');
      }
    });
  }

  // ── SETTINGS: Save to localStorage ───────────────────────────────────────
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    // Load saved values
    const saved = JSON.parse(localStorage.getItem('ar_settings') || '{}');
    settingsForm.querySelectorAll('[data-setting]').forEach(input => {
      const key = input.dataset.setting;
      if (saved[key] !== undefined) input.value = saved[key];
    });

    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const settings = {};
      settingsForm.querySelectorAll('[data-setting]').forEach(input => {
        settings[input.dataset.setting] = input.value;
      });
      localStorage.setItem('ar_settings', JSON.stringify(settings));

      // Show saved toast
      let toast = document.getElementById('settingsToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'settingsToast';
        toast.style.cssText = [
          'position:fixed;bottom:24px;right:24px;',
          'background:var(--admin-accent);color:#fff;',
          'padding:12px 20px;border-radius:10px;',
          'font-weight:700;font-size:0.9rem;',
          'box-shadow:0 8px 32px rgba(0,0,0,0.3);z-index:9999;',
          'transition:opacity 0.3s;',
        ].join('');
        document.body.appendChild(toast);
      }
      toast.textContent = '✓ Settings saved';
      toast.style.opacity = '1';
      setTimeout(() => { toast.style.opacity = '0'; }, 2500);
    });
  }

})();
