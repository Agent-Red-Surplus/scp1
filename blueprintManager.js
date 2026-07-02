export class BlueprintManager {
  constructor(app) {
    this.app = app;
  }

  create(e) {
    e.preventDefault();
    const name = document.getElementById('bpName').value.trim();
    const level = document.getElementById('bpLevel').value;
    const capacity = parseInt(document.getElementById('bpCapacity').value || '1', 10);
    const purpose = document.getElementById('bpPurpose').value.trim();
    const description = document.getElementById('bpDescription').value.trim();

    if (!name || !level || !purpose || !capacity) {
      this.app.ui.toast('Please fill in all required blueprint fields');
      this.app.audio.play('failure');
      return;
    }

    const bp = {
      id: Date.now(),
      name,
      level,
      capacity,
      purpose,
      description,
      assignedSCPs: [],
      created: new Date().toISOString()
    };

    this.app.blueprints.unshift(bp);
    this.app.storage.save('blueprints', this.app.blueprints);
    document.getElementById('blueprintForm').reset();
    this.app.ui.toast('Blueprint saved');
    this.app.audio.play('success');
    // small reputation gain for improving infrastructure
    try { this.app.modifyReputation(3); } catch (e) {}
    this.renderList();
  }

  deployTemplate() {
    const tpl = document.getElementById('bpTemplate')?.value;
    if (!tpl) { this.app.ui.toast('Select a blueprint template'); return; }
    const templates = {
      'site-small': { name: 'Site-23', level: 'Moderate', capacity: 25, purpose: 'Regional humanoid and biological containment facility with on-site research labs.' },
      'site-large': { name: 'Site-19', level: 'High', capacity: 120, purpose: 'Primary Foundation containment hub housing majority of Safe and Euclid-class anomalies.' },
      'research-lab': { name: 'Area-02 Research Complex', level: 'Top Secret', capacity: 40, purpose: 'Advanced thaumaturgical and reality-warping research with Thaumiel asset testing.' }
    };
    const t = templates[tpl];
    if (!t) return;
    const bp = {
      id: Date.now(),
      name: t.name,
      level: t.level,
      capacity: t.capacity,
      purpose: t.purpose,
      description: `Auto-deployed template: ${t.name}.`,
      assignedSCPs: [],
      created: new Date().toISOString()
    };
    this.app.blueprints.unshift(bp);
    this.app.storage.save('blueprints', this.app.blueprints);
    this.renderList();
    this.app.ui.toast(`${bp.name} deployed`);
    this.app.audio.play('success');
  }

  renderList() {
    const container = document.getElementById('blueprintList');
    if (!container) return;
    const list = this.app.blueprints || [];
    container.innerHTML = list.length ? list.map(b => `
      <div class="scp-card" onclick="app.viewBlueprint(${b.id})">
        <h4>${b.name}</h4>
        <p><strong>Security Level:</strong> ${b.level}</p>
        <p><strong>Capacity:</strong> ~${b.capacity} SCPs</p>
        <p>${(b.purpose || '').substring(0, 120)}...</p>
      </div>
    `).join('') : '<p class="empty-state">No blueprints yet. Design your first facility.</p>';
  }

  view(id) {
    const bp = (this.app.blueprints || []).find(b => b.id === id);
    if (!bp) return;
    const assignedCount = (bp.assignedSCPs || []).length;
    const capacityUsed = Math.round((assignedCount / bp.capacity) * 100);
    const assignedList = (bp.assignedSCPs || []).length > 0 
      ? (bp.assignedSCPs || []).map(scpId => {
          const scp = this.app.scps.find(s => s.id === scpId);
          return scp ? `<li>SCP-${scp.number}: ${scp.name} (${scp.class})</li>` : '';
        }).join('')
      : '<li><em>No SCPs assigned yet</em></li>';
    
    this.app.ui.openModal(`
      <h3>${bp.name}</h3>
      <p><strong>Security Level:</strong> ${bp.level}</p>
      <p><strong>Capacity:</strong> ${assignedCount}/${bp.capacity} SCP objects (${capacityUsed}% used)</p>
      <div style="background:var(--surface-light);padding:12px;border-radius:8px;margin:12px 0;">
        <div style="width:100%;height:8px;background:var(--border);border-radius:4px;margin-bottom:8px;">
          <div style="width:${capacityUsed}%;height:100%;background:${capacityUsed > 80 ? '#F44336' : capacityUsed > 50 ? '#FF9800' : '#4CAF50'};border-radius:4px;"></div>
        </div>
        <p style="font-size:0.9rem;color:var(--text-muted);">Containment integrity: ${100 - capacityUsed}% remaining</p>
      </div>
      <p><strong>Primary Purpose:</strong> ${bp.purpose}</p>
      <h4>Assigned SCPs</h4>
      <ul style="margin-left:18px;">${assignedList}</ul>
      <h4>Layout / Notes</h4>
      <p>${bp.description || '<em>No detailed description provided.</em>'}</p>
      <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
        <button id="editBlueprint" class="btn-primary">Edit</button>
        <button id="assignSCP" class="btn-primary">Assign SCP</button>
        <button id="closeBlueprint" class="btn-primary">Close</button>
      </div>
    `);
    document.getElementById('closeBlueprint').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    document.getElementById('editBlueprint').onclick = () => { this.app.audio.play('click'); this.openEdit(id); };
    document.getElementById('assignSCP').onclick = () => { this.app.audio.play('click'); this.openAssignDialog(id); };
  }

  openAssignDialog(bpId) {
    const bp = (this.app.blueprints || []).find(b => b.id === bpId);
    if (!bp) return;
    const availableSCPs = this.app.scps.filter(s => !(bp.assignedSCPs || []).includes(s.id));
    if (!availableSCPs.length) {
      this.app.ui.toast('No unassigned SCPs available');
      return;
    }
    const html = `<h4>Assign SCP to ${bp.name}</h4><p>Capacity: ${(bp.assignedSCPs || []).length}/${bp.capacity}</p>${
      availableSCPs.map(s => `<label style="display:block;margin:8px 0;"><input type="radio" name="assignScp" value="${s.id}"> SCP-${s.number}: ${s.name} (${s.class})</label>`).join('')
    }<button id="doAssign" class="btn-primary" style="margin-top:12px;">Assign</button>`;
    this.app.ui.openModal(html);
    document.getElementById('doAssign').onclick = () => {
      const selected = document.querySelector('input[name="assignScp"]:checked')?.value;
      if (selected) {
        this.app.audio.play('success');
        bp.assignedSCPs = bp.assignedSCPs || [];
        bp.assignedSCPs.push(parseInt(selected, 10));
        this.app.storage.save('blueprints', this.app.blueprints);
        this.app.ui.toast('SCP assigned to facility');
        this.app.ui.closeModal();
        this.view(bpId);
      }
    };
  }

  openEdit(id) {
    const bp = (this.app.blueprints || []).find(b => b.id === id);
    if (!bp) return;
    this.app.ui.openModal(`
      <h3>Edit ${bp.name}</h3>
      <div class="form-group">
        <label>Facility Name</label>
        <input id="editBpName" value="${bp.name}">
      </div>
      <div class="form-group">
        <label>Security Level</label>
        <select id="editBpLevel">
          <option value="Low" ${bp.level==='Low'?'selected':''}>Low</option>
          <option value="Moderate" ${bp.level==='Moderate'?'selected':''}>Moderate</option>
          <option value="High" ${bp.level==='High'?'selected':''}>High</option>
          <option value="Top Secret" ${bp.level==='Top Secret'?'selected':''}>Top Secret</option>
        </select>
      </div>
      <div class="form-group">
        <label>Containment Capacity (approx.)</label>
        <input type="number" id="editBpCapacity" min="1" value="${bp.capacity}">
      </div>
      <div class="form-group">
        <label>Primary Purpose</label>
        <input id="editBpPurpose" value="${bp.purpose}">
      </div>
      <div class="form-group">
        <label>Blueprint Description / Layout</label>
        <textarea id="editBpDescription" rows="5">${bp.description || ''}</textarea>
      </div>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <button id="saveBpEdit" class="btn-primary">Save Changes</button>
        <button id="cancelBpEdit" class="btn-primary">Cancel</button>
      </div>
    `);
    document.getElementById('cancelBpEdit').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    document.getElementById('saveBpEdit').onclick = () => {
      this.app.audio.play('success');
      bp.name = document.getElementById('editBpName').value.trim() || bp.name;
      bp.level = document.getElementById('editBpLevel').value || bp.level;
      bp.capacity = parseInt(document.getElementById('editBpCapacity').value || `${bp.capacity}`, 10);
      bp.purpose = document.getElementById('editBpPurpose').value.trim() || bp.purpose;
      bp.description = document.getElementById('editBpDescription').value.trim();
      this.app.storage.save('blueprints', this.app.blueprints);
      this.renderList();
      this.app.ui.toast('Blueprint updated');
      this.app.ui.closeModal();
    };
  }

  async generateAI() {
    const name = document.getElementById('bpName').value.trim() || 'Unnamed Site';
    const level = document.getElementById('bpLevel').value || 'High';
    const capacity = parseInt(document.getElementById('bpCapacity').value || '20', 10);
    const purpose = document.getElementById('bpPurpose').value.trim() || 'Mixed containment and research';
    this.app.ui.toast('Generating blueprint (about 10s)...');
    try {
      const text = await this.app.ai.generateBlueprintDescription({ name, level, purpose, capacity });
      document.getElementById('bpDescription').value = text;
      this.app.audio.play('success');
      this.app.ui.toast('AI blueprint applied');
    } catch {
      this.app.audio.play('failure');
      this.app.ui.toast('AI blueprint generation failed');
    }
  }
}

