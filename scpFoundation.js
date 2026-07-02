import { storage } from './utils/storage.js';
import { UI } from './utils/ui.js';
import { AIService } from './services/aiService.js';
import { AudioService } from './services/audioService.js';
import { BreachService } from './services/breachService.js';
import { SCPManager } from './scpManager.js';
import { MTFManager } from './mtfManager.js';
import { ExperimentManager } from './experimentManager.js';
import { BlueprintManager } from './blueprintManager.js';
import { BattleManager } from './battleManager.js';
import { ProjectManager } from './projectManager.js';
import { RequestManager } from './requestManager.js';
import { PersonnelManager } from './personnelManager.js';
import { GOIManager } from './goiManager.js';

export class SCPFoundation {
    constructor() {
        this.scps = storage.load('scps', []);
        this.blueprints = storage.load('blueprints', []);
        this.settings = storage.load('settings', {});
        this.casualties = storage.load('casualties', 0);
        this.xkEvents = storage.load('xkEvents', []);
        this.reputation = storage.load('reputation', 100);
        this.storage = storage;
        this.ui = new UI();
        this.ai = new AIService();
        this.audio = new AudioService();
        this.scp = new SCPManager(this);
        this.mtf = new MTFManager(this);
        this.experiments = new ExperimentManager(this);
        this.blueprint = new BlueprintManager(this);
        this.battle = new BattleManager(this);
        this.projects = new ProjectManager(this);
        this.request = new RequestManager(this);
        this.personnel = new PersonnelManager(this);
        this.goi = new GOIManager(this);
        this.init();
    }

    init() {
        this.setupUIMode();
        this.bindEvents();
        this.loadSettings();
        this.scp.updateStats();
        this.scp.renderRecent();
        this.scp.renderArchive();
        this.mtf.renderList();
        this.blueprint.renderList();
        this.battle.setupSelects();
        this.renderOps();
        this.updateReputation();
        this.audio.setup(this.ui);
        this.updateMusicDisplay();

        // Apply persisted mobile nav collapse state if present
        const nav = document.querySelector('.nav');
        const collapsed = localStorage.getItem('navCollapsed') === 'true';
        if (nav && collapsed) {
            nav.classList.add('collapsed');
            const btn = document.getElementById('navCollapseBtn');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        }
        this.breach = new BreachService(this);
        this.breach.start();
        this.projects.renderList();
        this.request.start();
        this.personnel.renderList();
        this.personnel.updateClearanceSelects();
        this.goi.renderList();
        this.goi.startInvasionSystem();


    }

    // Hide the initial loading overlay (called when player confirms platform)
    hideLoadingOverlay(delay = 400) {
      try {
        setTimeout(() => {
          const overlay = document.getElementById('loadingOverlay');
          if (overlay) {
            overlay.classList.add('hidden');
            // remove from DOM after transition to avoid accidental focus traps
            setTimeout(() => { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 700);
          }
        }, delay);
      } catch (e) { /* non-fatal if DOM not present */ }
    }

    setupUIMode() {
        const saved = localStorage.getItem('uiMode');
        if (saved) this.ui.applyMode(saved, true);
    }

    applyUIMode(mode, silent=false) { this.ui.applyMode(mode, silent); }

    bindEvents() {
        document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.audio.play('click');
                this.ui.navigate(e.currentTarget.dataset.page);
            });
        });
        document.getElementById('chooseMobile')?.addEventListener('click', () => { this.audio.play('success'); this.applyUIMode('mobile'); this.hideLoadingOverlay(); });
        document.getElementById('choosePC')?.addEventListener('click', () => { this.audio.play('success'); this.applyUIMode('pc'); this.hideLoadingOverlay(); });
        // Persistent quick-switch buttons in nav to change UI on-the-fly
        document.getElementById('switchToMobile')?.addEventListener('click', () => { this.audio.play('success'); this.applyUIMode('mobile'); });
        document.getElementById('switchToPC')?.addEventListener('click', () => { this.audio.play('success'); this.applyUIMode('pc'); });

        document.getElementById('scpForm').addEventListener('submit', (e) => this.scp.create(e));
        document.getElementById('mtfForm').addEventListener('submit', (e) => this.mtf.create(e));
        document.getElementById('blueprintForm').addEventListener('submit', (e) => this.blueprint.create(e));
        document.getElementById('genBlueprintAI').addEventListener('click', () => this.blueprint.generateAI());
        document.getElementById('settingsForm').addEventListener('submit', (e) => this.saveSettings(e));
        document.getElementById('clearData').addEventListener('click', () => this.clearAllData());

        document.getElementById('searchInput').addEventListener('input', () => this.scp.filter());
        document.getElementById('classFilter').addEventListener('change', () => this.scp.filter());

        document.getElementById('musicToggle').addEventListener('click', () => this.audio.toggle());
        document.getElementById('sfxToggle').addEventListener('click', () => this.audio.toggleSFX());
        document.getElementById('modalClose').addEventListener('click', () => { this.audio.play('click'); this.ui.closeModal(); });
        document.getElementById('genSCPImage').addEventListener('click', () => this.scp.generateImage());
        document.getElementById('deployTemplate')?.addEventListener('click', () => this.mtf.deployTemplate());

        // Instant detection for special "2026" SCP name as user types
        const scpNameInput = document.getElementById('scpName');
        if (scpNameInput) {
          scpNameInput.addEventListener('input', (e) => {
            try { this.scp.checkNameFor2026(e.target.value); } catch (err) { /* ignore if manager not ready */ }
          });
        }
        // Quick deploy bindings for other creation forms
        document.getElementById('deployScpTemplate')?.addEventListener('click', () => this.scp.deployTemplate());
        const bpTemplateEl = document.getElementById('bpTemplate');
        if (bpTemplateEl) bpTemplateEl.addEventListener('change', () => {});
        document.getElementById('deployBpTemplate')?.addEventListener('click', () => this.blueprint.deployTemplate());
        const projTemplateEl = document.getElementById('projTemplate');
        if (projTemplateEl) projTemplateEl.addEventListener('change', () => {});
        document.getElementById('deployProjTemplate')?.addEventListener('click', () => this.projects.deployTemplate());
        const perTemplateEl = document.getElementById('perTemplate');
        if (perTemplateEl) perTemplateEl.addEventListener('change', () => {});
        document.getElementById('deployPerTemplate')?.addEventListener('click', () => this.personnel.deployTemplate());
        const goiTemplateEl = document.getElementById('goiTemplate');
        if (goiTemplateEl) goiTemplateEl.addEventListener('change', () => {});
        document.getElementById('deployGoiTemplate')?.addEventListener('click', () => this.goi.deployTemplate());

        const projectFormEl = document.getElementById('projectForm');
        if (projectFormEl) projectFormEl.addEventListener('submit', (e) => this.projects.create(e));
        const personnelFormEl = document.getElementById('personnelForm');
        if (personnelFormEl) personnelFormEl.addEventListener('submit', (e) => this.personnel.create(e));
        const customClearanceFormEl = document.getElementById('customClearanceForm');
        if (customClearanceFormEl) customClearanceFormEl.addEventListener('submit', (e) => this.personnel.createCustomClearance(e));
        const goiFormEl = document.getElementById('goiForm');
        if (goiFormEl) goiFormEl.addEventListener('submit', (e) => this.goi.create(e));
        document.getElementById('createCustomClass')?.addEventListener('click', () => this.createCustomClass());
        // Festive mode toggle immediate binding
        document.getElementById('festiveMode')?.addEventListener('change', (e) => { this.toggleFestive(!!e.target.checked); });
    // Add custom class creation form elements if they don't exist
    this.updateCustomClassDisplay();
    this.updateSCPClassOptions();
        document.getElementById('exportFoundation').addEventListener('click', () => this.exportFoundation());
        document.getElementById('importFoundationBtn').addEventListener('click', () => { this.audio.play('click'); document.getElementById('importFoundation').click(); });
        document.getElementById('importFoundation').addEventListener('change', (e) => {
          const file = e.target.files?.[0]; if (file) this.importFoundation(file);
        });
        document.getElementById('uploadMusicBtn')?.addEventListener('click', () => { this.audio.play('click'); document.getElementById('uploadMusicInput').click(); });
        document.getElementById('uploadMusicInput')?.addEventListener('change', (e) => {
          const file = e.target.files?.[0]; if (file) this.uploadCustomMusic(file);
        });
        document.getElementById('clearMusicBtn')?.addEventListener('click', () => { this.clearCustomMusic(); });
        document.getElementById('triggerXKEvent')?.addEventListener('click', () => { this.audio.play('click'); this.triggerXKEvent(); });
        document.getElementById('battleScp1')?.addEventListener('change', () => this.battle.updateInfo(1));
        document.getElementById('battleScp2')?.addEventListener('change', () => this.battle.updateInfo(2));
        document.getElementById('startBattle')?.addEventListener('click', () => { this.audio.play('battle_start'); this.battle.simulate(); });
        document.getElementById('tutorialBtn')?.addEventListener('click', () => { this.audio.play('click'); this.openTutorial(); });
        document.getElementById('loreBtn')?.addEventListener('click', () => { this.audio.play('experiment_start'); this.generateLore(); });
        document.getElementById('screenshotMode')?.addEventListener('change', (e) => { this.settings.screenshotMode = e.target.checked; this.storage.save('settings', this.settings); });
        document.getElementById('compactMode')?.addEventListener('change', (e) => { this.settings.compactMode = e.target.checked; this.storage.save('settings', this.settings); if (e.target.checked) document.body.classList.add('compact'); else document.body.classList.remove('compact'); });
        document.getElementById('animationSpeed')?.addEventListener('change', (e) => { this.settings.animationSpeed = e.target.value; this.storage.save('settings', this.settings); document.documentElement.style.setProperty('--anim-speed', e.target.value === 'fast' ? '0.15s' : e.target.value === 'slow' ? '1s' : '0.3s'); });

        // Mobile nav collapse toggle (visible in mobile UI)
        const navCollapseBtn = document.getElementById('navCollapseBtn');
        const navEl = document.querySelector('.nav');
        const anchor = document.createElement('div');
        anchor.className = 'nav-collapse-anchor';
        anchor.innerHTML = '<div class="collapse-handle" tabindex="0">▴ Menu</div>';
        document.body.appendChild(anchor);
        // Clicking either button toggles collapsed state
        function setNavCollapsed(collapsed) {
            if (!navEl) return;
            navEl.classList.toggle('collapsed', collapsed);
            localStorage.setItem('navCollapsed', collapsed ? 'true' : 'false');
            if (navCollapseBtn) navCollapseBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            anchor.style.display = collapsed ? 'block' : 'none';
        }
        navCollapseBtn?.addEventListener('click', (e) => {
            this.audio.play('click');
            const currently = navEl?.classList.contains('collapsed');
            setNavCollapsed(!currently);
        });
        // handle anchor (mini handle) to re-open nav when collapsed
        anchor.addEventListener('click', () => {
            this.audio.play('click');
            setNavCollapsed(false);
        });
        anchor.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); this.audio.play('click'); setNavCollapsed(false); }
        });
    }

    viewSCP(id) { this.scp.view(id); }
    viewMTF(id) { this.mtf.view(id); }
    viewBlueprint(id) { this.blueprint.view(id); }
    viewProject(id) { this.projects.view(id); }

    loadSettings() {
        if (this.settings.name) {
            document.getElementById('foundationName').textContent = this.settings.name.toUpperCase();
            document.getElementById('foundationNameInput').value = this.settings.name;
        }
        if (this.settings.motto) {
            document.querySelector('.motto').textContent = this.settings.motto;
            document.getElementById('foundationMotto').value = this.settings.motto;
        }
        if (this.settings.theme) {
            this.applyTheme(this.settings.theme, true);
        } else {
            const savedTheme = localStorage.getItem('theme') || 'default';
            this.applyTheme(savedTheme, true);
        }
        // Apply persisted festive mode if present so mobile/PC loads correct UI on start
        const festiveModeToggle = document.getElementById('festiveMode');
        if (this.settings.festiveMode) {
            if (festiveModeToggle) festiveModeToggle.checked = true;
            document.body.classList.add('festive');
            // ensure festive music is active after audio service setups
            try { this.audio.setCustomMusic(localStorage.getItem('customMusicUrl') || 'background_music.mp3'); } catch (e) {}
        } else {
            if (festiveModeToggle) festiveModeToggle.checked = false;
            document.body.classList.remove('festive');
        }
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = this.settings.theme || 'default';
        }
        const diffSelect = document.getElementById('difficultySelect');
        if (diffSelect) {
            diffSelect.value = this.settings.difficulty || 'normal';
        }
        const autoSaveToggle = document.getElementById('autoSaveToggle');
        if (autoSaveToggle) {
            autoSaveToggle.checked = this.settings.autoSave ?? true;
        }
        const breachNotifToggle = document.getElementById('breachNotifToggle');
        if (breachNotifToggle) {
            breachNotifToggle.checked = this.settings.breachNotifications ?? true;
        }
        const screenshotModeToggle = document.getElementById('screenshotMode');
        if (screenshotModeToggle) {
            screenshotModeToggle.checked = this.settings.screenshotMode ?? false;
        }
        const compactModeToggle = document.getElementById('compactMode');
        if (compactModeToggle) {
            compactModeToggle.checked = this.settings.compactMode ?? false;
        }
        const animSpeed = document.getElementById('animationSpeed');
        if (animSpeed) {
            animSpeed.value = this.settings.animationSpeed || 'normal';
        }
        const unlimitedRepToggle = document.getElementById('unlimitedRepToggle');
        if (unlimitedRepToggle && this.settings.unlimitedReputation) {
            unlimitedRepToggle.style.display = 'block';
            unlimitedRepToggle.checked = this.settings.unlimitedReputation ?? false;
        }
        this.setupPuzzle();
    }

    applyTheme(theme, silent=false) {
        document.body.classList.remove('theme-cyan', 'theme-amber', 'theme-purple', 'theme-emerald');
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
        localStorage.setItem('theme', theme);
        if (!silent) this.ui.toast(`Theme changed to ${theme === 'default' ? 'Default' : theme.charAt(0).toUpperCase() + theme.slice(1)}`);
    }

    saveSettings(e) {
        e.preventDefault();
        const selectedTheme = document.getElementById('themeSelect')?.value || 'default';
        this.settings = {
            name: document.getElementById('foundationNameInput').value || 'SCP Foundation',
            motto: document.getElementById('foundationMotto').value || 'Secure. Contain. Protect.',
            theme: selectedTheme,
            difficulty: document.getElementById('difficultySelect')?.value || 'normal',
            autoSave: document.getElementById('autoSaveToggle')?.checked ?? true,
            breachNotifications: document.getElementById('breachNotifToggle')?.checked ?? true,
            created: this.settings.created || new Date().toISOString()
        };
        this.storage.save('settings', this.settings);
        this.applyTheme(selectedTheme);
        this.loadSettings();
        this.ui.toast('Settings saved');
        this.audio.play('success');
    }

    clearAllData() {
        if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
            // Core data
            localStorage.removeItem('scps');
            localStorage.removeItem('mtfs');
            localStorage.removeItem('settings');
            localStorage.removeItem('casualties');
            localStorage.removeItem('experiments');

            // Extended systems
            localStorage.removeItem('blueprints');
            localStorage.removeItem('projects');
            localStorage.removeItem('personnel');
            localStorage.removeItem('gois');
            localStorage.removeItem('ops');
            localStorage.removeItem('reputation');
            localStorage.removeItem('stolenSCPs');
            localStorage.removeItem('customClearanceLevels');
            localStorage.removeItem('customClasses');
            localStorage.removeItem('customMusicUrl');

            this.scps = [];
            this.blueprints = [];
            this.settings = {};
            this.casualties = 0;
            this.reputation = 100;

            location.reload();
        } else {
            this.audio.play('failure');
        }
    }

    addCasualties(n = 1) {
      this.casualties = (this.casualties || 0) + n;
      this.storage.save('casualties', this.casualties);
      this.scp.updateStats();
      this.renderOps();
      this.modifyReputation(-Math.round(n / 5));
    }

    modifyReputation(delta) {
      if (this.settings.unlimitedReputation) {
        this.reputation = 200; // Always max when unlimited mode is on
      } else {
        this.reputation = Math.max(0, Math.min(200, (this.reputation || 100) + delta));
      }
      this.storage.save('reputation', this.reputation);
      this.updateReputation();
    }

    updateReputation() {
      const repDisplay = document.getElementById('reputationDisplay');
      if (repDisplay) {
        repDisplay.textContent = this.reputation || 100;
        repDisplay.style.color = this.reputation >= 150 ? '#4CAF50' : this.reputation >= 100 ? 'var(--primary)' : '#FF9800';
      }
    }

    exportFoundation() {
      const data = {
        scps: this.scps,
        mtfs: this.storage.load('mtfs', []),
        settings: this.settings,
        casualties: this.casualties,
        experiments: this.storage.load('experiments', []),
        blueprints: this.blueprints || [],
        projects: this.storage.load('projects', []),
        personnel: this.storage.load('personnel', []),
        gois: this.storage.load('gois', []),
        ops: this.storage.load('ops', []),
        reputation: this.reputation,
        stolenSCPs: this.storage.load('stolenSCPs', []),
        customClearanceLevels: this.storage.load('customClearanceLevels', []),
        customClasses: this.storage.load('customClasses', [])
      };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = `foundation_${Date.now()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      this.ui.toast('Foundation saved');
      this.audio.play('success');
    }

    importFoundation(file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);

          // Core entities
          this.scps = data.scps || [];
          this.storage.save('scps', this.scps);

          this.casualties = data.casualties || 0;
          this.storage.save('casualties', this.casualties);

          this.storage.save('mtfs', data.mtfs || []);
          this.settings = data.settings || {};
          this.storage.save('settings', this.settings);
          this.storage.save('experiments', data.experiments || []);

          // Extended systems (backwards compatible with older backups)
          this.blueprints = data.blueprints || [];
          this.storage.save('blueprints', this.blueprints);

          this.storage.save('projects', data.projects || []);
          this.storage.save('personnel', data.personnel || []);
          this.storage.save('gois', data.gois || []);
          this.storage.save('ops', data.ops || []);
          this.storage.save('stolenSCPs', data.stolenSCPs || []);
          this.storage.save('customClearanceLevels', data.customClearanceLevels || []);
          this.storage.save('customClasses', data.customClasses || []);

          this.reputation = typeof data.reputation === 'number' ? data.reputation : (this.reputation || 100);
          this.storage.save('reputation', this.reputation);

          // Rehydrate UI
          this.loadSettings();
          this.updateReputation();
          this.scp.updateStats();
          this.scp.renderRecent();
          this.scp.renderArchive();
          // ensure battle arena selects refresh after import
          try { this.battle.setupSelects(); } catch (e) {}
          this.mtf.renderList();
          this.blueprint.renderList();
          this.projects.renderList();
          this.personnel.renderList();
          this.goi.renderList();
          this.renderOps();
          this.personnel.updateClearanceSelects();
          if (this.updateCustomClassDisplay) this.updateCustomClassDisplay();
          if (this.updateSCPClassOptions) this.updateSCPClassOptions();

          this.ui.toast('Foundation loaded');
          this.audio.play('success');
        } catch {
          this.ui.toast('Invalid backup file');
          this.audio.play('failure');
        }
      };
      reader.readAsText(file);
    }

    renderOps() {
      const ops = this.storage.load('ops', []);
      const container = document.getElementById('opsList');
      if (!container) return;
      container.innerHTML = ops.length ? ops.slice(0,6).map(op => {
        const when = new Date(op.created).toLocaleString();
        const title = op.type === 'containment' ? `Containment ${op.success ? 'Success' : 'Failure'}` : op.type === 'xk' ? 'XK-Class Event' : 'Breach';
        const scp = this.scps.find(s=>s.id===op.scpId);
        const scpTitle = scp ? `SCP-${scp.number}: ${scp.name}` : `Event #${op.scpId}`;
        return `<div class="scp-card">
          <h4>${title}</h4>
          <p><strong>${scpTitle}</strong></p>
          <p><strong>Casualties:</strong> ${op.casualties||0}</p>
          <p style="color:var(--text-muted);">${when}</p>
        </div>`;
      }).join('') : '<p class="empty-state">No operations yet.</p>';
    }

    uploadCustomMusic(file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        localStorage.setItem('customMusicUrl', dataUrl);
        this.audio.setCustomMusic(dataUrl);
        this.ui.toast('Custom music uploaded and set as active');
        this.audio.play('success');
        this.updateMusicDisplay();
      };
      reader.onerror = () => {
        this.ui.toast('Failed to load audio file');
        this.audio.play('failure');
      };
      reader.readAsDataURL(file);
    }

    clearCustomMusic() {
      localStorage.removeItem('customMusicUrl');
      this.audio.clearCustomMusic();
      this.ui.toast('Music reset to default');
      this.audio.play('success');
      this.updateMusicDisplay();
    }

    updateMusicDisplay() {
      const hasCustom = localStorage.getItem('customMusicUrl');
      const display = document.getElementById('currentMusicDisplay');
      if (display) {
        display.innerHTML = hasCustom ? '<em>✓ Custom audio loaded</em>' : '<em>Using default music</em>';
      }
    }

    // Toggle festive UI and associated music immediately
    toggleFestive(enabled) {
      this.settings.festiveMode = !!enabled;
      this.storage.save('settings', this.settings);
      if (enabled) {
        document.body.classList.add('festive');
        // load a festive music track (use default background as festive loop) and play a short fanfare
        try {
          // attempt to set the bgm to the main synth loop (loop-friendly)
          this.audio.setCustomMusic('background_music.mp3');
          // play a celebratory fanfare once
          this.audio.play('battle_start');
        } catch (e) {
          console.error('Festive music error', e);
        }
        this.ui.toast('Festive Mode enabled');
      } else {
        document.body.classList.remove('festive');
        // restore default music
        this.clearCustomMusic();
        this.ui.toast('Festive Mode disabled');
      }
      this.updateMusicDisplay();
    }

    createCustomClass() {
      const name = document.getElementById('customClassName').value.trim();
      const desc = document.getElementById('customClassDesc').value.trim();

      if (!name) {
        this.ui.toast('Please enter a class name');
        this.audio.play('failure');
        return;
      }

      const classes = this.storage.load('customClasses', []);
      if (classes.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        this.ui.toast('Class already exists');
        this.audio.play('failure');
        return;
      }

      classes.push({ id: Date.now(), name, desc });
      this.storage.save('customClasses', classes);
      document.getElementById('customClassName').value = '';
      document.getElementById('customClassDesc').value = '';
      this.updateCustomClassDisplay();
      this.updateSCPClassOptions();
      this.ui.toast(`Custom class "${name}" created`);
      this.audio.play('success');
    }

    updateCustomClassDisplay() {
      const container = document.getElementById('customClassList');
      if (!container) return;
      const classes = this.storage.load('customClasses', []);
      if (!classes.length) {
        container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;"><em>Custom classes will appear here</em></p>';
        return;
      }

      // deterministic color from text (name + desc) -> HSL
      function stringToHsl(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        // pick saturation and lightness to work on dark theme
        const s = 65;
        const l = 55;
        return `hsl(${h}deg ${s}% ${l}%)`;
      }

      // Ensure older entries get a persisted color so they show icons immediately
      let mutated = false;
      const updatedClasses = classes.map(c => {
        const seed = `${c.name}::${c.desc || ''}`;
        const color = c.color || stringToHsl(seed);
        if (!c.color) {
          c.color = color;
          mutated = true;
        }
        return c;
      });
      if (mutated) this.storage.save('customClasses', updatedClasses);

      container.innerHTML = updatedClasses.map(c => {
        const color = c.color || stringToHsl(`${c.name}::${c.desc || ''}`);
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--surface);border-radius:8px;margin-bottom:8px;border-left:3px solid ${color};">
            <div style="width:36px;height:36px;border-radius:8px;background:${color};display:inline-flex;align-items:center;justify-content:center;color:var(--background);font-weight:800;font-family:inherit;">
              ${(c.name || '?').charAt(0).toUpperCase()}
            </div>
            <div style="flex:1;">
              <p style="margin:0;font-weight:700;color:var(--primary);">${c.name}</p>
              ${c.desc ? `<p style="margin:4px 0 0 0;font-size:0.9rem;color:var(--text-muted);">${c.desc}</p>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    updateSCPClassOptions() {
      const selects = document.querySelectorAll('#scpClass, #editScpClass');
      const customClasses = this.storage.load('customClasses', []);
      // For each select, ensure every custom class has an option (add missing ones).
      selects.forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        customClasses.forEach(c => {
          // only add if not already present
          if (!select.querySelector(`option[value="${c.name}"]`)) {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = c.name;
            opt.setAttribute('data-custom', 'true');
            select.appendChild(opt);
          } else {
            // mark existing custom options with data attribute if missing (helps future checks)
            const existing = select.querySelector(`option[value="${c.name}"]`);
            if (existing && !existing.hasAttribute('data-custom')) existing.setAttribute('data-custom', 'true');
          }
        });
        // restore previous selection if possible
        try { select.value = currentValue; } catch (e) {}
      });
    }

    setupPuzzle() {
      const container = document.getElementById('puzzleButtons');
      if (!container) return;
      
      // Generate 17 buttons with numbers 0-16 (adds a "0" button)
      container.innerHTML = '';
      for (let i = 0; i <= 16; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'puzzle-btn';
        btn.style.cssText = 'padding:20px;background:var(--surface);border:2px solid var(--border);color:var(--text);cursor:pointer;border-radius:8px;font-weight:700;transition:all 0.2s;';
        btn.dataset.num = i;
        btn.addEventListener('click', () => this.handlePuzzleClick(i));
        container.appendChild(btn);
      }

      // input buffer for hidden sequences (e.g., 2026 / 2025)
      this.puzzleInputBuffer = '';
      // Allow users to build a custom sequence by clicking buttons before starting
      this.puzzleSequence = []; // user-built sequence
      this.puzzleBuilding = true; // true while user can choose numbers
      this.puzzleActive = false;
      this.puzzleProgress = 0;

      // configure controls
      const startBtn = document.getElementById('startPuzzle');
      const resetBtn = document.getElementById('resetPuzzle');
      if (startBtn) {
        // Toggle behavior: when in building mode, Start locks the sequence and begins memorization;
        // when sequence is empty it will prompt user to compose one.
        startBtn.addEventListener('click', () => this.startPuzzle());
      }
      if (resetBtn) resetBtn.addEventListener('click', () => this.resetPuzzle());
      document.getElementById('unlockUnlimited')?.addEventListener('click', () => this.enableUnlimitedReputation());

      // Visual hint of current built sequence
      const status = document.getElementById('puzzleStatus');
      if (status) status.textContent = 'Build sequence: (click numbers) — Current: ' + (this.puzzleSequence.length ? this.puzzleSequence.join(' → ') : 'None');
    }

    startPuzzle() {
      // If there's no user-built sequence, require the user to build one instead of generating randomly
      if (!this.puzzleSequence || !this.puzzleSequence.length) {
        this.ui.toast('Compose your sequence by clicking the number buttons first.');
        this.audio.play('failure');
        return;
      }

      // Lock the user-built sequence and switch into active memorization/validation mode
      this.puzzleActive = true;
      this.puzzleBuilding = false;
      this.puzzleProgress = 0;

      const display = document.getElementById('puzzleStatus');
      if (display) display.textContent = `Pattern: ${this.puzzleSequence.join(' → ')}`;
      document.getElementById('startPuzzle').disabled = true;
      this.ui.toast('Memorize the pattern, then click in order!');
      this.audio.play('experiment_start');

      // After 5 seconds, hide the pattern so player must rely on memory
      setTimeout(() => {
        if (this.puzzleActive && document.getElementById('puzzleStatus')) {
          document.getElementById('puzzleStatus').textContent = 'Pattern: ?';
        }
      }, 5000);
    }

    handlePuzzleClick(num) {
      // Always record input buffer for hidden code detection
      this.puzzleInputBuffer = (this.puzzleInputBuffer || '') + String(num);
      if (this.puzzleInputBuffer.length > 10) this.puzzleInputBuffer = this.puzzleInputBuffer.slice(-10);

      // Secret sequences still detected regardless of mode
      if (this.puzzleInputBuffer.endsWith('2026') || this.puzzleInputBuffer.endsWith('2025') || this.puzzleInputBuffer.endsWith('1987')) {
        const is2026 = this.puzzleInputBuffer.endsWith('2026');
        const is1987 = this.puzzleInputBuffer.endsWith('1987');
        const santaClass = is2026 ? 'Safe' : 'Keter';
        const santaNumber = is2026 ? '2026' : (is1987 ? '1987' : '2025');
        const santaName = is2026 ? 'Santa Claus (Festive Anomaly)' : (is1987 ? 'SCP-1987 — THE NIGHT SHIFT' : 'Santa Claus (Corrupted Anomaly)');
        const containment = is2026
          ? 'Standard containment: Provide a secure, cheer-free holding cell with controlled gifting suppression. Rotate two Level-2 memetic scrubbers on 31st December to avoid contagion of celebratory memetics.'
          : is1987
            ? 'Containment: Store inertized animatronic components in a Faraday-lined containment locker with continuous audiovisual white-noise dampeners. Night-shift testing only in an isolated chamber with no fewer than three observers via remote feed; all personnel must undergo memetic desensitization before exposure.'
            : 'High-security containment: Isolate in a reinforced chronomemetic vault; all contact requires O5 approval and triple memetic dampening. Any unapproved celebration around the object must be terminated.';
        const description = is2026
          ? 'An anomaly manifesting as a jovial, gift-giving entity that induces benevolent probability shifts within a narrow temporal window. Pleasant but memetically contagious.'
          : is1987
            ? `SCP-1987 appears as a set of early-era animatronic components and a patched "Puppet" shell salvaged from defunct entertainment hardware. When unobserved or during nocturnal hours, the assembly animates and stalks darkened corridors; it exhibits an adaptive behavior pattern that mimics found footage and stage routines, then escalates to predatory actions targeting isolated staff. Exposure often causes vivid auditory hallucinations (children singing out-of-phase) and acute memory gaps for the last observed hour.`
            : 'Anomalous figure resembling cultural gift-bringer tropes but exhibiting aggressive reality-warping behavior; highly dangerous and unpredictable.';

        const scp = {
          id: Date.now(),
          number: santaNumber,
          name: santaName,
          class: is1987 ? 'Euclid' : santaClass,
          containment,
          description,
          image: '',
          anomalyType: is1987 ? 'Mechanical/Memetic' : 'Memetic/Temporal',
          primaryAbility: is2026 ? 'Localized benevolent probability alteration' : (is1987 ? 'Reactive animatronic predation & memetic shock' : 'Corrupted reality alteration & memetic escalation'),
          dangerLevel: is2026 ? 3 : (is1987 ? 7 : 10),
          state: 'Contained',
          created: new Date().toISOString()
        };

        this.scps.unshift(scp);
        this.storage.save('scps', this.scps);
        this.scp.updateStats();
        this.scp.renderRecent();
        this.scp.renderArchive();
        try { this.battle.setupSelects(); } catch (e) {}

        this.audio.play('success');
        this.ui.toast(`Secret code detected: SCP-${scp.number} "${scp.name}" created (${scp.class})`);
        this.audio.play('experiment_start');

        // special behavior: if it's the 2026 festive unlock, grant unlimited rep and show reward
        if (is2026) {
          this.puzzleActive = false;
          this.puzzleProgress = 0;
          this.puzzleSequence = [];
          document.getElementById('puzzleReward').style.display = 'block';
          document.getElementById('startPuzzle').disabled = false;
          this.enableUnlimitedReputation();
        }

        // For 1987, reveal a themed notification but do not auto-unlock unlimited reputation
        if (is1987) {
          // reveal reward area briefly and enable a themed modal hint
          try {
            document.getElementById('puzzleReward').style.display = 'block';
            setTimeout(() => { document.getElementById('puzzleReward').style.display = 'none'; }, 8000);
          } catch (e) {}
        }

        this.puzzleInputBuffer = '';
        return;
      }

      // If still in building mode, append clicked number to user's custom sequence
      if (this.puzzleBuilding) {
        // Append to user's sequence and update status text
        this.puzzleSequence = this.puzzleSequence || [];
        this.puzzleSequence.push(num);
        const status = document.getElementById('puzzleStatus');
        if (status) status.textContent = 'Build sequence: (click numbers) — Current: ' + this.puzzleSequence.join(' → ');
        this.audio.play('click');
        return;
      }

      // Normal active puzzle check (user must replicate the locked sequence)
      if (!this.puzzleActive) return;

      const btn = document.querySelector(`[data-num="${num}"]`);
      if (!btn) return;

      // Visual feedback
      btn.style.background = 'var(--primary)';
      btn.style.color = 'var(--background)';
      this.audio.play('click');
      setTimeout(() => {
        btn.style.background = 'var(--surface)';
        btn.style.color = 'var(--text)';
      }, 150);

      if (num === this.puzzleSequence[this.puzzleProgress]) {
        this.puzzleProgress++;
        if (this.puzzleProgress === this.puzzleSequence.length) {
          this.puzzleActive = false;
          this.audio.play('success');
          document.getElementById('puzzleReward').style.display = 'block';
          document.getElementById('startPuzzle').disabled = false;
          this.ui.toast('🎉 Puzzle solved! Unlimited Reputation mode unlocked!');
        }
      } else {
        this.puzzleActive = false;
        this.audio.play('failure');
        document.getElementById('puzzleStatus').textContent = '✗ Wrong! Try again.';
        document.getElementById('startPuzzle').disabled = false;
        this.ui.toast('Wrong sequence. Try again!');
      }
    }

    resetPuzzle() {
      this.puzzleActive = false;
      this.puzzleProgress = 0;
      this.puzzleSequence = [];
      this.puzzleBuilding = true;
      this.puzzleInputBuffer = ''; // clear secret input buffer as well
      const status = document.getElementById('puzzleStatus');
      if (status) status.textContent = 'Build sequence: (click numbers) — Current: None';
      document.getElementById('puzzleReward').style.display = 'none';
      document.getElementById('startPuzzle').disabled = false;
      this.audio.play('click');
    }

    enableUnlimitedReputation() {
      this.settings.unlimitedReputation = true;
      this.storage.save('settings', this.settings);

      // Immediately set reputation to max and persist so UI reflects the change
      this.reputation = 200;
      this.storage.save('reputation', this.reputation);
      this.updateReputation();

      this.ui.toast('✓ Unlimited Reputation Mode Enabled!');
      this.audio.play('success');
      document.getElementById('unlockUnlimited').disabled = true;
      document.getElementById('unlockUnlimited').textContent = '✓ Unlocked';
    }

    openTutorial() {
      const tutorial = `
        <div style="max-height:70vh;overflow-y:auto;">
          <h2 style="margin-bottom:16px;">📖 Quickstart & Updated Tutorial</h2>

          <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin-bottom:12px;">
            <h3 style="color:var(--primary);margin-bottom:8px;">1) Start Fast</h3>
            <p>Create a few SCPs and at least one MTF immediately. Quick Deploy templates (Create SCP / Create MTF) let you add lore-friendly entries in seconds so you can test systems right away.</p>
          </div>

          <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin-bottom:12px;">
            <h3 style="color:var(--primary);margin-bottom:8px;">2) Personnel & Investigations</h3>
            <p>Hire researchers and security staff in Personnel. Investigations require a researcher; running one uses the AI to generate an in-universe report (320–450 words) and saves it to Investigations for review.</p>
          </div>

          <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin-bottom:12px;">
            <h3 style="color:var(--primary);margin-bottom:8px;">3) Breaches, Containment & Recontainment</h3>
            <p>Breaches occur over time based on class and difficulty. Use MTF teams to attempt containment; success is computed from class base, MTF strength, and modifiers (Thaumiel SCPs give +15%). Containment attempts log detailed AI summaries and update casualty and ops records in real time.</p>
          </div>

          <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin-bottom:12px;">
            <h3 style="color:var(--primary);margin-bottom:8px;">4) Groups of Interest — Invasions & Recovery</h3>
            <p>GOIs periodically attempt invasions. If they steal an SCP it becomes "stolen" (not deleted) and you get a 120-second recovery window to deploy MTFs. Successful recoveries return the SCP; failures can permanently lose it. You can also attack GOIs to take back stolen SCPs.</p>
          </div>

          <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin-bottom:12px;">
            <h3 style="color:var(--primary);margin-bottom:8px;">5) Blueprints, Projects & Assignments</h3>
            <p>Create facility blueprints to host SCPs and run Projects to coordinate research teams. Use "Add SCP" inside a project or blueprint to assign items; Project deletion is permanent and can be performed from the project view.</p>
          </div>

          <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin-bottom:12px;">
            <h3 style="color:var(--primary);margin-bottom:8px;">6) Battle Arena</h3>
            <p>Pit two SCPs (includes Safe-class) to run an AI-analyzed simulation. The result gives a detailed battle report with phases, reasons, and a victor; outcomes affect reputation. Use this to evaluate threats and interactions before committing resources.</p>
          </div>

          <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin-bottom:12px;">
            <h3 style="color:var(--primary);margin-bottom:8px;">7) Neutralization & Experiments</h3>
            <p>Neutralize contained SCPs (chance depends on class). Experiments can be recorded manually or AI-assisted; AI experiments give better rewards and faster narrative results.</p>
          </div>

          <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin-bottom:12px;">
            <h3 style="color:var(--primary);margin-bottom:8px;">8) Reputation & Operations</h3>
            <p>Reputation (0–200) affects containment outcomes indirectly. Positive actions raise rep, failures reduce it. Check the Operations Log for the latest incidents and use it to prioritize responses.</p>
          </div>

          <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin-bottom:12px;">
            <h3 style="color:var(--primary);margin-bottom:8px;">9) Mobile UI & Nav</h3>
            <p>Choose Mobile or PC at startup. On mobile you can collapse the bottom nav to a compact handle; tap the handle to reopen. The UI syncs many lists in real time—no full-page refresh needed to see new SCPs, breaches, or stolen/recovered items.</p>
          </div>

          <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin-bottom:12px;">
            <h3 style="color:var(--primary);margin-bottom:8px;">SCP Classes Explained</h3>
            <p style="font-size:0.95rem;line-height:1.5;margin-bottom:8px;">
              Safe — Objects that are easily and reliably contained under standard procedures; generally non-hostile and predictable. Use these for research, display, or secure storage.
            </p>
            <p style="font-size:0.95rem;line-height:1.5;margin-bottom:8px;">
              Euclid — Anomalies that are not fully understood or are unpredictable under some conditions; they require active containment and monitoring because their behavior can vary.
            </p>
            <p style="font-size:0.95rem;line-height:1.5;margin-bottom:8px;">
              Keter — Highly dangerous or difficult-to-contain anomalies whose behavior frequently results in breaches or large-scale hazards; require heavy resources and permanent containment effort.
            </p>
            <p style="font-size:0.95rem;line-height:1.5;margin-bottom:8px;">
              Thaumiel — Assets classified as Thaumiel are used by the Foundation to counteract or contain other anomalies; they are strategic resources and often grant bonuses to containment operations.
            </p>
            <p style="font-size:0.95rem;line-height:1.5;margin-bottom:8px;">
              Apollyon — Catastrophic, near-impossible-to-contain phenomena that pose existential threats; extremely rare and usually associated with global-scale events.
            </p>
            <p style="font-size:0.95rem;line-height:1.5;margin-bottom:8px;">
              Archon — Rare strategic or reality-affecting entities that often operate at a high level of influence or control; powerful and tactically significant.
            </p>
            <p style="font-size:0.95rem;line-height:1.5;margin-bottom:8px;">
              Esoteric — Unusual, abstruse, or hard-to-categorize anomalies with specialized behaviors; they may require bespoke containment strategies and creative research.
            </p>
            <p style="font-size:0.95rem;line-height:1.5;margin-bottom:8px;">
              Neutralized — An SCP that has been rendered inert or permanently deactivated; neutralized entries are removed from active operations and cannot participate in battles or events.
            </p>
          </div>

          <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin-bottom:12px;">
            <h3 style="color:var(--primary);margin-bottom:8px;">10) Quick Tips</h3>
            <ul style="margin-left:20px;line-height:1.6;">
              <li>Create 2–3 MTFs with varied equipment to respond to different threats.</li>
              <li>Keep at least one Thaumiel-class asset active if available for containment bonuses.</li>
              <li>Use Quick Deploy templates to populate your collection for testing.</li>
              <li>You can upload custom background music or reset to default in Settings.</li>
              <li>Export/Import your foundation to backup or share your progress.</li>
              <li>Use Investigations to get rich, AI-generated 320–450 word reports from assigned scientists.</li>
              <li>Monitor the Operations Log and respond fast to GOI invasions (90s defense window) and thefts (120s recovery window).</li>
            </ul>
          </div>

          <div style="text-align:center;margin-top:8px;color:var(--text-muted);font-size:0.9rem;">
            <p>Good luck, Director — Secure, Contain, Protect.</p>
          </div>
        </div>
      `;
      this.ui.openModal(tutorial);
    }

    async generateLore() {
      try {
        // Include all SCPs (neutralized or not) when generating lore
        const allScps = (this.scps || []).map(s => ({
          number: s.number || 'Unknown',
          name: s.name || 'Unnamed',
          class: s.class || 'Unclassified',
          primaryAbility: s.primaryAbility || '',
          dangerLevel: s.dangerLevel || '',
          description: s.description || ''
        }));

        if (!allScps.length) {
          this.ui.openModal(`<h3>Lore</h3><p class="empty-state">No SCP entries available to build lore from.</p>`);
          return;
        }

        this.ui.toast('Generating foundation lore (about 10s)...');
        const lore = await this.ai.generateLore({ scps: allScps, foundationName: this.settings.name || 'SCP Foundation' });

        this.ui.openModal(`
          <h3>Foundation Lore Dossier</h3>
          <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:10px;"><em>Auto-generated, long-form dossier combining your active SCPs</em></p>
          <div style="max-height:65vh;overflow-y:auto;padding:12px;background:var(--surface-light);border-radius:8px;white-space:pre-wrap;font-size:0.95rem;line-height:1.6;">
${lore}
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button id="closeLore" class="btn-primary">Close</button>
            <button id="exportLore" class="btn-primary">Export Text</button>
          </div>
        `);

        document.getElementById('closeLore').onclick = () => { this.audio.play('click'); this.ui.closeModal(); };
        document.getElementById('exportLore').onclick = () => {
          const blob = new Blob([lore], { type: 'text/plain' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `foundation_lore_${Date.now()}.txt`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 5000);
          this.ui.toast('Lore exported');
          this.audio.play('success');
        };
      } catch (e) {
        this.ui.toast('Lore generation failed');
        this.audio.play('failure');
      }
    }

    triggerXKEvent() {
      const xkTypes = [
        { name: 'XK-Class End-of-Death Scenario', desc: 'All dead entities are reanimating.' },
        { name: 'CK-Class Restructuring Scenario', desc: 'Reality is being fundamentally altered.' },
        { name: 'NK-Class Extinction Event', desc: 'All life on Earth is being terminated.' },
        { name: 'SK-Class Dominance Shift', desc: 'New entity claims dominance over humanity.' },
        { name: 'AK-Class Consensus Collapse', desc: 'Baseline reality consensus is breaking down.' }
      ];
      const selected = xkTypes[Math.floor(Math.random() * xkTypes.length)];
      const casualties = Math.round(Math.random() * 500 + 100);
      this.addCasualties(casualties);
      const ops = this.storage.load('ops', []);
      ops.unshift({ type: 'xk', scpId: Date.now(), xkType: selected.name, casualties, created: new Date().toISOString() });
      this.storage.save('ops', ops);
      this.ui.toast(`${selected.name} initiated! ${casualties} casualties.`);
      this.audio.play('alarm');
      this.renderOps();
      this.ui.openModal(`
        <h3>${selected.name}</h3>
        <p><strong>Description:</strong> ${selected.desc}</p>
        <p><strong>Estimated Casualties:</strong> ${casualties}</p>
        <p style="margin-top:12px;color:var(--text-muted);"><em>All available Thaumiel SCPs and MTF units should be mobilized immediately.</em></p>
        <button id="xkAck" class="btn-primary" style="margin-top:12px;">Acknowledge</button>
      `);
      document.getElementById('xkAck').onclick = () => { this.audio.play('click'); this.ui.closeModal(); };
    }
}