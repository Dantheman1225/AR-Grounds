/* ================================================
   Grounds Maintenance — admin.js
   Full CRUD admin UI using localStorage backend stub.
   Wire to real API by replacing localStorage calls
   with fetch('/api/...') calls.
   ================================================ */

(function () {
  'use strict';

  // ── HELPERS ──────────────────────────────────────────────────────────────
  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function badgeFor(status) {
    const map = { new:'badge-new', quoted:'badge-quoted', booked:'badge-booked', done:'badge-done', paid:'badge-paid', sent:'badge-sent', overdue:'badge-overdue' };
    return `<span class="badge ${map[status] || 'badge-new'}">${status || 'new'}</span>`;
  }

  function getLeads() {
    try { return JSON.parse(localStorage.getItem('ar_submissions') || '[]'); } catch(_) { return []; }
  }

  function saveLeads(leads) {
    localStorage.setItem('ar_submissions', JSON.stringify(leads));
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  // ── MODAL SYSTEM ─────────────────────────────────────────────────────────
  function createModal(title, bodyHTML, onSave) {
    // Remove any existing modal
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

    document.getElementById('modalSave').onclick = () => {
      if (onSave(modal)) modal.remove();
    };
  }

  function leadFormHTML(lead) {
    const v = (k) => lead[k] || '';
    return `
      <div class="admin-form" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="admin-field">
          <label>First Name *</label>
          <input type="text" id="lf_first_name" value="${v('first_name')}" placeholder="John" required>
        </div>
        <div class="admin-field">
          <label>Last Name</label>
          <input type="text" id="lf_last_name" value="${v('last_name')}" placeholder="Smith">
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
        <div class="admin-field" style="grid-column:1/-1">
          <label>Photos (before/after job photos)</label>
          <div class="upload-zone" id="leadPhotoZone" style="cursor:pointer;padding:24px;">
            <input type="file" id="leadPhotoInput" accept="image/*" multiple style="display:none">
            <div class="upload-zone-icon"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-camera" viewBox="0 0 16 16">
  <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z"/>
  <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"/>
</svg></div>
            <div class="upload-zone-title">Drop photos or click to add</div>
            <div class="upload-zone-sub">Photos will be attached to this lead</div>
          </div>
          <div id="leadPhotoPreview" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-top:8px;"></div>
        </div>
      </div>
    `;
  }

  function collectLeadForm() {
    const get = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    const fn = get('lf_first_name');
    const phone = get('lf_phone');
    if (!fn) { alert('First name is required.'); return null; }
    if (!phone) { alert('Phone number is required.'); return null; }
    return {
      first_name: fn,
      last_name: get('lf_last_name'),
      name: `${fn} ${get('lf_last_name')}`.trim(),
      phone,
      email: get('lf_email'),
      address: get('lf_address'),
      service: get('lf_service'),
      status: get('lf_status') || 'new',
      message: get('lf_message'),
    };
  }

  function wirePhotoUpload() {
    const zone = document.getElementById('leadPhotoZone');
    const input = document.getElementById('leadPhotoInput');
    const preview = document.getElementById('leadPhotoPreview');
    if (!zone || !input || !preview) return;

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      showPreviews(Array.from(e.dataTransfer.files));
    });
    input.addEventListener('change', () => showPreviews(Array.from(input.files)));

    function showPreviews(files) {
      files.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = document.createElement('img');
          img.src = ev.target.result;
          img.style.cssText = 'width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;border:1px solid var(--admin-border);';
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // ── OPEN NEW LEAD MODAL ───────────────────────────────────────────────────
  function openNewLeadModal() {
    createModal('Add New Lead', leadFormHTML({}), (modal) => {
      const data = collectLeadForm();
      if (!data) return false;
      const leads = getLeads();
      leads.push({ ...data, id: genId(), submitted_at: new Date().toISOString() });
      saveLeads(leads);
      loadDashboard();
      loadLeads();
      return true;
    });
    // Wire after render
    setTimeout(wirePhotoUpload, 50);
  }

  // ── OPEN EDIT LEAD MODAL ──────────────────────────────────────────────────
  function openEditLeadModal(id) {
    const leads = getLeads();
    const lead = leads.find(l => l.id === id);
    if (!lead) return alert('Lead not found.');

    createModal('Edit Lead', leadFormHTML(lead), (modal) => {
      const data = collectLeadForm();
      if (!data) return false;
      const idx = leads.findIndex(l => l.id === id);
      if (idx > -1) {
        leads[idx] = { ...leads[idx], ...data };
        saveLeads(leads);
        loadDashboard();
        loadLeads();
      }
      return true;
    });
    setTimeout(wirePhotoUpload, 50);
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  function loadDashboard() {
    const leads = getLeads();
    const countEl = document.getElementById('statNewLeads');
    if (countEl) countEl.textContent = leads.filter(l => !l.status || l.status === 'new').length || '0';

    const tbody = document.getElementById('recentLeadsBody');
    if (!tbody) return;

    if (leads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="admin-empty">
          <div class="admin-empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-people" viewBox="0 0 16 16">
  <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
</svg></div>
          <div class="admin-empty-title">No leads yet</div>
          <div class="admin-empty-sub">Quote requests will appear here.</div>
        </div></td></tr>`;
      return;
    }

    tbody.innerHTML = [...leads].reverse().slice(0, 5).map((s) => `
      <tr>
        <td><strong>${s.first_name || s.name || '—'} ${s.last_name || ''}</strong></td>
        <td><a href="tel:${s.phone}" style="color:var(--admin-accent-light)">${s.phone || '—'}</a></td>
        <td>${s.service || '—'}</td>
        <td>${s.address || '—'}</td>
        <td>${badgeFor(s.status || 'new')}</td>
        <td>${formatDate(s.submitted_at)}</td>
        <td><button class="admin-btn admin-btn-ghost admin-btn-sm" data-edit="${s.id}">Edit</button></td>
      </tr>
    `).join('');

    // Wire edit buttons
    tbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openEditLeadModal(btn.dataset.edit));
    });

    // Update lead badge count in sidebar
    const badge = document.getElementById('newLeadCount');
    if (badge) badge.textContent = leads.filter(l => !l.status || l.status === 'new').length;
  }

  // ── LEADS PAGE ────────────────────────────────────────────────────────────
  function loadLeads() {
    const leads = getLeads();
    const tbody = document.getElementById('leadsBody');
    if (!tbody) return;

    if (leads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="admin-empty">
          <div class="admin-empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-people" viewBox="0 0 16 16">
  <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
</svg></div>
          <div class="admin-empty-title">No leads yet</div>
          <div class="admin-empty-sub">Add your first lead manually or connect the quote form to the backend.</div>
        </div></td></tr>`;
      return;
    }

    tbody.innerHTML = [...leads].reverse().map((s) => `
      <tr>
        <td><strong>${s.first_name || s.name || '—'} ${s.last_name || ''}</strong></td>
        <td><a href="tel:${s.phone}" style="color:var(--admin-accent-light)">${s.phone || '—'}</a></td>
        <td>${s.service || '—'}</td>
        <td>${s.address || '—'}</td>
        <td>${badgeFor(s.status || 'new')}</td>
        <td>${formatDate(s.submitted_at)}</td>
        <td style="white-space:nowrap">
          <button class="admin-btn admin-btn-ghost admin-btn-sm" data-edit="${s.id}"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
</svg> Edit</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" data-delete="${s.id}" style="margin-left:6px"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
</svg></button>
        </td>
      </tr>
    `).join('');

    // Wire edit
    tbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openEditLeadModal(btn.dataset.edit));
    });

    // Wire delete
    tbody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this lead? This cannot be undone.')) return;
        const leads = getLeads().filter(l => l.id !== btn.dataset.delete);
        saveLeads(leads);
        loadLeads();
        loadDashboard();
      });
    });

    // Update count badge
    const badge = document.getElementById('newLeadCount');
    if (badge) badge.textContent = leads.filter(l => !l.status || l.status === 'new').length;
  }

  // ── ROUTE-BASED INIT ──────────────────────────────────────────────────────
  const path = window.location.pathname;
  if (path.includes('dashboard')) loadDashboard();
  if (path.includes('leads')) loadLeads();

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
