export class GOIManager {
  constructor(app) {
    this.app = app;
    this.invasionTimer = null;
  }

  create(e) {
    e.preventDefault();
    const name = document.getElementById('goiName').value.trim();
    const acronym = document.getElementById('goiAcronym').value.trim();
    const description = document.getElementById('goiDescription').value.trim();
    const threatLevel = parseInt(document.getElementById('goiThreatLevel').value || '5', 10);
    const aggression = parseInt(document.getElementById('goiAggression').value || '50', 10);

    if (!name || !acronym || !description || !threatLevel) {
      this.app.ui.toast('Please fill in all GOI fields');
      this.app.audio.play('failure');
      return;
    }

    const goi = {
      id: Date.now(),
      name,
      acronym,
      description,
      threatLevel,
      aggression,
      created: new Date().toISOString()
    };

    const list = this.app.storage.load('gois', []);
    list.unshift(goi);
    this.app.storage.save('gois', list);
    document.getElementById('goiForm').reset();
    this.renderList();
    this.startInvasionSystem();
    this.app.ui.toast(`Group "${name}" created`);
    this.app.audio.play('success');
  }

  deployTemplate() {
    const tpl = document.getElementById('goiTemplate')?.value;
    if (!tpl) { this.app.ui.toast('Select a GOI template'); return; }
    // Templates aligned with the select options in index.html and SCP lore-inspired factions
    const templates = {
      'chaos': {
        name: 'Chaos Insurgency',
        acronym: 'CI',
        description: 'Paramilitary splinter group using stolen SCPs against the Foundation. Specializes in hit-and-run extractions and sabotage.',
        threatLevel: 7,
        aggression: 40
      },
      'seraph': {
        name: 'Serpent\'s Hand',
        acronym: 'SH',
        description: 'Decentralized occult collective dedicated to freeing anomalous entities from containment and undermining secrecy.',
        threatLevel: 6,
        aggression: 35
      },
      'cicada': {
        name: 'Church of the Broken God',
        acronym: 'COBG',
        description: 'Technotheological cult seeking to recover and reassemble anomalous machine components to restore their fragmented deity.',
        threatLevel: 8,
        aggression: 50
      }
    };
    const t = templates[tpl];
    if (!t) return;
    const goi = {
      id: Date.now(),
      name: t.name,
      acronym: t.acronym,
      description: t.description,
      threatLevel: t.threatLevel,
      aggression: t.aggression,
      created: new Date().toISOString()
    };
    const list = this.app.storage.load('gois', []);
    list.unshift(goi);
    this.app.storage.save('gois', list);
    this.renderList();
    this.startInvasionSystem();
    this.app.ui.toast(`Group \"${goi.name}\" deployed`);
    this.app.audio.play('success');
  }

  renderList() {
    const container = document.getElementById('goiList');
    if (!container) return;
    const list = this.app.storage.load('gois', []);
    container.innerHTML = list.length ? list.map(g => `
      <div class="scp-card" onclick="app.goi.view(${g.id})">
        <h4>${g.name} (${g.acronym})</h4>
        <p><strong>Threat Level:</strong> ${g.threatLevel}/10</p>
        <p><strong>Aggression:</strong> ${g.aggression}%</p>
        <p>${g.description.substring(0, 100)}...</p>
      </div>
    `).join('') : '<p class="empty-state">No groups of interest created yet.</p>';
  }

  view(id) {
    const list = this.app.storage.load('gois', []);
    const g = list.find(x => x.id === id);
    if (!g) return;

    this.app.ui.openModal(`
      <h3>${g.name}</h3>
      <p><strong>Designation:</strong> ${g.acronym}</p>
      <p><strong>Threat Level:</strong> ${g.threatLevel}/10</p>
      <p><strong>Aggression Frequency:</strong> ${g.aggression}%</p>
      <h4>Description / Objectives</h4>
      <p>${g.description}</p>
      <div style="display:flex;gap:8px;margin-top:15px;">
        <button id="editGOI" class="btn-primary">Edit</button>
        <button id="removeGOI" class="btn-danger">Remove</button>
        <button id="closeGOI" class="btn-primary">Close</button>
      </div>
    `);

    document.getElementById('closeGOI').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    document.getElementById('editGOI').onclick = () => { this.app.audio.play('click'); this.openEdit(id); };
    document.getElementById('removeGOI').onclick = () => {
      if (confirm(`Remove ${g.name}?`)) {
        this.app.audio.play('success');
        const list = this.app.storage.load('gois', []);
        const idx = list.findIndex(x => x.id === id);
        if (idx > -1) list.splice(idx, 1);
        this.app.storage.save('gois', list);
        this.renderList();
        this.app.ui.closeModal();
        this.app.ui.toast('Group removed');
      }
    };
  }

  openEdit(id) {
    const list = this.app.storage.load('gois', []);
    const g = list.find(x => x.id === id);
    if (!g) return;

    this.app.ui.openModal(`
      <h3>Edit ${g.name}</h3>
      <div class="form-group">
        <label>Name</label>
        <input id="editGoiName" value="${g.name}">
      </div>
      <div class="form-group">
        <label>Acronym</label>
        <input id="editGoiAcronym" value="${g.acronym}">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="editGoiDesc" rows="3">${g.description}</textarea>
      </div>
      <div class="form-group">
        <label>Threat Level (1-10)</label>
        <input type="number" id="editGoiThreat" min="1" max="10" value="${g.threatLevel}">
      </div>
      <div class="form-group">
        <label>Aggression Frequency (%)</label>
        <input type="number" id="editGoiAggression" min="1" max="100" value="${g.aggression}">
      </div>
      <div style="display:flex;gap:8px;">
        <button id="saveGoiEdit" class="btn-primary">Save</button>
        <button id="cancelGoiEdit" class="btn-primary">Cancel</button>
      </div>
    `);

    document.getElementById('cancelGoiEdit').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    document.getElementById('saveGoiEdit').onclick = () => {
      g.name = document.getElementById('editGoiName').value.trim() || g.name;
      g.acronym = document.getElementById('editGoiAcronym').value.trim() || g.acronym;
      g.description = document.getElementById('editGoiDesc').value.trim() || g.description;
      g.threatLevel = parseInt(document.getElementById('editGoiThreat').value || '5', 10);
      g.aggression = parseInt(document.getElementById('editGoiAggression').value || '50', 10);
      this.app.storage.save('gois', list);
      this.renderList();
      this.app.audio.play('success');
      this.app.ui.closeModal();
      this.app.ui.toast('Group updated');
    };
  }

  startInvasionSystem() {
    if (this.invasionTimer) clearInterval(this.invasionTimer);
    this.invasionTimer = setInterval(() => this.checkInvasion(), 45000); // Check every 45 seconds
  }

  checkInvasion() {
    const gois = this.app.storage.load('gois', []);
    if (!gois.length || !this.app.scps.length) return;

    gois.forEach(g => {
      if (Math.random() * 100 < g.aggression) {
        this.triggerInvasion(g);
      }
    });
  }

  triggerInvasion(goi) {
    // Exclude Safe-class SCPs from being targeted by GOI invasions (Safe cannot escape)
    const containedSCPs = this.app.scps.filter(s => s.state === 'Contained' && s.class !== 'Safe');
    if (!containedSCPs.length) return;

    const targetSCP = containedSCPs[Math.floor(Math.random() * containedSCPs.length)];
    const mtfs = this.app.storage.load('mtfs', []).filter(m => m.status === 'Active');

    // Reduce invasion frequency and make them less severe
    if (Math.random() > 0.6) return; // Only 40% chance to actually trigger invasion when called

    this.app.ui.openModal(`
      <h3>⚠️ INVASION ALERT</h3>
      <p style="font-size:1.05rem;color:var(--danger);margin:15px 0;"><strong>${goi.name} (${goi.acronym})</strong> is attempting to breach the foundation!</p>
      <p><strong>Target:</strong> SCP-${targetSCP.number} "${targetSCP.name}"</p>
      <p><strong>Threat Level:</strong> ${goi.threatLevel}/10</p>
      <p style="color:var(--text-muted);margin:15px 0;font-size:0.95rem;">You have 90 seconds to deploy an MTF team or this SCP will be lost!</p>
      ${mtfs.length ? `<p><strong>Available MTF Teams:</strong> ${mtfs.length}</p>` : '<p style="color:var(--danger);"><strong>No active MTF teams available!</strong></p>'}
      <div style="display:flex;gap:10px;margin-top:15px;flex-wrap:wrap;">
        ${mtfs.length ? `<button id="deployDefense" class="btn-primary">Deploy MTF Defense</button>` : ''}
        <button id="abandonSCP" class="btn-danger">Abandon SCP</button>
      </div>
    `);

    const timeoutId = setTimeout(() => {
      if (document.getElementById('abandonSCP')) {
        this.app.audio.play('alarm');
        this.app.ui.closeModal();
        this.loseSCP(targetSCP, goi);
      }
    }, 90000); // Increased from 60 to 90 seconds

    const deployBtn = document.getElementById('deployDefense');
    const abandonBtn = document.getElementById('abandonSCP');

    if (deployBtn) {
      deployBtn.onclick = () => {
        clearTimeout(timeoutId);
        this.app.audio.play('click');
        this.openDefenseSelection(goi, targetSCP, mtfs);
      };
    }

    if (abandonBtn) {
      abandonBtn.onclick = () => {
        clearTimeout(timeoutId);
        this.app.audio.play('failure');
        this.loseSCP(targetSCP, goi);
      };
    }
  }

  openDefenseSelection(goi, targetSCP, mtfs) {
    const html = `<h4>Select MTF Teams for Defense</h4><p>Threat Level: ${goi.threatLevel}/10</p>${
      mtfs.map(m => `<label style="display:block;margin:8px 0;"><input type="checkbox" name="defenseMTF" value="${m.id}"> ${m.designation} (${m.status}) - Str ${m.strength}/10</label>`).join('')
    }<button id="confirmDefense" class="btn-primary" style="margin-top:12px;">Deploy Selected</button>`;
    this.app.ui.openModal(html);

    document.getElementById('confirmDefense').onclick = () => {
      const selectedIds = [...document.querySelectorAll('input[name="defenseMTF"]:checked')].map(x => parseInt(x.value, 10));
      if (!selectedIds.length) {
        this.app.ui.toast('Select at least one MTF team');
        return;
      }
      this.app.audio.play('battle_start');
      this.attemptDefense(goi, targetSCP, selectedIds);
    };
  }

  attemptDefense(goi, targetSCP, mtfIds) {
    const mtfs = this.app.storage.load('mtfs', []);
    const selectedMTFs = mtfs.filter(m => mtfIds.includes(m.id));
    
    // Calculate defense strength with bonus for multiple MTFs
    const defenseStrength = selectedMTFs.reduce((sum, m) => {
      const power = (m.strength / 10) * Math.sqrt(Math.max(1, m.members));
      return sum + power;
    }, 0) + (selectedMTFs.length * 0.3); // Bonus for team coordination

    // Make invasions easier - increased base success chance and better scaling
    const threatModifier = goi.threatLevel / 10;
    const baseSuccessChance = 0.75; // Increased from 0.7
    const successChance = Math.max(0.3, Math.min(0.98, (defenseStrength / (threatModifier * 8)) * baseSuccessChance));
    const roll = Math.random();
    const success = roll < successChance;

    setTimeout(() => {
      if (success) {
        this.app.audio.play('success');
        const casualties = Math.max(0, Math.round(Math.random() * 5));
        if (casualties > 0) this.app.addCasualties(casualties);
        
        // Damage MTF teams based on threat
        selectedMTFs.forEach(m => {
          const loss = Math.max(1, Math.round(m.members * (goi.threatLevel / 20)));
          m.members = Math.max(0, m.members - loss);
          if (m.members === 0) m.status = 'KIA';
        });
        this.app.storage.save('mtfs', mtfs);
        this.app.mtf.renderList();

        this.app.ui.openModal(`
          <h3>✓ Defense Successful</h3>
          <p>MTF teams repelled the ${goi.acronym} invasion attempt.</p>
          <p><strong>SCP-${targetSCP.number} secured.</strong></p>
          ${casualties > 0 ? `<p>Casualties: ${casualties}</p>` : ''}
          <button id="closeDefenseSuccess" class="btn-primary" style="margin-top:12px;">Close</button>
        `);
        document.getElementById('closeDefenseSuccess').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
        this.app.modifyReputation(10);
      } else {
        this.app.audio.play('failure');
        this.loseSCP(targetSCP, goi);
      }
    }, 1200);
  }

  loseSCP(scp, goi) {
    // Store as stolen rather than permanently delete - allow recovery
    const stolen = this.app.storage.load('stolenSCPs', []);
    stolen.push({ scp, goi, stolenAt: new Date().toISOString() });
    this.app.storage.save('stolenSCPs', stolen);

    // Remove from active SCPs
    const idx = this.app.scps.findIndex(s => s.id === scp.id);
    if (idx > -1) {
      this.app.scps.splice(idx, 1);
      this.app.storage.save('scps', this.app.scps);
    }

    this.app.audio.play('alarm');
    this.app.ui.openModal(`
      <h3>✗ CONTAINMENT BREACH</h3>
      <p style="color:var(--danger);font-size:1.05rem;margin:15px 0;"><strong>${goi.name}</strong> successfully infiltrated the foundation!</p>
      <p><strong>Lost:</strong> SCP-${scp.number} "${scp.name}"</p>
      <p style="color:var(--text-muted);margin:15px 0;">The anomaly has been stolen. You have 120 seconds to deploy an MTF team for recovery!</p>
      <div style="display:flex;gap:10px;margin-top:15px;flex-wrap:wrap;">
        <button id="attemptRecovery" class="btn-primary">Deploy Recovery Team</button>
        <button id="acceptLoss" class="btn-primary">Accept Loss</button>
      </div>
    `);

    let recoveryWindow = setTimeout(() => {
      if (document.getElementById('attemptRecovery')) {
        this.app.ui.closeModal();
        this.permanentlyLoseSCP(scp, goi);
      }
    }, 120000);

    const recoveryBtn = document.getElementById('attemptRecovery');
    const acceptBtn = document.getElementById('acceptLoss');

    if (recoveryBtn) {
      recoveryBtn.onclick = () => {
        clearTimeout(recoveryWindow);
        this.app.audio.play('click');
        this.openRecoverySelection(scp, goi);
      };
    }

    if (acceptBtn) {
      acceptBtn.onclick = () => {
        clearTimeout(recoveryWindow);
        this.app.audio.play('failure');
        this.app.ui.closeModal();
        this.permanentlyLoseSCP(scp, goi);
      };
    }

    this.app.modifyReputation(-15);
    this.app.scp.updateStats();
    this.app.scp.renderArchive();
    this.app.scp.renderRecent();
    // ensure battle arena is updated now that SCP list changed
    try { this.app.battle.setupSelects(); } catch (e) {}
  }

  openRecoverySelection(scp, goi) {
    const mtfs = this.app.storage.load('mtfs', []).filter(m => m.status === 'Active' && m.members > 0);
    if (!mtfs.length) {
      this.app.ui.openModal(`
        <h3>No Active MTF Teams</h3>
        <p>You have no available MTF teams for recovery operations.</p>
        <button id="closeNoMTF" class="btn-primary">Close</button>
      `);
      document.getElementById('closeNoMTF').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
      return;
    }

    const html = `<h4>Deploy Recovery Team</h4><p>Target: SCP-${scp.number} "${scp.name}"</p><p>Enemy Threat: ${goi.name} (${goi.threatLevel}/10)</p>${
      mtfs.map(m => `<label style="display:block;margin:8px 0;"><input type="checkbox" name="recoveryMTF" value="${m.id}"> ${m.designation} - Str ${m.strength}/10, ${m.members} members</label>`).join('')
    }<button id="confirmRecovery" class="btn-primary" style="margin-top:12px;">Launch Recovery</button>`;
    this.app.ui.openModal(html);

    document.getElementById('confirmRecovery').onclick = () => {
      const selectedIds = [...document.querySelectorAll('input[name="recoveryMTF"]:checked')].map(x => parseInt(x.value, 10));
      if (!selectedIds.length) {
        this.app.ui.toast('Select at least one MTF team');
        return;
      }
      this.app.audio.play('battle_start');
      this.attemptRecovery(scp, goi, selectedIds);
    };
  }

  attemptRecovery(scp, goi, mtfIds) {
    const mtfs = this.app.storage.load('mtfs', []);
    const selectedMTFs = mtfs.filter(m => mtfIds.includes(m.id));
    
    const recoveryStrength = selectedMTFs.reduce((sum, m) => {
      const power = (m.strength / 10) * Math.sqrt(Math.max(1, m.members));
      return sum + power;
    }, 0);

    const goiDefense = (goi.threatLevel / 10) * 6;
    const baseChance = 0.65;
    const successChance = Math.max(0.2, Math.min(0.95, (recoveryStrength / goiDefense) * baseChance));
    const roll = Math.random();
    const success = roll < successChance;

    setTimeout(() => {
      if (success) {
        this.app.audio.play('success');
        const casualties = Math.max(0, Math.round(Math.random() * 3));
        if (casualties > 0) this.app.addCasualties(casualties);

        // Damage MTF teams
        selectedMTFs.forEach(m => {
          const loss = Math.max(1, Math.round(m.members * (goi.threatLevel / 25)));
          m.members = Math.max(0, m.members - loss);
          if (m.members === 0) m.status = 'KIA';
        });
        this.app.storage.save('mtfs', mtfs);
        this.app.mtf.renderList();

        // Recover the SCP
        this.app.scps.unshift(scp);
        this.app.storage.save('scps', this.app.scps);

        // Remove from stolen list
        const stolen = this.app.storage.load('stolenSCPs', []);
        const idx = stolen.findIndex(s => s.scp.id === scp.id);
        if (idx > -1) stolen.splice(idx, 1);
        this.app.storage.save('stolenSCPs', stolen);

        this.app.ui.openModal(`
          <h3>✓ Recovery Successful</h3>
          <p>SCP-${scp.number} "${scp.name}" has been recovered!</p>
          ${casualties > 0 ? `<p>Casualties: ${casualties}</p>` : ''}
          <button id="closeRecoverySuccess" class="btn-primary" style="margin-top:12px;">Close</button>
        `);
        document.getElementById('closeRecoverySuccess').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
        this.app.modifyReputation(20);
        this.app.scp.updateStats();
        this.app.scp.renderArchive();
        this.app.scp.renderRecent();
        // refresh battle arena selects so recovered SCP is available immediately
        try { this.app.battle.setupSelects(); } catch (e) {}
      } else {
        this.permanentlyLoseSCP(scp, goi);
      }
    }, 1200);
  }

  permanentlyLoseSCP(scp, goi) {
    this.app.audio.play('failure');
    this.app.ui.openModal(`
      <h3>✗ Recovery Failed</h3>
      <p style="color:var(--danger);">SCP-${scp.number} "${scp.name}" has been permanently lost to ${goi.acronym}.</p>
      <p style="color:var(--text-muted);font-size:0.9rem;margin-top:15px;">The anomaly is now beyond recovery. Your foundation has suffered a permanent loss.</p>
      <button id="closePermLoss" class="btn-primary" style="margin-top:12px;">Close</button>
    `);
    document.getElementById('closePermLoss').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    this.app.modifyReputation(-25);
    const stolen = this.app.storage.load('stolenSCPs', []);
    const idx = stolen.findIndex(s => s.scp.id === scp.id);
    if (idx > -1) stolen.splice(idx, 1);
    this.app.storage.save('stolenSCPs', stolen);
  }
}

