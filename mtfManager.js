export class MTFManager {
  constructor(app) { this.app = app; }
  create(e) {
    e.preventDefault();
    const mtfs = this.app.storage.load('mtfs', []);
    const mtf = {
      id: Date.now(),
      designation: document.getElementById('mtfDesignation').value,
      codename: document.getElementById('mtfCodename').value,
      mission: document.getElementById('mtfMission').value,
      specialization: document.getElementById('mtfSpecialization').value,
      members: parseInt(document.getElementById('mtfMembers').value || '1', 10),
      strength: Math.max(1, Math.min(10, parseInt(document.getElementById('mtfStrength').value || '5', 10))),
      status: document.getElementById('mtfStatus').value,
      equipment: document.getElementById('mtfEquipment').value || 'Standard',
      trainingLevel: parseInt(document.getElementById('mtfTrainingLevel').value || '5', 10),
      experience: document.getElementById('mtfExperience').value || 'New deployment',
      created: new Date().toISOString()
    };
    mtfs.unshift(mtf);
    this.app.storage.save('mtfs', mtfs);
    document.getElementById('mtfForm').reset();
    this.renderList();
    this.app.ui.toast('MTF created successfully');
    this.app.audio.play('success');
  }
  renderList() {
    const mtfs = this.app.storage.load('mtfs', []);
    const container = document.getElementById('mtfList');
    container.innerHTML = mtfs.length ? mtfs.map(m => `
      <div class="scp-card" onclick="app.viewMTF(${m.id})">
        <h4>${m.designation}: ${m.codename}</h4>
        <span class="class-badge class-${m.status.replaceAll(' ','-')}">${m.status}</span>
        <p><strong>Members:</strong> ${m.members} • <strong>Strength:</strong> ${m.strength}/10</p>
        <p>${m.mission.substring(0, 100)}...</p>
      </div>`).join('') : '<p class="empty-state">No MTFs created yet. Create your first Mobile Task Force!</p>';
  }
  view(id) {
    const mtf = this.app.storage.load('mtfs', []).find(m => m.id === id);
    if (!mtf) return;
    this.app.ui.openModal(`
      <h3>${mtf.designation}: ${mtf.codename}</h3>
      <p><strong>Status:</strong> ${mtf.status}</p>
      <p><strong>Members:</strong> ${mtf.members} • <strong>Strength:</strong> ${mtf.strength}/10</p>
      <p><strong>Training:</strong> ${mtf.trainingLevel}/10 • <strong>Equipment:</strong> ${mtf.equipment || 'Standard'}</p>
      <p><strong>Specialization:</strong> ${mtf.specialization}</p>
      ${mtf.experience ? `<p><strong>Experience:</strong> ${mtf.experience}</p>` : ''}
      <h4>Primary Mission</h4>
      <p>${mtf.mission}</p>
      <div style="margin-top:12px;">
        <button id="editMTF" class="btn-primary">Edit MTF</button>
      </div>
    `);
    document.getElementById('editMTF').onclick = () => { this.app.audio.play('click'); this.openEdit(id); };
  }
  openEdit(id) {
    const mtfs = this.app.storage.load('mtfs', []);
    const mtf = mtfs.find(m => m.id === id);
    if (!mtf) return;
    this.app.ui.openModal(`
      <h3>Edit ${mtf.designation}</h3>
      <div class="form-group">
        <label>MTF Designation</label>
        <input id="editMtfDesignation" value="${mtf.designation}">
      </div>
      <div class="form-group">
        <label>Codename</label>
        <input id="editMtfCodename" value="${mtf.codename}">
      </div>
      <div class="form-group">
        <label>Primary Mission</label>
        <textarea id="editMtfMission" rows="3">${mtf.mission}</textarea>
      </div>
      <div class="form-group">
        <label>Specialization</label>
        <input id="editMtfSpecialization" value="${mtf.specialization}">
      </div>
      <div class="form-group">
        <label>Members (number)</label>
        <input type="number" id="editMtfMembers" min="0" value="${mtf.members}">
      </div>
      <div class="form-group">
        <label>Strength (1-10)</label>
        <input type="number" id="editMtfStrength" min="1" max="10" value="${mtf.strength}">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="editMtfStatus">
          <option value="Active" ${mtf.status==='Active'?'selected':''}>Active</option>
          <option value="On Standby" ${mtf.status==='On Standby'?'selected':''}>On Standby</option>
          <option value="Decommissioned" ${mtf.status==='Decommissioned'?'selected':''}>Decommissioned</option>
          <option value="MIA" ${mtf.status==='MIA'?'selected':''}>MIA</option>
          <option value="KIA" ${mtf.status==='KIA'?'selected':''}>KIA</option>
        </select>
      </div>
      <div class="form-group">
        <label>Equipment</label>
        <select id="editMtfEquipment">
          <option value="Standard" ${mtf.equipment==='Standard'?'selected':''}>Standard Military</option>
          <option value="Advanced" ${mtf.equipment==='Advanced'?'selected':''}>Advanced Tactical</option>
          <option value="Containment" ${mtf.equipment==='Containment'?'selected':''}>Containment Specialist</option>
          <option value="Hazmat" ${mtf.equipment==='Hazmat'?'selected':''}>Hazmat / Biological</option>
          <option value="Dimensional" ${mtf.equipment==='Dimensional'?'selected':''}>Dimensional Tech</option>
          <option value="Experimental" ${mtf.equipment==='Experimental'?'selected':''}>Experimental / Thaumiel</option>
        </select>
      </div>
      <div class="form-group">
        <label>Training Level (1-10)</label>
        <input type="number" id="editMtfTrainingLevel" min="1" max="10" value="${mtf.trainingLevel || 5}">
      </div>
      <div class="form-group">
        <label>Experience / Mission History</label>
        <input id="editMtfExperience" value="${mtf.experience || ''}">
      </div>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <button id="saveMtfEdit" class="btn-primary">Save Changes</button>
        <button id="cancelMtfEdit" class="btn-primary">Cancel</button>
      </div>
    `);
    document.getElementById('cancelMtfEdit').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    document.getElementById('saveMtfEdit').onclick = () => {
      this.app.audio.play('success');
      mtf.designation = document.getElementById('editMtfDesignation').value.trim() || mtf.designation;
      mtf.codename = document.getElementById('editMtfCodename').value.trim() || mtf.codename;
      mtf.mission = document.getElementById('editMtfMission').value.trim() || mtf.mission;
      mtf.specialization = document.getElementById('editMtfSpecialization').value.trim() || mtf.specialization;
      mtf.members = parseInt(document.getElementById('editMtfMembers').value || `${mtf.members}`, 10);
      mtf.strength = Math.max(1, Math.min(10, parseInt(document.getElementById('editMtfStrength').value || `${mtf.strength}`, 10)));
      mtf.status = document.getElementById('editMtfStatus').value || mtf.status;
      mtf.equipment = document.getElementById('editMtfEquipment').value || mtf.equipment;
      mtf.trainingLevel = parseInt(document.getElementById('editMtfTrainingLevel').value || `${mtf.trainingLevel}`, 10);
      mtf.experience = document.getElementById('editMtfExperience').value.trim() || mtf.experience;
      this.app.storage.save('mtfs', mtfs);
      this.renderList();
      this.app.ui.toast('MTF updated');
      this.app.ui.closeModal();
    };
  }
  deployTemplate() {
    const templateSelect = document.getElementById('mtfTemplate');
    const template = templateSelect?.value;
    if (!template) {
      this.app.ui.toast('Select a template first');
      return;
    }

    const templates = {
      'alpha-1': { designation: 'MTF Alpha-1', codename: 'Red Right Hand', mission: 'Direct O5 Council enforcement and strategic anomaly response operations. Highest priority missions.', specialization: 'Elite Response & Command', strength: 10, equipment: 'Experimental' },
      'beta-7': { designation: 'MTF Beta-7', codename: 'Maz Hatters', mission: 'Biohazard containment and biological anomaly suppression in contaminated zones.', specialization: 'Biological Hazard Containment', strength: 9, equipment: 'Hazmat' },
      'epsilon-11': { designation: 'MTF Epsilon-11', codename: 'Nine-Tailed Fox', mission: 'Large-scale facility breach response and humanoid SCP recovery operations.', specialization: 'Facility Breach Response', strength: 9, equipment: 'Advanced' },
      'omega-7': { designation: 'MTF Omega-7', codename: 'Pandora\'s Box', mission: 'Humanoid SCP containment, transport, and specialized holding protocols.', specialization: 'Humanoid Specialization', strength: 8, equipment: 'Containment' },
      'delta-5': { designation: 'MTF Delta-5', codename: 'Front Runners', mission: 'Mobile SCP recovery and cross-site pursuit operations.', specialization: 'Mobile Recovery', strength: 8, equipment: 'Advanced' },
      'eta-10': { designation: 'MTF Eta-10', codename: 'See No Evil', mission: 'Visual and sensory anomaly containment with specialized ocular protection.', specialization: 'Sensory Anomalies', strength: 7, equipment: 'Containment' },
      'iota-10': { designation: 'MTF Iota-10', codename: 'Damn Dogs', mission: 'Rapid manhunt and tracking of escaped humanoid entities across wide areas.', specialization: 'Tracking & Pursuit', strength: 7, equipment: 'Standard' },
      'mu-4': { designation: 'MTF Mu-4', codename: 'Debuggers', mission: 'Technological and computational anomaly suppression and digital containment.', specialization: 'Tech Threats', strength: 8, equipment: 'Advanced' }
    };

    const t = templates[template];
    if (!t) return;

    const mtfs = this.app.storage.load('mtfs', []);
    const mtf = {
      id: Date.now(),
      designation: t.designation,
      codename: t.codename,
      mission: t.mission,
      specialization: t.specialization,
      members: Math.floor(Math.random() * 8) + 10,
      strength: t.strength,
      status: 'Active',
      equipment: t.equipment,
      trainingLevel: Math.floor(Math.random() * 3) + 8,
      experience: 'Deployed from Foundation archives',
      created: new Date().toISOString()
    };
    mtfs.unshift(mtf);
    this.app.storage.save('mtfs', mtfs);
    this.renderList();
    templateSelect.value = '';
    this.app.ui.toast(`${mtf.designation} deployed`);
    this.app.audio.play('success');
  }

  openContainDialog(id) {
    const mtfs = this.app.storage.load('mtfs', []).filter(m => ['Active','On Standby'].includes(m.status));
    const thaumielSCPs = this.app.scps.filter(s => s.class === 'Thaumiel' && s.state === 'Contained');
    const mtfSection = mtfs.length ? mtfs.map(m=>`<label style="display:block;margin:6px 0;"><input type="checkbox" name="mtf" value="${m.id}"> ${m.designation} (${m.status})</label>`).join('') : '<p style="color:var(--text-muted);font-size:0.9rem;"><em>No active MTFs available</em></p>';
    const thaumielSection = thaumielSCPs.length ? `<div style="margin-top:16px;"><p style="font-weight:700;margin-bottom:8px;">✨ Thaumiel Assets (Optional)</p>${thaumielSCPs.map(s=>`<label style="display:block;margin:6px 0;"><input type="checkbox" name="thaumiel" value="${s.id}"> SCP-${s.number}: ${s.name}</label>`).join('')}</div>` : '';
    const html = `<h4>Containment Response</h4><p><strong>Select responding MTFs:</strong></p>${mtfSection}${thaumielSection}<button id="doContain" class="btn-primary" style="margin-top:10px;">Attempt Containment</button>`;
    this.app.ui.openModal(html);
    const mtfBoxes = [...document.querySelectorAll('#modalBody input[name=mtf]:checked')];
    document.getElementById('doContain').onclick = () => {
        this.app.audio.play('click');
        const selectedMTFs = mtfs.filter((m,i)=> document.querySelector(`#modalBody input[name=mtf][value="${m.id}"]:checked`));
        this.attemptContain(id, selectedMTFs);
    };
  }
  async attemptContain(id, selected) {
    const s = this.app.scps.find(x => x.id === id); if (!s) return;

    // Base containment difficulty by class (higher = easier to contain)
    const classBase = { Safe: 0.95, Euclid: 0.75, Keter: 0.50, Thaumiel: 0.80 }[s.class] ?? 0.6;

    // Convert selected MTFs into a numeric strength value using members and strength rating
    const mtfStrength = selected.reduce((sum, m) => {
      const statusMul = { 'Active': 1.0, 'On Standby': 0.85, 'Decommissioned': 0.35, 'MIA': 0.45, 'KIA': 0.0 }[m.status] ?? 0.6;
      const power = statusMul * (m.strength / 10) * Math.sqrt(Math.max(1, m.members));
      return sum + power;
    }, 0);

    // Check for Thaumiel SCPs to boost containment success
    const thaumielBoost = this.app.scps.filter(scp => scp.class === 'Thaumiel' && scp.state === 'Contained').length > 0 ? 0.15 : 0;

    // Improve MTF effectiveness with slightly higher modifier and cap to favor successful containment
    const mtfModifier = Math.min(1.8, 0.45 + Math.log1p(Math.max(0.1, mtfStrength)) * 0.6);

    // Final success chance (with Thaumiel boost applied)
    const chance = Math.max(0.1, Math.min(0.999, classBase * mtfModifier + 0.06 + thaumielBoost));

    // Build detailed summary for user
    const thaumielActive = this.app.scps.filter(scp => scp.class === 'Thaumiel' && scp.state === 'Contained').length;
    const squadsHtml = selected.length ? selected.map(m => `<li>${m.designation} (${m.status}) — ${m.members} members, str ${m.strength}/10</li>`).join('') : '<li><em>No squads selected</em></li>';
    const summaryHtml = `
      <h3>Containment Attempt — SCP-${s.number}</h3>
      <p><strong>Estimated success chance:</strong> ${(chance*100).toFixed(1)}%</p>
      <p style="font-size:0.9rem;color:var(--text-muted)"><strong>Breakdown:</strong> Class base ${(classBase*100).toFixed(1)}% × MTF modifier ${(mtfModifier).toFixed(2)}${thaumielActive ? ` + Thaumiel boost 15%` : ''}</p>
      <p><strong>Participating MTFs:</strong></p>
      <ul style="margin-left:18px;">${squadsHtml}</ul>
      ${thaumielActive ? `<p style="color:#9C27B0;font-weight:700;margin-top:8px;">⚡ ${thaumielActive} Thaumiel SCP(s) active — +15% success boost applied</p>` : ''}
      <p style="margin-top:8px;"><em>Resolving...</em></p>
    `;

    // Show initial modal with details while resolving
    this.app.ui.openModal(summaryHtml);

    // short delay for drama / clarity
    setTimeout(async () => {
      const roll = Math.random();
      const success = roll < chance;
      if (success) {
        // mark contained and update UI/stats
        // clear breached flag reliably and mark contained
        s.state = 'Contained';
        if (s.breachedReason) delete s.breachedReason;
        this.app.storage.save('scps', this.app.scps);
        // Refresh stats and both SCP lists so breached icon flips back instantly
        this.app.scp.updateStats();
        this.app.scp.renderArchive();
        this.app.scp.renderRecent();
        this.app.audio.play('success');
        // Boost reputation for successful containment
        this.app.modifyReputation(15);

        // generate AI summary including casualties (0 for success)
        const casualties = 0;
        // log operation
        const ops = this.app.storage.load('ops', []);
        ops.unshift({ type:'containment', scpId: s.id, success:true, casualties, responders: selected.map(r=>r.id), created:new Date().toISOString() });
        this.app.storage.save('ops', ops);
        this.app.renderOps();

        const aiSummary = await this.app.ai.summarizeContainment({ scp: s, success: true, casualties, responders: selected, chance, roll });

        this.app.ui.openModal(`
          <h3>Containment Successful</h3>
          <p>SCP-${s.number} has been re-contained.</p>
          <p style="font-size:0.9rem;color:var(--text-muted)"><strong>Details:</strong> Class base ${(classBase*100).toFixed(1)}% · MTF power ${(mtfStrength).toFixed(2)} · Modifier ${(mtfModifier).toFixed(2)}</p>
          <p><strong>Chance:</strong> ${(chance*100).toFixed(1)}% — <strong>Roll:</strong> ${(roll*100).toFixed(1)}%</p>
          <p><strong>Responders:</strong></p><ul style="margin-left:18px;">${squadsHtml}</ul>
          <h4>Incident Summary</h4>
          <p>${aiSummary}</p>
          <div style="margin-top:12px;"><button id="containOk" class="btn-primary">OK</button></div>
        `);
        document.getElementById('containOk').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
      } else {
        // containment failed — AI analyzes casualties
        this.app.audio.play('failure');
        const report = await this.app.ai.analyzeIncident({ scp: s, responders: selected, context: 'failed_containment' });
        const casualties = report.casualties || 0;
        const aiSummary = report.summary;

        this.app.addCasualties(casualties);

        // distribute casualties across selected MTFs and update their status/members
        const mtfs = this.app.storage.load('mtfs', []);
        let remaining = casualties;
        selected.forEach(m => {
          const idx = mtfs.findIndex(x=>x.id===m.id);
          if (idx>-1) {
            const loss = Math.min(mtfs[idx].members, Math.max(1, Math.round(casualties * (m.members / (selected.reduce((a,b)=>a+b.members,0)||1)))));
            mtfs[idx].members = Math.max(0, mtfs[idx].members - loss);
            if (mtfs[idx].members === 0) mtfs[idx].status = 'KIA';
          }
        });
        this.app.storage.save('mtfs', mtfs);
        this.renderList();

        // log operation
        const ops = this.app.storage.load('ops', []);
        ops.unshift({ type:'containment', scpId: s.id, success:false, casualties, responders: selected.map(r=>r.id), created:new Date().toISOString() });
        this.app.storage.save('ops', ops);
        this.app.renderOps();

        this.app.ui.openModal(`
          <h3>Containment Failed</h3>
          <p>SCP-${s.number} remains at large.</p>
          <p style="font-size:0.9rem;color:var(--text-muted)"><strong>Details:</strong> Class base ${(classBase*100).toFixed(1)}% · MTF power ${(mtfStrength).toFixed(2)} · Modifier ${(mtfModifier).toFixed(2)}</p>
          <p><strong>Chance:</strong> ${(chance*100).toFixed(1)}% — <strong>Roll:</strong> ${(roll*100).toFixed(1)}%</p>
          <p><strong>Casualties:</strong> ${casualties}</p>
          <p><strong>Responders:</strong></p><ul style="margin-left:18px;">${squadsHtml}</ul>
          <h4>Incident Summary</h4>
          <p>${aiSummary}</p>
          <div style="margin-top:12px;"><button id="containFailClose" class="btn-primary">Close</button></div>
        `);
        document.getElementById('containFailClose').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
      }
    }, 850);
  }
}