export class ExperimentManager {
  constructor(app) { this.app = app; }
  openList(scpId) {
    const exps = this.app.storage.load('experiments', []).filter(x=>x.scpId===scpId);
    const list = exps.length ? exps.map(x=>`<div class=\"scp-card\"><h4>${x.title}</h4><p><strong>Hypothesis:</strong> ${x.hypothesis}</p><p><strong>Method:</strong> ${x.method}</p><p><strong>Result:</strong> ${x.result||'<em>Pending</em>'}</p></div>`).join('') : '<p class=\"empty-state\">No experiments yet.</p>';
    this.app.ui.openModal(`<h3>Experiments for SCP</h3><div style=\"margin:12px 0;\">${list}</div><button id=\"newExp\" class=\"btn-primary\">New Experiment</button>`);
    document.getElementById('newExp').onclick = () => { this.app.audio.play('click'); this.openCreate(scpId); };
  }
  openCreate(scpId) {
    this.app.ui.openModal(
      `<h3>New Experiment</h3>
      <div class="form-group"><label>Title</label><input id="expTitle" placeholder="Experiment title"></div>
      <div class="form-group"><label>Hypothesis</label><input id="expHyp" placeholder="What do you expect?"></div>
      <div class="form-group"><label>Method</label><textarea id="expMethod" rows="4" placeholder="Step-by-step method"></textarea></div>
      <div style="display:flex; gap:8px;">
        <button id="saveExp" class="btn-primary">Save</button>
        <button id="saveExpAI" class="btn-primary">Save + AI Result</button>
      </div>`
    );
    document.getElementById('saveExp').onclick = () => { this.app.audio.play('experiment_start'); this.save(scpId,false); };
    document.getElementById('saveExpAI').onclick = () => { this.app.audio.play('experiment_start'); this.save(scpId,true); };
  }
  async save(scpId,useAI) {
    const title=document.getElementById('expTitle').value.trim();
    const hypothesis=document.getElementById('expHyp').value.trim();
    const method=document.getElementById('expMethod').value.trim();
    if(!title||!method){ this.app.ui.toast('Title and Method required'); return; }
    let result='';
    if(useAI){
      this.app.ui.toast('Generating experiment result...');
      const scp=this.app.scps.find(s=>s.id===scpId);
      try{ result = await this.app.ai.generateExperimentResult({ scp, hypothesis, method }); }
      catch{ result='Result inconclusive due to unexpected variables.'; }
    }
    const all=this.app.storage.load('experiments', []);
    all.unshift({ id:Date.now(), scpId, title, hypothesis, method, result, created:new Date().toISOString() });
    this.app.storage.save('experiments', all);
    this.app.ui.toast('Experiment saved');
    this.app.audio.play('success');
    // reward small reputation for performing experiments (larger for AI-assisted results)
    try { this.app.modifyReputation(useAI ? 2 : 1); } catch (e) {}
    this.openList(scpId);
  }
}