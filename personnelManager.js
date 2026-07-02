export class PersonnelManager {
  constructor(app) {
    this.app = app;
  }

  create(e) {
    e.preventDefault();
    const name = document.getElementById('perName').value.trim();
    const role = document.getElementById('perRole').value.trim();
    const clearance = document.getElementById('perClearance').value;
    const department = document.getElementById('perDepartment').value.trim();

    if (!name || !role || !clearance || !department) {
      this.app.ui.toast('Please fill in all personnel fields');
      this.app.audio.play('failure');
      return;
    }

    const personnel = {
      id: Date.now(),
      name,
      role,
      clearance,
      department,
      created: new Date().toISOString()
    };

    const list = this.app.storage.load('personnel', []);
    list.unshift(personnel);
    this.app.storage.save('personnel', list);
    document.getElementById('personnelForm').reset();
    this.renderList();
    this.app.ui.toast(`Personnel "${name}" created`);
    this.app.audio.play('success');
  }

  deployTemplate() {
    const tpl = document.getElementById('perTemplate')?.value;
    if (!tpl) { this.app.ui.toast('Select a personnel template'); return; }
    const templates = {
      'lead-researcher': { name: 'Dr. Elizabeth Finch', role: 'Lead Anomalous Researcher', clearance: 'Level-5', department: 'Research Directorate' },
      'security-chief': { name: 'Commander Marcus Dawe', role: 'Facility Security Director', clearance: 'Level-4', department: 'Internal Security' },
      'field-agent': { name: 'Agent Helena Martinez', role: 'Field Response Operative', clearance: 'Level-3', department: 'MTF Operations' }
    };
    const t = templates[tpl];
    if (!t) return;
    const personnel = {
      id: Date.now(),
      name: t.name,
      role: t.role,
      clearance: t.clearance,
      department: t.department,
      created: new Date().toISOString()
    };
    const list = this.app.storage.load('personnel', []);
    list.unshift(personnel);
    this.app.storage.save('personnel', list);
    this.renderList();
    this.app.ui.toast(`Personnel \"${personnel.name}\" added`);
    this.app.audio.play('success');
  }

  createCustomClearance(e) {
    e.preventDefault();
    const name = document.getElementById('customClearanceName').value.trim();
    const level = parseInt(document.getElementById('customClearanceLevel').value || '5', 10);
    const desc = document.getElementById('customClearanceDesc').value.trim();

    if (!name) {
      this.app.ui.toast('Please enter a clearance name');
      this.app.audio.play('failure');
      return;
    }

    const customLevels = this.app.storage.load('customClearanceLevels', []);
    const exists = customLevels.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      this.app.ui.toast('Clearance level already exists');
      this.app.audio.play('failure');
      return;
    }

    customLevels.push({ id: Date.now(), name, level, desc });
    this.app.storage.save('customClearanceLevels', customLevels);
    document.getElementById('customClearanceForm').reset();
    this.updateClearanceSelects();
    this.app.ui.toast(`Custom clearance "${name}" created`);
    this.app.audio.play('success');
  }

  renderList() {
    const container = document.getElementById('personnelList');
    if (!container) return;
    const list = this.app.storage.load('personnel', []);
    container.innerHTML = list.length ? list.map(p => `
      <div class="scp-card" onclick="app.personnel.view(${p.id})">
        <h4>${p.name}</h4>
        <span class="class-badge" style="background:var(--primary);color:var(--background);">${p.clearance}</span>
        <p><strong>Role:</strong> ${p.role}</p>
        <p><strong>Department:</strong> ${p.department}</p>
      </div>
    `).join('') : '<p class="empty-state">No personnel created yet.</p>';
  }

  view(id) {
    const list = this.app.storage.load('personnel', []);
    const p = list.find(x => x.id === id);
    if (!p) return;

    this.app.ui.openModal(`
      <h3>${p.name}</h3>
      <p><strong>Role:</strong> ${p.role}</p>
      <p><strong>Department:</strong> ${p.department}</p>
      <p><strong>Clearance Level:</strong> ${p.clearance}</p>
      <p style="color:var(--text-muted);font-size:0.9rem;margin-top:12px;">Created: ${new Date(p.created).toLocaleDateString()}</p>
      <div style="display:flex;gap:8px;margin-top:15px;">
        <button id="editPer" class="btn-primary">Edit</button>
        <button id="removePer" class="btn-danger">Remove</button>
        <button id="closePer" class="btn-primary">Close</button>
      </div>
    `);

    document.getElementById('closePer').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    document.getElementById('editPer').onclick = () => { this.app.audio.play('click'); this.openEdit(id); };
    document.getElementById('removePer').onclick = () => {
      if (confirm(`Remove ${p.name}?`)) {
        this.app.audio.play('success');
        const list = this.app.storage.load('personnel', []);
        const idx = list.findIndex(x => x.id === id);
        if (idx > -1) list.splice(idx, 1);
        this.app.storage.save('personnel', list);
        this.renderList();
        this.app.ui.closeModal();
        this.app.ui.toast('Personnel removed');
      }
    };
  }

  openEdit(id) {
    const list = this.app.storage.load('personnel', []);
    const p = list.find(x => x.id === id);
    if (!p) return;

    const customLevels = this.app.storage.load('customClearanceLevels', []);
    const clearanceOptions = [
      'O5', 'Level-5', 'Level-4', 'Level-3', 'Level-2', 'Level-1', 'Level-0',
      ...customLevels.map(c => c.name)
    ];

    this.app.ui.openModal(`
      <h3>Edit ${p.name}</h3>
      <div class="form-group">
        <label>Name</label>
        <input id="editPerName" value="${p.name}">
      </div>
      <div class="form-group">
        <label>Role</label>
        <input id="editPerRole" value="${p.role}">
      </div>
      <div class="form-group">
        <label>Clearance Level</label>
        <select id="editPerClearance">
          ${clearanceOptions.map(opt => `<option value="${opt}" ${p.clearance === opt ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Department</label>
        <input id="editPerDept" value="${p.department}">
      </div>
      <div style="display:flex;gap:8px;">
        <button id="savePerEdit" class="btn-primary">Save</button>
        <button id="cancelPerEdit" class="btn-primary">Cancel</button>
      </div>
    `);

    document.getElementById('cancelPerEdit').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    document.getElementById('savePerEdit').onclick = () => {
      p.name = document.getElementById('editPerName').value.trim() || p.name;
      p.role = document.getElementById('editPerRole').value.trim() || p.role;
      p.clearance = document.getElementById('editPerClearance').value || p.clearance;
      p.department = document.getElementById('editPerDept').value.trim() || p.department;
      this.app.storage.save('personnel', list);
      this.renderList();
      this.app.audio.play('success');
      this.app.ui.closeModal();
      this.app.ui.toast('Personnel updated');
    };
  }

  updateClearanceSelects() {
    const customLevels = this.app.storage.load('customClearanceLevels', []);
    const select = document.getElementById('perClearance');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Select Clearance</option>' +
      '<option value="O5">O5 (Highest)</option>' +
      '<option value="Level-5">Level-5</option>' +
      '<option value="Level-4">Level-4</option>' +
      '<option value="Level-3">Level-3</option>' +
      '<option value="Level-2">Level-2</option>' +
      '<option value="Level-1">Level-1</option>' +
      '<option value="Level-0">Level-0 (Basic)</option>' +
      customLevels.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    
    select.value = currentValue;
  }
}

