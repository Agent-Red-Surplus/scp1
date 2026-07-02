export class SCPManager {
  constructor(app) { this.app = app; }
  create(e) {
    e.preventDefault();
    const number = document.getElementById('scpNumber').value;
    const name = document.getElementById('scpName').value;
    const cls = document.getElementById('scpClass').value;
    let containment = document.getElementById('scpDescription').value.trim();
    const description = document.getElementById('scpDescription2').value;
    if (!containment) {
      this.app.ui.toast('Generating containment procedures...');
      this.app.ai.aiGenerateContainment({ number, name, cls, description }).then(text => {
        containment = text;
        document.getElementById('scpDescription').value = text;
        this._finalizeCreate({ number, name, cls, containment, description });
      }).catch(()=> this._finalizeCreate({ number, name, cls, containment, description }));
      return;
    }
    this._finalizeCreate({ number, name, cls, containment, description });
  }
  // Check SCP name in real-time for several secret triggers (2026, dingle) and optionally create special entries immediately.
  // This runs once per detected name entry to avoid repeated prompts while typing.
  async checkNameFor2026(nameText) {
    if (!nameText) return;
    const entered = nameText.toString().trim();
    // Prevent repeated prompts for the same value by using a temporary attribute on the input element
    const inputEl = document.getElementById('scpName');
    if (!inputEl) return;
    // already handled value stored as data-checked-name
    if (inputEl.dataset.checkedName === entered) return;
    inputEl.dataset.checkedName = entered;

    // Secret: "dingle" — create a lighthearted Quandale Dingle themed SCP
    if (/dingle/i.test(entered)) {
      const create = confirm('Detected "dingle" in the object name — create the special SCP inspired by Quandale Dingle now? OK to create, Cancel to ignore.');
      if (!create) return;

      const qName = 'Quandale Dingle — ANOMALOUS SUBJECT';
      const qNumber = entered.match(/\d+/)?.[0] || 'D-001';
      const qClass = 'Euclid';
      const qContainment = `Special Containment Procedures: SCP-${qNumber} is to be held in a standard humanoid containment cell with auditory dampeners installed. All incoming mail and gifts must be screened; personnel interacting with SCP-${qNumber} must undergo a memetic resilience briefing. Any attempts by the subject to broadcast catchphrases or viral-speech should be logged and scrubbed.`;
      const qDescription = `OVERVIEW:
SCP-${qNumber} appears to be a memetically infectious persona reminiscent of online cultural artifacts. The subject, self-styled "Quandale Dingle," exhibits a high propensity for generating anomalous social contagions—catchphrases, improbable coincidences, and localized attention cascades.

ANOMALOUS EFFECTS:
Exposure to recorded media authored by SCP-${qNumber} increases the probability of unrelated low-impact anomalous events within a 24‑hour window for exposed groups. Prolonged exposure may lead to compulsive mimicry and short-term memory blips.

RECOMMENDATIONS:
Maintain audiovisual isolation, limit distribution of recordings, and schedule supervised interviews only with Level-3 memetic clearance. Document and quarantine emergent catchphrases.`;

      const scp = {
        id: Date.now(),
        number: qNumber,
        name: qName,
        class: qClass,
        containment: qContainment,
        description: qDescription,
        image: document.getElementById('scpImage')?.value || '',
        anomalyType: 'Memetic/Social',
        primaryAbility: 'Memetic contagion and attention-modulated anomalies',
        dangerLevel: 4,
        state: 'Contained',
        created: new Date().toISOString()
      };

      this.app.scps.unshift(scp);
      this.app.storage.save('scps', this.app.scps);
      try { document.getElementById('scpForm').reset(); } catch (e) {}
      this.updateStats();
      this.renderRecent();
      this.renderArchive();
      try { this.app.battle.setupSelects(); } catch (e) {}

      this.app.audio.play('success');
      this.app.ui.toast(`Secret SCP created: SCP-${scp.number} "${scp.name}"`);
      return;
    }

    if (entered.includes('2026')) {
      const confirmCreate = confirm('Detected "2026" in the object name — create the special Apollyon New Year SCP-2026 now? OK to create themed Apollyon entry, Cancel to ignore.');
      if (!confirmCreate) return;

      // Reuse the same creation flow as the original special-case: create the Apollyon entry immediately
      const nyName = '2026 — NEW YEAR ANOMALY';
      const nyNumber = entered.match(/\d+/)?.[0] || '2026';
      const nyClass = 'Apollyon';
      const nyContainment = `Special Containment Procedures: This object is designated SCP-2026-A. Due to the reality-anchoring and temporal ceremonial properties of SCP-2026-A, all Foundation sites must enact a global, rotating containment observance protocol on 31st December UTC starting at 23:00 UTC. Containment teams are to set up redundant chronometric dampers and memetic dampeners. Interaction by personnel must be limited to scripted readings approved by O5 with at least two independent memetic scrubbers active. Never speak or broadcast the phrase "Year Reset" within 100m of the object except during authorized ritualized windows. Any attempts to celebrate the event outside approved parameters must be reported immediately.`;
      const nyDescription = `OVERVIEW:
SCP-2026 manifests annually in an ephemeral, ceremonially synchronous form coinciding with the calendar roll to 2026. It takes the form of a composite of cultural iconography from New Year's celebrations worldwide—fountains of light, resonant chimes, and a chorus of mechanized voices reciting well-wishes in overlapping languages. Observers report a profound mixture of euphoria and dissociation.

ANOMALOUS EFFECTS:
SCP-2026's primary anomaly is a temporal-linguistic resonance that "rewrites" localized probability distributions for a narrow window (approx. 7 minutes) around the transition moment, producing both improbable beneficial events (spontaneous repair, accelerated healing) and irreversible global-scale alterations to narrative memory pathways. It fosters memetic cohesion: groups engaged in synchronous celebration become linked via a faint, persistent memetic trace.

INCIDENT VIGNETTE:
During the 00:00 transition a site camera captured what appeared to be a miniature aurora forming above the containment chamber. Security footage recorded the site's PA system repeating a robotic phrase: "HAPPY NEW YEAR MY SCPS" in a cadence that persisted beyond the recorded event. Personnel on shift reported both vivid nostalgia and an inability to recall the names of two researchers for 48 hours; records restored by thaumaturgical audit.

ANALYSIS:
SCP-2026 seems to feed on aggregate celebratory attention, modulating local causality to satisfy emergent "resolutions." The paradoxical outcome—both benevolent and catastrophic—indicates SCP-2026's alignment with long-range narrative stability rather than simple malice. It is currently considered Apollyon due to the potential for widespread reality alteration if left unchecked.

RECOMMENDATIONS:
Maintain strict containment ritualization, limit public knowledge, and assign a cross-disciplinary task force (Thaumaturgy, Memetics, Chronology) to study safe harnessing protocols. Explore controlled, small-scale ceremonial experiments to map benefit windows without allowing narrative drift.`;

      const scp = { 
        id: Date.now(), 
        number: nyNumber, 
        name: nyName, 
        class: nyClass, 
        containment: nyContainment, 
        description: nyDescription,
        image: document.getElementById('scpImage')?.value || '',
        anomalyType: 'Temporal/Memetic/Ceremonial',
        primaryAbility: 'Calendar-synchronous reality alteration & memetic bonding',
        dangerLevel: 10,
        state: 'Contained', 
        created: new Date().toISOString() 
      };

      this.app.scps.unshift(scp);
      this.app.storage.save('scps', this.app.scps);
      // Reset form fields to reflect creation (but do not override unrelated inputs)
      try { document.getElementById('scpForm').reset(); } catch (e) {}
      this.updateStats();
      this.renderRecent();
      this.renderArchive();
      try { this.app.battle.setupSelects(); } catch (e) {}

      // Play a robotic TTS "happy new year my scps" using websim.textToSpeech if available
      try {
        if (window.websim && window.websim.textToSpeech) {
          const tts = await websim.textToSpeech({ text: "happy new year my scps", voice: "en-male" });
          if (tts && tts.url) {
            const t = new Audio(tts.url);
            t.volume = 0.95;
            t.play().catch(()=>{});
          }
        } else {
          this.app.audio.play('success');
        }
      } catch (e) {
        this.app.audio.play('success');
      }

      this.app.ui.toast('SCP-2026 (Apollyon) created — Happy New Year');
    }
  }

  async _finalizeCreate({ number, name, cls, containment, description }) {
    // Finalize creation: build SCP object, persist, refresh UI
    const scp = {
      id: Date.now(),
      number: (number || '').toString() || '000',
      name: name || 'Unnamed',
      class: cls || 'Euclid',
      containment: containment || '',
      description: description || '',
      image: document.getElementById('scpImage')?.value || '',
      anomalyType: document.getElementById('scpAnomalyType')?.value || '',
      primaryAbility: document.getElementById('scpPrimaryAbility')?.value || '',
      dangerLevel: parseInt(document.getElementById('scpDangerLevel')?.value || '5', 10),
      state: 'Contained',
      created: new Date().toISOString()
    };

    this.app.scps.unshift(scp);
    this.app.storage.save('scps', this.app.scps);

    try { document.getElementById('scpForm').reset(); } catch (e) {}

    // Refresh UI and derived systems
    this.app.scp.updateStats();
    this.app.scp.renderRecent();
    this.app.scp.renderArchive();
    try { this.app.battle.setupSelects(); } catch (e) {}

    this.app.ui.toast(`SCP-${scp.number} "${scp.name}" created`);
    this.app.audio.play('success');
  }

  renderRecent() {
    const container = document.getElementById('recentList');
    // Filter out neutralized SCPs from recent list
    const recent = this.app.scps.filter(s => s.class !== 'Neutralized').slice(0, 3);
    container.innerHTML = recent.length ? recent.map(s => this.cardHTML(s)).join('') :
      '<p class="empty-state">No SCPs created yet. Start by creating your first SCP!</p>';
  }

  deployTemplate() {
    const tpl = document.getElementById('scpTemplate')?.value;
    if (!tpl) { this.app.ui.toast('Select an SCP template'); return; }
    // Lore-inspired quick deploys using well-known SCPs
    const templates = {
      'friendly-safe': {
        number: '999',
        name: 'The Tickle Monster',
        class: 'Safe',
        description: 'A large, orange, amorphous entity that induces intense euphoria and laughter in those it contacts. Frequently used for morale and therapy.'
      },
      'euclid-humanoid': {
        number: '173',
        name: 'The Sculpture',
        class: 'Euclid',
        description: 'A concrete-and-rebar statue that moves at extreme speeds when not in direct line of sight, snapping the necks of nearby individuals.'
      },
      'keter-hostile': {
        number: '096',
        name: 'The Shy Guy',
        class: 'Keter',
        description: 'Humanoid entity that becomes uncontrollably hostile when its face is seen, relentlessly pursuing the observer until termination.'
      },
      'thaumiel-asset': {
        number: '2000',
        name: 'Deus Ex Machina',
        class: 'Thaumiel',
        description: 'Subterranean facility capable of reconstructing human civilization following an XK-Class end-of-the-world scenario.'
      }
    };
    const t = templates[tpl];
    if (!t) return;
    const scp = { 
      id: Date.now(), 
      number: t.number, 
      name: t.name, 
      class: t.class, 
      containment: `Auto-generated procedures for ${t.name}. Keep in specialized containment.`, 
      description: t.description,
      image: '',
      anomalyType: 'Unknown',
      primaryAbility: 'Unknown',
      dangerLevel: t.class === 'Keter' ? 9 : t.class === 'Euclid' ? 6 : 2,
      state: 'Contained', 
      created: new Date().toISOString() 
    };
    this.app.scps.unshift(scp);
    this.app.storage.save('scps', this.app.scps);
    this.app.ui.toast(`SCP-${scp.number} "${scp.name}" deployed`);
    this.app.audio.play('success');
    this.app.scp.updateStats();
    this.app.scp.renderRecent();
    this.app.scp.renderArchive();
    // refresh battle arena options immediately
    try { this.app.battle.setupSelects(); } catch (e) {}
  }
  renderArchive(list = this.app.scps) {
    const container = document.getElementById('archiveList');
    // Filter out neutralized SCPs from the archive
    const activeSCPs = list.filter(s => s.class !== 'Neutralized');
    container.innerHTML = activeSCPs.length ? activeSCPs.map(s => this.cardHTML(s)).join('') :
      '<p class="empty-state">No SCPs in archive</p>';
  }
  cardHTML(scp) {
    const assignedBP = (this.app.blueprints || []).find(b => (b.assignedSCPs || []).includes(scp.id));
    const facilityLabel = assignedBP ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-top:6px;">📍 ${assignedBP.name}</p>` : '';

    // Check for a matching custom class color
    const customClasses = this.app.storage.load('customClasses', []);
    const custom = customClasses.find(c => c.name === scp.class);
    const badgeStyle = custom ? `background: ${custom.color}; color: var(--background); border-radius:6px; padding:5px 10px; display:inline-block; font-weight:700;` : '';
    const badgeClass = custom ? '' : `class-${scp.class}`;

    return `
      <div class="scp-card ${scp.state==='Breached'?'breached':''}" onclick="app.audio.play('click'); app.viewSCP(${scp.id})">
        <h4>SCP-${scp.number}: ${scp.name}</h4>
        <span class="class-badge ${badgeClass}" style="${badgeStyle}">${scp.class}</span>
        ${scp.state==='Breached'?'<span class="status-badge">BREACHED</span>':''}
        <p>${scp.description.substring(0, 100)}...</p>
        ${facilityLabel}
      </div>`;
  }
  filter() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const classFilter = document.getElementById('classFilter').value;
    const filtered = this.app.scps.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search) || s.number.toLowerCase().includes(search);
      const matchesClass = !classFilter || s.class === classFilter;
      return matchesSearch && matchesClass;
    });
    this.renderArchive(filtered);
  }
  view(id) {
    const scp = this.app.scps.find(s => s.id === id);
    if (!scp) return;
    // Build class badge using custom class color if available
    const customClasses = this.app.storage.load('customClasses', []);
    const custom = customClasses.find(c => c.name === scp.class);
    const badgeStyle = custom ? `background: ${custom.color}; color: var(--background); border-radius:6px; padding:5px 10px; display:inline-block; font-weight:700;` : '';
    const badgeClass = custom ? '' : `class-${scp.class}`;

    this.app.ui.openModal(`
      <h3>SCP-${scp.number}: ${scp.name}</h3>
      <p><strong>Class:</strong> <span class="class-badge ${badgeClass}" style="${badgeStyle}">${scp.class}</span></p>
      <p><strong>Status:</strong> ${scp.state || 'Contained'}</p>
      ${scp.anomalyType ? `<p><strong>Type:</strong> ${scp.anomalyType}</p>` : ''}
      ${scp.primaryAbility ? `<p><strong>Primary Threat:</strong> ${scp.primaryAbility}</p>` : ''}
      ${scp.dangerLevel ? `<p><strong>Danger Level:</strong> ${scp.dangerLevel}/10</p>` : ''}
      ${scp.image ? `<img class="modal-image" src="${scp.image}" alt="SCP-${scp.number} image">` : ''}
      <h4>Special Containment Procedures</h4>
      <p>${scp.containment}</p>
      <h4>Description</h4>
      <p>${scp.description}</p>
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;">
        ${scp.state==='Breached'?'<button id="containOpen" class="btn-primary">Attempt Containment</button>':''}
        ${scp.state==='Contained'?`<button id="neutralizeOpen" class="btn-primary">Neutralize</button>`:'<button id="neutralizeOpen" class="btn-primary" disabled style="opacity:0.5;cursor:not-allowed;">Neutralize (Breached)</button>'}
        ${scp.state==='Contained'?'<button id="openExperiments" class="btn-primary">Experiments</button>':'<button id="openExperiments" class="btn-primary" disabled style="opacity:0.5;cursor:not-allowed;">Experiments (Breached)</button>'}
        ${scp.state==='Contained'?'<button id="investigateSCP" class="btn-primary">Investigation</button>':'<button id="investigateSCP" class="btn-primary" disabled style="opacity:0.5;cursor:not-allowed;">Investigation (Breached)</button>'}
        ${scp.state==='Contained'?'<button id="editSCP" class="btn-primary">Edit SCP</button>':'<button id="editSCP" class="btn-primary" disabled style="opacity:0.5;cursor:not-allowed;">Edit (Breached)</button>'}
      </div>
    `);
    if (scp.state==='Breached') document.getElementById('containOpen').onclick = () => { this.app.audio.play('click'); this.app.mtf.openContainDialog(scp.id); };
    if (scp.state==='Contained') {
      document.getElementById('neutralizeOpen').onclick = () => { this.app.audio.play('click'); this.neutralize(id); };
      document.getElementById('openExperiments').onclick = () => { this.app.audio.play('click'); this.app.experiments.openList(scp.id); };
      document.getElementById('investigateSCP').onclick = () => { this.app.audio.play('click'); this.openInvestigation(id); };
      document.getElementById('editSCP').onclick = () => { this.app.audio.play('click'); this.openEdit(id); };
    } else {
      document.getElementById('neutralizeOpen').onclick = () => { this.app.ui.toast('Cannot neutralize breached SCP'); this.app.audio.play('failure'); };
      document.getElementById('openExperiments').onclick = () => { this.app.ui.toast('Cannot experiment on breached SCP'); this.app.audio.play('failure'); };
      document.getElementById('editSCP').onclick = () => { this.app.ui.toast('Cannot edit breached SCP'); this.app.audio.play('failure'); };
      document.getElementById('investigateSCP').onclick = () => { this.app.ui.toast('Cannot investigate a breached SCP'); this.app.audio.play('failure'); };
    }
  }

  openInvestigation(id) {
    const scp = this.app.scps.find(s => s.id === id);
    if (!scp) return;

    const allPersonnel = this.app.storage.load('personnel', []);
    const scientists = allPersonnel.filter(p => {
      const role = (p.role || '').toLowerCase();
      const dept = (p.department || '').toLowerCase();
      return role.includes('research') || role.includes('scientist') || dept.includes('research');
    });

    if (!scientists.length) {
      this.app.ui.toast('You need at least one research/scientist personnel to run an investigation');
      this.app.audio.play('failure');
      return;
    }

    const html = `
      <h3>Assign Investigator for SCP-${scp.number}</h3>
      <p style="margin-bottom:10px;">Select a scientist or researcher to author the investigation report.</p>
      <div style="max-height:260px;overflow-y:auto;margin:10px 0;">
        ${scientists.map(p => `
          <label style="display:block;margin:6px 0;padding:6px 8px;border-radius:6px;background:var(--surface-light);">
            <input type="radio" name="investigator" value="${p.id}" style="margin-right:6px;">
            <strong>${p.name}</strong> — ${p.role} (${p.department}, ${p.clearance})
          </label>
        `).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        <button id="startInvestigation" class="btn-primary">Start Investigation</button>
        <button id="cancelInvestigation" class="btn-primary">Cancel</button>
      </div>
    `;
    this.app.ui.openModal(html);

    const cancelBtn = document.getElementById('cancelInvestigation');
    if (cancelBtn) cancelBtn.onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };

    const startBtn = document.getElementById('startInvestigation');
    if (startBtn) {
      startBtn.onclick = () => {
        const selectedId = parseInt(document.querySelector('input[name="investigator"]:checked')?.value || '0', 10);
        const scientist = scientists.find(p => p.id === selectedId);
        if (!scientist) {
          this.app.ui.toast('Select a scientist to continue');
          this.app.audio.play('failure');
          return;
        }
        this.app.audio.play('experiment_start');
        this.runInvestigation(scp, scientist);
      };
    }
  }

  async runInvestigation(scp, scientist) {
    this.app.ui.toast('Running in-depth investigation (about 10s)...');
    try {
      const report = await this.app.ai.generateInvestigationReport({ scp, scientist });

      const investigations = this.app.storage.load('investigations', []);
      const record = {
        id: Date.now(),
        scpId: scp.id,
        scientistId: scientist.id,
        scientistName: scientist.name,
        scientistRole: scientist.role,
        scientistDepartment: scientist.department || '',
        scientistClearance: scientist.clearance || '',
        created: new Date().toISOString(),
        report
      };
      investigations.unshift(record);
      this.app.storage.save('investigations', investigations);

      this.app.audio.play('success');
      this.app.ui.openModal(`
        <h3>Investigation Report — SCP-${scp.number}</h3>
        <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:8px;">
          Investigator: <strong>${scientist.name}</strong> (${scientist.role}, ${scientist.department}, ${scientist.clearance})<br>
          Generated: ${new Date(record.created).toLocaleString()}
        </p>
        <div style="max-height:55vh;overflow-y:auto;padding:12px;background:var(--surface-light);border-radius:8px;white-space:pre-wrap;font-size:0.95rem;line-height:1.6;">
${report}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button id="closeInvestigationReport" class="btn-primary">Close</button>
        </div>
      `);
      const closeBtn = document.getElementById('closeInvestigationReport');
      if (closeBtn) closeBtn.onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    } catch (e) {
      this.app.audio.play('failure');
      this.app.ui.toast('Investigation failed — AI service unavailable');
    }
  }
  neutralize(id) {
    const scp = this.app.scps.find(s => s.id === id);
    if (!scp) return;

    // Determine resistance chance based on class
    // Neutralization resistance by class (Apollyon nearly impossible, Archon & Esoteric highly resistant)
    const resistanceChance = { Safe: 0.0, Euclid: 0.2, Keter: 0.6, Thaumiel: 0.75, Apollyon: 0.95, Archon: 0.8, Esoteric: 0.7 }[scp.class] ?? 0.1;
    const willResist = Math.random() < resistanceChance;

    this.app.ui.openModal(`
      <h3>Neutralize SCP-${scp.number}?</h3>
      <p>Mark <strong>${scp.name}</strong> as neutralized. This cannot be easily undone.</p>
      ${resistanceChance > 0 ? `<p style="color:var(--text-muted);font-size:0.9rem;"><strong>Warning:</strong> ${(resistanceChance*100).toFixed(0)}% chance of resistance.</p>` : ''}
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button id="confirmNeutralize" class="btn-primary">Confirm Neutralize</button>
        <button id="cancelNeutralize" class="btn-primary">Cancel</button>
      </div>
    `);
    document.getElementById('confirmNeutralize').onclick = () => {
      this.app.audio.play('neutralization_attempt');
      
      if (willResist) {
        setTimeout(() => {
          this.app.audio.play('failure');
          this.app.ui.openModal(`
            <h3>Neutralization Failed</h3>
            <p>SCP-${scp.number} resisted neutralization protocols!</p>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-top:12px;">The entity's anomalous properties proved too powerful to suppress.</p>
            <button id="closeResist" class="btn-primary" style="margin-top:12px;">Close</button>
          `);
          document.getElementById('closeResist').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
        }, 600);
      } else {
        setTimeout(() => {
          this.app.audio.play('success');
          // Mark SCP as fully neutralized so it no longer appears in listings or battles
          scp.state = 'Neutralized';
          scp.class = 'Neutralized';
          this.app.storage.save('scps', this.app.scps);
          this.updateStats();
          this.renderArchive();
          this.renderRecent();
          // refresh battle arena options to remove neutralized entry
          try { this.app.battle.setupSelects(); } catch (e) {}
          this.app.ui.toast(`SCP-${scp.number} neutralized successfully`);
          this.app.modifyReputation(20);
          this.app.ui.closeModal();
        }, 600);
      }
    };
    document.getElementById('cancelNeutralize').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
  }
  openEdit(id) {
    const scp = this.app.scps.find(s => s.id === id);
    if (!scp) return;
    this.app.ui.openModal(`
      <h3>Edit SCP-${scp.number}</h3>
      <div class="form-group">
        <label>SCP Number</label>
        <input id="editScpNumber" value="${scp.number}">
      </div>
      <div class="form-group">
        <label>Object Name</label>
        <input id="editScpName" value="${scp.name}">
      </div>
      <div class="form-group">
        <label>Object Class</label>
        <select id="editScpClass">
          <option value="Safe" ${scp.class==='Safe'?'selected':''}>Safe</option>
          <option value="Euclid" ${scp.class==='Euclid'?'selected':''}>Euclid</option>
          <option value="Keter" ${scp.class==='Keter'?'selected':''}>Keter</option>
          <option value="Thaumiel" ${scp.class==='Thaumiel'?'selected':''}>Thaumiel</option>
          <option value="Apollyon" ${scp.class==='Apollyon'?'selected':''}>Apollyon</option>
          <option value="Archon" ${scp.class==='Archon'?'selected':''}>Archon</option>
          <option value="Esoteric" ${scp.class==='Esoteric'?'selected':''}>Esoteric</option>
          <option value="Neutralized" ${scp.class==='Neutralized'?'selected':''}>Neutralized</option>
        </select>
      </div>
      <div class="form-group">
        <label>Special Containment Procedures</label>
        <textarea id="editScpContainment" rows="5">${scp.containment}</textarea>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="editScpDescription" rows="5">${scp.description}</textarea>
      </div>
      <div class="form-group">
        <label>Image URL</label>
        <input id="editScpImage" value="${scp.image || ''}">
      </div>
      <div class="form-group">
        <label>Anomaly Type</label>
        <input id="editScpAnomalyType" value="${scp.anomalyType || ''}">
      </div>
      <div class="form-group">
        <label>Primary Ability / Threat</label>
        <input id="editScpPrimaryAbility" value="${scp.primaryAbility || ''}">
      </div>
      <div class="form-group">
        <label>Danger Level (1-10)</label>
        <input type="number" id="editScpDangerLevel" min="1" max="10" value="${scp.dangerLevel || 5}">
      </div>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <button id="saveScpEdit" class="btn-primary">Save Changes</button>
        <button id="cancelScpEdit" class="btn-primary">Cancel</button>
      </div>
    `);

    // Ensure custom classes from storage are appended to the class select and restore the SCP's class value
    try {
      if (this.app.updateSCPClassOptions) this.app.updateSCPClassOptions();
      const select = document.getElementById('editScpClass');
      if (select) {
        // restore the actual class value even if it was a custom class or less-common standard class
        try { select.value = scp.class; } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore errors */ }

    document.getElementById('cancelScpEdit').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    document.getElementById('saveScpEdit').onclick = async () => {
      this.app.audio.play('success');
      scp.number = document.getElementById('editScpNumber').value.trim() || scp.number;
      scp.name = document.getElementById('editScpName').value.trim() || scp.name;
      scp.class = document.getElementById('editScpClass').value || scp.class;
      scp.containment = document.getElementById('editScpContainment').value.trim() || scp.containment;
      scp.description = document.getElementById('editScpDescription').value.trim() || scp.description;
      scp.image = document.getElementById('editScpImage').value.trim() || scp.image;
      scp.anomalyType = document.getElementById('editScpAnomalyType').value.trim() || scp.anomalyType;
      scp.primaryAbility = document.getElementById('editScpPrimaryAbility').value.trim() || scp.primaryAbility;
      scp.dangerLevel = parseInt(document.getElementById('editScpDangerLevel').value || '5', 10);
      this.app.storage.save('scps', this.app.scps);
      this.renderRecent();
      this.renderArchive();

      // After saving the SCP, regenerate any stored investigation reports that reference this SCP
      try {
        const investigations = this.app.storage.load('investigations', []);
        const related = investigations.filter(inv => inv.scpId === scp.id);

        if (related.length) {
          this.app.ui.toast('SCP updated — regenerating linked investigations...');
          for (let i = 0; i < related.length; i++) {
            const inv = related[i];

            // Prefer to fetch the current personnel record by scientistId so regen uses authoritative metadata
            let scientist = { name: inv.scientistName || 'Unknown Investigator', role: inv.scientistRole || 'Researcher', department: inv.scientistDepartment || '', clearance: inv.scientistClearance || '' };
            try {
              const personnel = this.app.storage.load('personnel', []);
              const found = personnel.find(p => p.id === inv.scientistId);
              if (found) {
                scientist = {
                  name: found.name || found.fullName || scientist.name,
                  role: found.role || scientist.role,
                  department: found.department || scientist.department,
                  clearance: found.clearance || scientist.clearance
                };
              }
            } catch (e) {
              // fallback to stored fields if lookup fails
            }

            try {
              const newReport = await this.app.ai.generateInvestigationReport({ scp, scientist });
              inv.report = newReport;
              inv.updated = new Date().toISOString();
            } catch (e) {
              // on failure, keep existing report but mark attempted update timestamp
              inv.updatedAttempt = new Date().toISOString();
            }
          }
          // Merge updates back into the full investigations array and persist
          const updatedAll = investigations.map(inv => {
            const replacement = related.find(r => r.id === inv.id);
            return replacement || inv;
          });
          this.app.storage.save('investigations', updatedAll);
          this.app.ui.toast(`${related.length} investigation(s) updated`);
          this.app.audio.play('success');
        }
      } catch (e) {
        console.error('Error regenerating investigations:', e);
        this.app.ui.toast('Saved SCP but investigation regeneration failed');
        this.app.audio.play('failure');
      }

      this.app.ui.toast('SCP updated');
      this.app.ui.closeModal();
    };
  }
  async generateImage() {
    const name = document.getElementById('scpName').value || 'unknown entity';
    const cls = document.getElementById('scpClass').value || 'Unclassified';
    const desc = document.getElementById('scpDescription2').value || '';
    const aspect = document.getElementById('imageAspect').value || '1:1';
    this.app.ui.toast('Generating image (about 10s)...');
    try {
      const url = await this.app.ai.generateImageUrl(`SCP-style documentation photo of "${name}" (Class: ${cls}). ${desc}. Dramatic, neutral lighting, documentary style, no text, no watermark.`, aspect);
      // preview the generated image and let user confirm using it
      this.app.ui.openModal(`<h3>Preview Generated Image</h3><img src="${url}" style="width:100%;border-radius:8px;margin:12px 0;"><div style="display:flex;gap:8px;"><button id="useImg" class="btn-primary">Use Image</button><button id="closePreview" class="btn-primary">Close</button></div>`);
      document.getElementById('useImg').onclick = () => { document.getElementById('scpImage').value = url; this.app.audio.play('success'); this.app.ui.closeModal(); this.app.ui.toast('Image applied'); };
      document.getElementById('closePreview').onclick = () => { this.app.ui.closeModal(); this.app.ui.toast('Preview closed'); };
    } catch { 
      this.app.ui.toast('Image generation failed'); 
      this.app.audio.play('failure');
    }
  }
  updateStats() {
    // Filter out neutralized SCPs from stats
    const activeSCPs = this.app.scps.filter(s => s.class !== 'Neutralized');
    const total = activeSCPs.length;
    const contained = activeSCPs.filter(s => {
      const st = (s.state || 'Contained');
      return st === 'Contained';
    }).length;
    const breached = activeSCPs.filter(s => (s.state === 'Breached')).length;
    // show contained / total and breached inline for clarity
    document.getElementById('scpCount').textContent = `${contained} / ${total}${breached ? ` (${breached} breached)` : ''}`;
    const created = this.app.settings.created ? new Date(this.app.settings.created) : new Date();
    const now = new Date();
    const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    document.getElementById('foundationAge').textContent = days;
    document.getElementById('casualties').textContent = this.app.casualties || 0;
  }
}