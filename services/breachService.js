export class BreachService {
  constructor(app){ this.app = app; }
  start(){
    clearInterval(this._timer);
    this._timer = setInterval(async () => {
      // Only consider active, non-neutralized SCPs that are not Safe-class (Safe cannot breach)
      const scps = (this.app.scps || []).filter(s => s && s.class !== 'Safe' && s.class !== 'Neutralized' && s.state !== 'Breached');
      if(!scps.length) return;
      const s = scps[Math.floor(Math.random() * scps.length)];
      if(!s) return;
      
      // Breach probabilities (Safe intentionally excluded above so not present here)
      let probMap = { Euclid: 0.03, Keter: 0.06, Thaumiel: 0.02, Apollyon: 0.005, Archon: 0.015, Esoteric: 0.04 };
      let prob = probMap[s.class] ?? 0.03;
      
      const diffMod = {'easy': 0.5, 'normal': 1.0, 'hard': 2.0, 'nightmare': 4.0}[this.app.settings.difficulty || 'normal'] || 1.0;
      prob *= diffMod;
      
      if(Math.random() < prob){
        await this.handleBreach(s);
      }
    }, 30000);
  }

  async handleBreach(s) {
    s.state = 'Breached';
    this.app.storage.save('scps', this.app.scps);
    this.app.audio.play('alarm');

    // AI Analysis of the breach
    const report = await this.app.ai.analyzeIncident({ scp: s, context: 'breach' });
    const casualties = report.casualties || 0;
    
    this.app.addCasualties(casualties);
    this.app.modifyReputation(-25);
    
    // Log operation
    const ops = this.app.storage.load('ops', []);
    ops.unshift({ 
      type: 'breach', 
      scpId: s.id, 
      casualties, 
      summary: report.summary,
      created: new Date().toISOString() 
    });
    this.app.storage.save('ops', ops);

    if (this.app.settings.breachNotifications ?? true) {
      const msg = casualties > 0 
        ? `ALERT: SCP-${s.number} breached! ${casualties} casualties. ${report.summary}`
        : `ALERT: SCP-${s.number} breached! No casualties reported. ${report.summary}`;
      this.app.ui.toast(msg);
    }

    this.app.scp.renderArchive();
    this.app.scp.renderRecent();
    this.app.scp.updateStats();
    this.app.renderOps();
  }
}
