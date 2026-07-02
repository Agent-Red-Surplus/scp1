export class BattleManager {
  constructor(app) {
    this.app = app;
  }

  setupSelects() {
    const selects = [document.getElementById('battleScp1'), document.getElementById('battleScp2')];
    // Only exclude Neutralized entries; explicitly allow Safe-class SCPs (including Safe with non-neutralized states)
    const candidates = this.app.scps.filter(s => s.class !== 'Neutralized' && s.state !== 'Neutralized');
    selects.forEach(select => {
      if (!select) return;
      select.innerHTML =
        '<option value="">Select SCP...</option>' +
        candidates.map(s => `<option value="${s.id}">SCP-${s.number}: ${s.name}</option>`).join('');
    });
  }

  updateInfo(num) {
    const selectId = `battleScp${num}`;
    const infoId = `battleScp${num}Info`;
    const select = document.getElementById(selectId);
    const info = document.getElementById(infoId);
    
    if (!select || !info) return;
    
    const scpId = parseInt(select.value, 10);
    const scp = this.app.scps.find(s => s.id === scpId);
    
    if (!scp) {
      info.innerHTML = '';
      return;
    }

    const power = this._calcPower(scp);
    info.innerHTML = `
      <p><strong>SCP-${scp.number}</strong></p>
      <p>${scp.name}</p>
      <p style="margin-top:8px;font-size:0.85rem;">Class: <span class="class-badge class-${scp.class}">${scp.class}</span></p>
      <p style="margin-top:6px;font-size:0.85rem;">Power Level: ${power}</p>
    `;
  }

  _calcPower(scp) {
    // Expanded class bases to include new classes (Apollyon = near-max, Archon = strategic high, Esoteric = unpredictable)
    // Give Safe-class SCPs a modest combat viability bump so they can meaningfully participate.
    const classBase = { Safe: 45, Euclid: 60, Keter: 90, Thaumiel: 85, Apollyon: 98, Archon: 88, Esoteric: 70, Neutralized: 5 }[scp.class] ?? 50;
    const descLength = (scp.description || '').length;
    const boost = Math.min(20, Math.floor(descLength / 100));
    return Math.min(100, classBase + boost);
  }

  async simulate() {
    const select1 = document.getElementById('battleScp1');
    const select2 = document.getElementById('battleScp2');
    
    if (!select1 || !select2) return;

    const scpId1 = parseInt(select1.value, 10);
    const scpId2 = parseInt(select2.value, 10);

    const scp1 = this.app.scps.find(s => s.id === scpId1);
    const scp2 = this.app.scps.find(s => s.id === scpId2);

    if (!scp1 || !scp2) {
      this.app.ui.toast('Please select two SCPs');
      this.app.audio.play('failure');
      return;
    }

    if (scp1.id === scp2.id) {
      this.app.ui.toast('Please select two different SCPs');
      this.app.audio.play('failure');
      return;
    }

    // NEW: Detect two Apollyon SCPs and offer secret SCP generation
    if ((scp1.class === 'Apollyon') && (scp2.class === 'Apollyon')) {
      this.app.ui.openModal(`
        <h3>Unusual Encounter Detected</h3>
        <p style="margin-top:8px;color:var(--text-muted);">You have selected two APOLLYON-class anomalies. Generate a hidden secret SCP inspired by "tralalero tralala" and create a custom class <strong>WHY‽</strong> to contain it?</p>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button id="generateSecretSCP" class="btn-primary">Generate Secret SCP</button>
          <button id="cancelSecretSCP" class="btn-primary">Cancel</button>
        </div>
      `);
      document.getElementById('cancelSecretSCP').onclick = () => { this.app.audio.play('click'); this.app.ui.closeModal(); };
      document.getElementById('generateSecretSCP').onclick = () => {
        this.app.audio.play('experiment_start');
        // Create custom class WHY‽ if not present
        const customClasses = this.app.storage.load('customClasses', []);
        if (!customClasses.find(c => c.name === 'WHY‽')) {
          const color = `hsl(${Math.floor(Math.random()*360)}deg 65% 55%)`;
          customClasses.push({ id: Date.now(), name: 'WHY‽', desc: 'An esoteric classification reserved for anomalous entities of confounding origin.', color });
          this.app.storage.save('customClasses', customClasses);
          if (this.app.updateCustomClassDisplay) this.app.updateCustomClassDisplay();
          if (this.app.updateSCPClassOptions) this.app.updateSCPClassOptions();
        }

        // Create the secret SCP (based on "tralalero tralala")
        const secret = {
          id: Date.now() + 1,
          number: `WHY-${Math.floor(Math.random()*900)+100}`,
          name: 'Tralalero Tralala — THE DISCORDANT CHORUS',
          class: 'WHY‽',
          containment: `Containment Procedures: Isolate object in an acoustically and cognitohazardically sealed chamber. Do not allow synchronous group singing or rhythmic chanting within 500m of containment. All auditory logs are to be frequency-scrubbed and reviewed by memetics. Access requires O5 oversight.`,
          description: `OVERVIEW:
An anomalous memetic-auditory phenomenon manifesting as layered children's chorus vocalizations that cause sudden, reality-discordant perceptual shifts in listeners. Patterns of melody correlate with localized probability inversions and short-term narrative bleed. Exposure can lead to compulsion to hum or sing the motif, increasing contagion.

EFFECTS:
Listeners may experience brief temporal skips, memory misordering, and the spontaneous appearance of small, non-lethal anomalies synchronized to the chorus.

RECOMMENDATIONS:
Maintain strict acoustic isolation and limited observational exposure. Deploy memetic dampers and thaumaturgical scrubbing for any personnel exposed.`,
          image: '',
          anomalyType: 'Memetic/Auditory',
          primaryAbility: 'Chorus-induced reality-discord and memetic contagion',
          dangerLevel: 9,
          state: 'Contained',
          created: new Date().toISOString()
        };

        this.app.scps.unshift(secret);
        this.app.storage.save('scps', this.app.scps);
        // Refresh UI
        try { this.app.battle.setupSelects(); } catch (e) {}
        try { this.app.scp.updateStats(); this.app.scp.renderRecent(); this.app.scp.renderArchive(); } catch (e) {}
        this.app.audio.play('success');
        this.app.ui.toast(`Secret SCP created: SCP-${secret.number} "${secret.name}" (Class: WHY‽)`);
        this.app.ui.closeModal();
      };
      return;
    }

    this.app.ui.toast('Analyzing combat parameters via AI...');
    this.app.audio.play('experiment_start');

    // Get AI-generated realistic battle outcome
    const aiResult = await this.app.ai.generateRealisticBattle({ scp1, scp2 });
    
    setTimeout(() => {
      const winner = aiResult && aiResult.winner === `SCP-${scp1.number}` ? scp1 : scp2;
      const loser = winner.id === scp1.id ? scp2 : scp1;
      const winHP = aiResult?.winnerHP || 65;
      const loseHP = aiResult?.loserHP || 20;
      const reason = aiResult?.reason || 'Analyzing combat capabilities...';
      const battleDesc = aiResult?.battleDescription || 'The encounter unfolds in a complex display of anomalous interactions.';
      const matchupAnalysis = aiResult?.matchupAnalysis || 'Unable to determine matchup dynamics.';
      const phases = aiResult?.phases || [];

      let phasesHtml = '';
      if (phases.length > 0) {
        phasesHtml = `<h4 style="margin-top:20px;margin-bottom:12px;">⏱️ Battle Phases</h4><div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:12px;">`;
        phases.forEach((phase, i) => {
          phasesHtml += `<div style="margin-bottom:10px;padding:10px;background:var(--surface);border-radius:6px;border-left:3px solid var(--primary);"><p style="margin:0;font-size:0.9rem;"><strong>Phase ${i+1}:</strong> ${phase}</p></div>`;
        });
        phasesHtml += `</div>`;
      }

      const results = document.getElementById('battleResults');
      results.innerHTML = `
        <div style="background:var(--surface);padding:25px;border:2px solid var(--border);border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.3);">
          <h3 style="margin-bottom:25px;text-align:center;">⚡ AI-Analyzed Battle Report ⚡</h3>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:25px;">
            <div style="padding:20px;background:var(--surface-light);border-radius:12px;border-top:4px solid ${winner.id === scp1.id ? '#4CAF50' : '#F44336'};">
              <h4>SCP-${scp1.number}</h4>
              <p style="color:var(--text-muted);margin-bottom:12px;font-size:0.95rem;">${scp1.name}</p>
              <p style="font-size:0.9rem;"><strong>Class:</strong> <span class="class-badge class-${scp1.class}">${scp1.class}</span></p>
              <p style="font-size:0.9rem;margin-top:8px;"><strong>Final Status:</strong> <span style="color:${winner.id === scp1.id ? '#4CAF50' : '#F44336'};">${winner.id === scp1.id ? '✓ VICTOR' : '✗ DEFEATED'}</span></p>
              <p style="font-size:0.9rem;margin-top:6px;"><strong>Remaining Integrity:</strong> ${winner.id === scp1.id ? winHP : loseHP}%</p>
              <div style="margin-top:8px;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                <div style="width:${winner.id === scp1.id ? winHP : loseHP}%;height:100%;background:${winner.id === scp1.id ? '#4CAF50' : '#F44336'};"></div>
              </div>
            </div>
            <div style="padding:20px;background:var(--surface-light);border-radius:12px;border-top:4px solid ${winner.id === scp2.id ? '#4CAF50' : '#F44336'};">
              <h4>SCP-${scp2.number}</h4>
              <p style="color:var(--text-muted);margin-bottom:12px;font-size:0.95rem;">${scp2.name}</p>
              <p style="font-size:0.9rem;"><strong>Class:</strong> <span class="class-badge class-${scp2.class}">${scp2.class}</span></p>
              <p style="font-size:0.9rem;margin-top:8px;"><strong>Final Status:</strong> <span style="color:${winner.id === scp2.id ? '#4CAF50' : '#F44336'};">${winner.id === scp2.id ? '✓ VICTOR' : '✗ DEFEATED'}</span></p>
              <p style="font-size:0.9rem;margin-top:6px;"><strong>Remaining Integrity:</strong> ${winner.id === scp2.id ? winHP : loseHP}%</p>
              <div style="margin-top:8px;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                <div style="width:${winner.id === scp2.id ? winHP : loseHP}%;height:100%;background:${winner.id === scp2.id ? '#4CAF50' : '#F44336'};"></div>
              </div>
            </div>
          </div>

          <div style="margin-bottom:20px;padding:18px;background:rgba(255,255,255,0.05);border-radius:12px;border-left:4px solid var(--primary);">
            <h4 style="margin-bottom:10px;color:var(--primary);">📊 Matchup Analysis</h4>
            <p style="font-size:0.95rem;line-height:1.6;">${matchupAnalysis}</p>
          </div>

          <div style="margin-bottom:20px;padding:18px;background:rgba(255,255,255,0.05);border-radius:12px;border-left:4px solid var(--primary);">
            <h4 style="margin-bottom:10px;color:var(--primary);">⚙️ Encounter Description</h4>
            <p style="font-size:0.95rem;line-height:1.6;">${battleDesc}</p>
          </div>

          ${phasesHtml}

          <div style="padding:18px;background:var(--surface-light);border-left:4px solid var(--primary);border-radius:12px;margin-top:20px;">
            <h4 style="margin-bottom:8px;">🏆 VICTOR: SCP-${winner.number}</h4>
            <p style="font-size:0.95rem;margin:0;line-height:1.6;"><strong>${winner.name}</strong> emerges victorious.</p>
            <p style="font-size:0.9rem;margin-top:8px;color:var(--text-muted);">${reason}</p>
          </div>
        </div>
      `;
      this.app.audio.play('battle_end');

      // Apply reputation changes: small boost for victor, penalty for defeated (reflects public perception & morale)
      try {
        this.app.modifyReputation(5);   // victor +5
        this.app.modifyReputation(-5);  // defeated -5
      } catch (e) {}

    }, 1500);
  }
}

