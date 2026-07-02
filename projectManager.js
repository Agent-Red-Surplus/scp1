export class ProjectManager {
  constructor(app) {
    this.app = app;
  }

  create(e) {
    e.preventDefault();
    const name = document.getElementById('projName').value.trim();
    const description = document.getElementById('projDescription').value.trim();
    const objective = document.getElementById('projObjective').value.trim();
    const teamSize = parseInt(document.getElementById('projTeamSize').value || '1', 10);
    const useAI = document.getElementById('projAIGenerate').checked;

    if (!name || !description || !objective) {
      this.app.ui.toast('Please fill in all required fields');
      this.app.audio.play('failure');
      return;
    }

    const project = {
      id: Date.now(),
      name,
      description,
      objective,
      teamSize,
      assignedSCPs: [],
      created: new Date().toISOString()
    };

    if (useAI) {
      this.app.ui.toast('Generating project details...');
      this.app.ai.aiGenerateProjectDescription({ name, objective, description }).then(details => {
        project.details = details;
        this.finalizeSave(project);
      }).catch(() => {
        project.details = description;
        this.finalizeSave(project);
      });
    } else {
      project.details = description;
      this.finalizeSave(project);
    }
  }

  finalizeSave(project) {
    const projects = this.app.storage.load('projects', []);
    projects.unshift(project);
    this.app.storage.save('projects', projects);
    document.getElementById('projectForm').reset();
    this.renderList();
    this.app.ui.toast(`Project "${project.name}" created`);
    this.app.audio.play('success');
    this.app.modifyReputation(5);
  }

  deployTemplate() {
    const tpl = document.getElementById('projTemplate')?.value;
    if (!tpl) { this.app.ui.toast('Select a project template'); return; }
    // Templates aligned with the select options in index.html
    const templates = {
      'paragon': {
        name: 'Project Paragon',
        objective: 'Develop next-generation universal containment procedures',
        description: 'Cross-site task force focused on synthesizing best practices from high-profile SCP incidents to produce a unified containment doctrine.',
        teamSize: 18
      },
      'anthology': {
        name: 'Project Anthology',
        objective: 'Catalog and cross-link anomalous narratives and memetic storylines',
        description: 'A dedicated archivist and memetics team mapping narrative-based anomalies, identifying shared patterns, and predicting emergent infohazards.',
        teamSize: 10
      },
      'sentinel': {
        name: 'Project Sentinel',
        objective: 'Deploy early-warning systems for large-scale anomalous events',
        description: 'Engineering and analytics initiative to integrate thaumic sensors, satellite monitoring, and pattern-recognition AIs into a single alert network.',
        teamSize: 16
      }
    };
    const t = templates[tpl];
    if (!t) return;
    const project = {
      id: Date.now(),
      name: t.name,
      description: t.description,
      objective: t.objective,
      teamSize: t.teamSize,
      assignedSCPs: [],
      created: new Date().toISOString(),
      details: t.description
    };
    const projects = this.app.storage.load('projects', []);
    projects.unshift(project);
    this.app.storage.save('projects', projects);
    this.renderList();
    this.app.ui.toast(`Project \"${project.name}\" deployed`);
    this.app.audio.play('success');
    this.app.modifyReputation(5);
  }

  renderList() {
    const container = document.getElementById('projectList');
    if (!container) return;
    const projects = this.app.storage.load('projects', []);
    container.innerHTML = projects.length ? projects.map(p => `
      <div class="scp-card" onclick="app.viewProject(${p.id})">
        <h4>${p.name}</h4>
        <p><strong>Objective:</strong> ${p.objective}</p>
        <p><strong>Team:</strong> ${p.teamSize} personnel | <strong>SCPs:</strong> ${(p.assignedSCPs || []).length}</p>
        <p>${(p.description || '').substring(0, 100)}...</p>
      </div>
    `).join('') : '<p class="empty-state">No projects yet. Start a new research initiative.</p>';
  }

  view(id) {
    const project = (this.app.storage.load('projects', []) || []).find(p => p.id === id);
    if (!project) return;

    const scpList = (project.assignedSCPs || []).length > 0
      ? (project.assignedSCPs || []).map(scpId => {
          const scp = this.app.scps.find(s => s.id === scpId);
          return scp ? `<li>SCP-${scp.number}: ${scp.name} (${scp.class})</li>` : '';
        }).join('')
      : '<li><em>No SCPs assigned yet</em></li>';

    this.app.ui.openModal(`
      <h3>${project.name}</h3>
      <p><strong>Objective:</strong> ${project.objective}</p>
      <p><strong>Team Size:</strong> ${project.teamSize} personnel</p>
      <p><strong>Assigned SCPs:</strong> ${(project.assignedSCPs || []).length}</p>
      <h4>Description</h4>
      <p>${project.details || project.description}</p>
      <h4>Assigned SCPs</h4>
      <ul style="margin-left:18px;">${scpList}</ul>
      <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
        <button id="assignScpToProject" class="btn-primary">Add SCP</button>
        <button id="editProject" class="btn-primary">Edit</button>
        <button id="deleteProject" class="btn-danger">Delete Project</button>
        <button id="closeProject" class="btn-primary">Close</button>
      </div>
    `);
    document.getElementById('closeProject').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    document.getElementById('editProject').onclick = () => { this.app.audio.play('click'); this.openEdit(id); };
    document.getElementById('assignScpToProject').onclick = () => { this.app.audio.play('click'); this.openAssignDialog(id); };

    document.getElementById('deleteProject').onclick = () => {
      if (!confirm(`Permanently delete project "${project.name}"? This cannot be undone.`)) {
        this.app.audio.play('failure');
        return;
      }
      this.app.audio.play('success');
      const projects = this.app.storage.load('projects', []);
      const idx = projects.findIndex(p => p.id === project.id);
      if (idx > -1) projects.splice(idx, 1);
      this.app.storage.save('projects', projects);
      try { this.renderList(); } catch (e) {}
      this.app.ui.closeModal();
      this.app.ui.toast(`Project "${project.name}" deleted`);
    };
  }

  openAssignDialog(projId) {
    const project = (this.app.storage.load('projects', []) || []).find(p => p.id === projId);
    if (!project) return;
    const availableSCPs = this.app.scps.filter(s => !(project.assignedSCPs || []).includes(s.id));
    if (!availableSCPs.length) {
      this.app.ui.toast('No unassigned SCPs available');
      return;
    }
    const html = `<h4>Add SCP to ${project.name}</h4><p>Currently: ${(project.assignedSCPs || []).length} SCP(s)</p>${
      availableSCPs.map(s => `<label style="display:block;margin:8px 0;"><input type="radio" name="assignScpProj" value="${s.id}"> SCP-${s.number}: ${s.name} (${s.class})</label>`).join('')
    }<button id="doAssignProj" class="btn-primary" style="margin-top:12px;">Add to Project</button>`;
    this.app.ui.openModal(html);

    document.getElementById('doAssignProj').onclick = () => {
      const selected = document.querySelector('input[name="assignScpProj"]:checked')?.value;
      if (selected) {
        this.app.audio.play('success');

        // Load projects array, update the correct project entry, then persist
        const projects = this.app.storage.load('projects', []);
        const idx = projects.findIndex(p => p.id === project.id);
        if (idx !== -1) {
          projects[idx].assignedSCPs = projects[idx].assignedSCPs || [];
          projects[idx].assignedSCPs.push(parseInt(selected, 10));
        } else {
          project.assignedSCPs = project.assignedSCPs || [];
          project.assignedSCPs.push(parseInt(selected, 10));
          projects.unshift(project);
        }
        this.app.storage.save('projects', projects);

        // ensure the main project list UI updates so assigned SCP counts are refreshed
        try { this.renderList(); } catch (e) {}

        this.app.ui.toast('SCP added to project');
        this.app.ui.closeModal();
        this.view(projId);
      }
    };
  }

  openEdit(id) {
    const project = (this.app.storage.load('projects', []) || []).find(p => p.id === id);
    if (!project) return;
    this.app.ui.openModal(`
      <h3>Edit ${project.name}</h3>
      <div class="form-group">
        <label>Project Name</label>
        <input id="editProjName" value="${project.name}">
      </div>
      <div class="form-group">
        <label>Objective</label>
        <input id="editProjObjective" value="${project.objective}">
      </div>
      <div class="form-group">
        <label>Team Size (personnel)</label>
        <input type="number" id="editProjTeamSize" min="1" value="${project.teamSize}">
      </div>
      <div class="form-group">
        <label>Description / Details</label>
        <textarea id="editProjDetails" rows="5">${project.details || project.description}</textarea>
      </div>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <button id="saveProjEdit" class="btn-primary">Save Changes</button>
        <button id="cancelProjEdit" class="btn-primary">Cancel</button>
      </div>
    `);
    document.getElementById('cancelProjEdit').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
    document.getElementById('saveProjEdit').onclick = () => {
      this.app.audio.play('success');
      project.name = document.getElementById('editProjName').value.trim() || project.name;
      project.objective = document.getElementById('editProjObjective').value.trim() || project.objective;
      project.teamSize = parseInt(document.getElementById('editProjTeamSize').value || `${project.teamSize}`, 10);
      project.details = document.getElementById('editProjDetails').value.trim() || project.details;
      const projects = this.app.storage.load('projects', []);
      this.app.storage.save('projects', projects);

      // refresh the project list so any displayed counts update immediately
      try { this.renderList(); } catch (e) {}

      this.app.ui.toast('Project updated');
      this.app.ui.closeModal();
    };
  }
}

