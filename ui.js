export class UI {
  applyMode(mode, silent=false) {
    document.body.classList.remove('mobile','pc');
    document.body.classList.add(mode);
    localStorage.setItem('uiMode', mode);
    const m = document.getElementById('modeModal');
    if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden','true'); }

    // Mobile nav collapse control: show on mobile, hide on PC.
    const navCollapseBtn = document.getElementById('navCollapseBtn');
    const navEl = document.querySelector('.nav');
    let anchor = document.querySelector('.nav-collapse-anchor');

    // Ensure anchor exists so users can reopen the nav when collapsed.
    if (!anchor) {
      anchor = document.createElement('div');
      anchor.className = 'nav-collapse-anchor';
      anchor.innerHTML = '<div class="collapse-handle" tabindex="0">▴ Menu</div>';
      document.body.appendChild(anchor);
      // Click/keyboard handlers for anchor
      anchor.addEventListener('click', () => {
        if (navEl) navEl.classList.remove('collapsed');
        if (navCollapseBtn) navCollapseBtn.setAttribute('aria-expanded', 'true');
        anchor.style.display = 'none';
      });
      anchor.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); if (navEl) navEl.classList.remove('collapsed'); if (navCollapseBtn) navCollapseBtn.setAttribute('aria-expanded','true'); anchor.style.display = 'none'; }
      });
    }

    if (mode === 'pc') {
      if (navCollapseBtn) navCollapseBtn.style.display = 'none';
      if (anchor) anchor.style.display = 'none';
      if (navEl) navEl.classList.remove('collapsed'); // ensure full nav visible on PC
    } else {
      // Mobile: show the collapse button and apply persisted collapsed state
      if (navCollapseBtn) navCollapseBtn.style.display = '';
      const collapsed = localStorage.getItem('navCollapsed') === 'true';
      if (navEl) navEl.classList.toggle('collapsed', collapsed);
      if (navCollapseBtn) navCollapseBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      if (anchor) anchor.style.display = collapsed ? 'block' : 'none';
    }

    if (!silent) this.toast(`${mode === 'mobile' ? 'Mobile' : 'PC'} UI enabled`);
  }
  toast(msg) {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(()=> t.classList.add('show'));
    setTimeout(()=> { t.classList.remove('show'); setTimeout(()=> t.remove(), 300); }, 2000);
  }
  openModal(html) {
    const m = document.getElementById('modal');
    document.getElementById('modalBody').innerHTML = html;
    m.classList.add('open'); m.setAttribute('aria-hidden','false');
    // ensure modal content is scrollable and focusable for previews
    document.getElementById('modalBody').querySelectorAll('button, img, input, textarea').forEach(el => el.setAttribute('tabindex','0'));

    // add overlay click handler to allow closing when clicking outside modal-content
    this._onOverlayClick = (ev) => {
      // if click happened directly on the overlay (not inside modal-content), close
      if (ev.target === m) this.closeModal();
    };
    m.addEventListener('click', this._onOverlayClick);
  }
  closeModal() {
    const m = document.getElementById('modal');
    m.classList.remove('open'); m.setAttribute('aria-hidden','true');
    if (this._onOverlayClick) { m.removeEventListener('click', this._onOverlayClick); this._onOverlayClick = null; }
  }
  navigate(page) {
    if (!page) return;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const pageEl = document.getElementById(page); if (!pageEl) return;
    pageEl.classList.add('active');
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  }
}