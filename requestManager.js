export class RequestManager {
  constructor(app) {
    this.app = app;
    this.isActive = true;
    this.queue = []; // queued request objects
    // create a non-blocking request banner container (fixed, bottom-right)
    this._ensureBannerContainer();
  }

  _ensureBannerContainer() {
    if (document.getElementById('requestBannerContainer')) return;
    const container = document.createElement('div');
    container.id = 'requestBannerContainer';
    container.style.cssText = 'position:fixed;right:16px;bottom:90px;display:flex;flex-direction:column;gap:10px;z-index:1200;max-width:360px;';
    document.body.appendChild(container);
  }

  start() {
    // Random request appears less frequently: now roughly every 60-180 seconds and with a reduced chance to spawn
    const scheduleNext = () => {
      const delay = Math.random() * 120000 + 60000; // 60s - 180s (increased)
      this.timer = setTimeout(() => {
        if (this.isActive && Math.random() < 0.4) { // reduced to 40% chance to spawn a request when the timer fires
          this.triggerRequest();
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  stop() {
    this.isActive = false;
    clearTimeout(this.timer);
  }

  triggerRequest() {
    // Define requests and a weight for each so we can bias selection.
    // Lower weights for personnel/mtf entries to make them appear less frequently.
    const requests = [
      { type: 'personnel', title: 'Personnel Request', text: 'Dr. Bright requests permission to experiment on a Safe-class SCP. Grant authorization?', rewardYes: 3, rewardNo: 0, weight: 0.6 },
      { type: 'mtf', title: 'MTF Standby', text: 'MTF Epsilon-11 requires 48-hour rest and re-supply. Approve standby status?', rewardYes: 2, rewardNo: -5, weight: 0.6 },
      { type: 'research', title: 'Research Proposal', text: 'Site director proposes new containment wing. Allocate funding (+5 rep if approved)?', rewardYes: 5, rewardNo: 0, weight: 1.0 },
      { type: 'ethics', title: 'Ethics Committee', text: 'Ethics Committee flags containment procedures. Revise protocols (+2 rep for compliance)?', rewardYes: 2, rewardNo: -3, weight: 1.0 },
      { type: 'breach', title: 'Breach Response', text: 'Potential containment weakness detected. Immediate remediation needed (+4 rep if approved)?', rewardYes: 4, rewardNo: -8, weight: 0.9 },
      { type: 'personnel2', title: 'Personnel Transfer', text: 'Top researcher requests transfer to another site. Allow transfer (-2 rep if approved)?', rewardYes: -2, rewardNo: 1, weight: 0.7 },
      { type: 'budget', title: 'Budget Review', text: 'Council requests budget optimization. Reduce MTF operations funding (-4 rep if approved)?', rewardYes: -4, rewardNo: -2, weight: 1.0 },
      { type: 'test', title: 'Field Test', text: 'Propose testing new containment equipment on a Euclid SCP. Approve test?', rewardYes: 3, rewardNo: 0, weight: 1.0 }
    ];

    // Weighted random selection helper
    const totalWeight = requests.reduce((sum, r) => sum + (r.weight || 1), 0);
    let pick = Math.random() * totalWeight;
    let chosen = requests[0];
    for (let i = 0; i < requests.length; i++) {
      const r = requests[i];
      pick -= (r.weight || 1);
      if (pick <= 0) { chosen = r; break; }
    }

    const req = chosen;
    const requestId = Date.now();

    // push to queue so requests do not interrupt; render a non-blocking banner with actions
    const bannerData = { id: requestId, req };
    this.queue.push(bannerData);
    this._renderBanner(bannerData);
  }

  _renderBanner(bannerData) {
    const container = document.getElementById('requestBannerContainer');
    if (!container) return;

    const existing = document.getElementById(`request-banner-${bannerData.id}`);
    if (existing) return; // already shown

    const el = document.createElement('div');
    el.id = `request-banner-${bannerData.id}`;
    el.style.cssText = 'background:var(--surface);border:2px solid var(--border);padding:12px;border-radius:10px;color:var(--text);box-shadow:0 8px 24px rgba(0,0,0,0.3);';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div style="flex:1;">
          <div style="font-weight:700;color:var(--primary);margin-bottom:6px;">${bannerData.req.title}</div>
          <div style="font-size:0.95rem;color:var(--text-muted);margin-bottom:8px;">${bannerData.req.text}</div>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <button class="request-yes btn-primary" style="padding:8px 12px;font-size:0.85rem;">Yes (${bannerData.req.rewardYes >= 0 ? '+' : ''}${bannerData.req.rewardYes})</button>
            <button class="request-no btn-primary" style="padding:8px 12px;font-size:0.85rem;">No (${bannerData.req.rewardNo >= 0 ? '+' : ''}${bannerData.req.rewardNo})</button>
          </div>
        </div>
        <button class="request-dismiss" title="Dismiss" style="background:transparent;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;">✕</button>
      </div>
    `;

    // Attach handlers
    el.querySelector('.request-yes').addEventListener('click', () => {
      this.app.audio.play('success');
      this.app.modifyReputation(bannerData.req.rewardYes);
      this.app.ui.toast(`Request approved: ${bannerData.req.rewardYes >= 0 ? '+' : ''}${bannerData.req.rewardYes} reputation`);
      this._removeBanner(bannerData.id);
    });
    el.querySelector('.request-no').addEventListener('click', () => {
      this.app.audio.play('click');
      this.app.modifyReputation(bannerData.req.rewardNo);
      const msg = bannerData.req.rewardNo >= 0 ? `Request denied: +${bannerData.req.rewardNo} reputation` : `Request denied: ${bannerData.req.rewardNo} reputation`;
      this.app.ui.toast(msg);
      this._removeBanner(bannerData.id);
    });
    el.querySelector('.request-dismiss').addEventListener('click', () => {
      this.app.audio.play('click');
      this.app.ui.toast('Request dismissed (will remain in queue)');
      // simply hide for now but keep in queue so it can be reopened later if desired
      el.style.display = 'none';
    });

    container.appendChild(el);

    // auto-remove after 2.5 minutes to avoid permanent clutter
    setTimeout(() => {
      const node = document.getElementById(`request-banner-${bannerData.id}`);
      if (node) this._removeBanner(bannerData.id);
    }, 150000);
  }

  _removeBanner(id) {
    const el = document.getElementById(`request-banner-${id}`);
    if (el) el.remove();
    // remove from queue
    this.queue = this.queue.filter(q => q.id !== id);
  }
}

