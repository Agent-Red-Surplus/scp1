export class AIService {
  async aiGenerateContainment({ number, name, cls, description }) {
    try {
      const completion = await websim.chat.completions.create({
        messages: [
          { role: "system", content: "You write precise, actionable Special Containment Procedures for SCP entries. Keep it under 180 words, formal tone, numbered steps when suitable." },
          { role: "user", content: `Write Special Containment Procedures for SCP-${number} "${name}" (Class: ${cls}). Description: ${description}` }
        ]
      });
      return completion.content.trim();
    } catch {
      return "Standard containment locker with Level-2 access. Monitor and escalate per protocol.";
    }
  }
  async generateImageUrl(prompt, aspect) {
    const result = await websim.imageGen({ prompt, aspect_ratio: aspect });
    return result.url;
  }
  async generateExperimentResult({ scp, hypothesis, method }) {
    const completion=await websim.chat.completions.create({
      messages:[
        {role:"system",content:"You write concise experiment results for SCP tests in 3-6 sentences, clinical tone, note safety observations and outcomes."},
        {role:"user",content:`SCP context: SCP-${scp.number} "${scp.name}" Class: ${scp.class}. Description: ${scp.description}. Hypothesis: ${hypothesis}. Method: ${method}. Produce the observed result.`}
      ]
    });
    return completion.content.trim();
  }

  async analyzeIncident({ scp, responders = [], context = "breach" }) {
    try {
      const respondersText = responders.length 
        ? responders.map(r => `${r.designation} (${r.members} members, strength ${r.strength}/10)`).join('; ') 
        : 'No immediate response';
        
      const prompt = `Analyze an SCP Foundation containment incident.
SCP-${scp.number}: "${scp.name}"
Class: ${scp.class}
Danger Level: ${scp.dangerLevel || 'N/A'}/10
Description: ${scp.description}
Context: ${context === 'breach' ? 'The anomaly has spontaneously breached its primary containment.' : 'An MTF team attempted to re-contain the anomaly but failed.'}
Responders: ${respondersText}

Determine a realistic casualty count and provide a clinical incident report.
- Safe-class or friendly anomalies (e.g., SCP-999 "The Tickle Monster") MUST cause 0 casualties.
- Keter/Apollyon anomalies can cause massive losses (100 to 500+).
- Euclid anomalies usually cause low to moderate losses (1 to 50).
- MTF presence might slightly mitigate losses even in a failed attempt.

Respond with JSON only:
{
  "casualties": number,
  "summary": "3-5 sentence clinical report of the incident including the casualty toll and reason for the failure/breach",
  "recommendation": "One short follow-up action"
}`;

      const completion = await websim.chat.completions.create({
        messages: [
          { role: "system", content: "You are a senior SCP Foundation incident analyst. Provide high-fidelity, lore-accurate casualty assessments. Respond with JSON only." },
          { role: "user", content: prompt }
        ],
        json: true
      });
      return JSON.parse(completion.content);
    } catch (e) {
      const base = { Safe: 0, Euclid: 10, Keter: 80, Apollyon: 300 }[scp.class] ?? 5;
      return { 
        casualties: Math.round(Math.random() * base), 
        summary: `SCP-${scp.number} involved in a containment event. Site security compromised.`,
        recommendation: "Review containment procedures and increase guard rotation."
      };
    }
  }

  async summarizeContainment({ scp, success, casualties, responders, chance, roll }) {
    // If it's a failure, we probably used analyzeIncident already to get casualties, 
    // but if success=true, we still need a quick success summary.
    if (!success) {
      // If we don't have a report yet, generate one
      return this.analyzeIncident({ scp, responders, context: 'failed_containment' }).then(res => res.summary);
    }
    
    try {
      const respondersText = responders.length ? responders.map(r=>`${r.designation}`).join(', ') : 'No responders';
      const completion = await websim.chat.completions.create({
        messages: [
          { role: "system", content: "Write a 3-sentence success report for an SCP re-containment. Formal clinical tone." },
          { role: "user", content: `SCP-${scp.number} "${scp.name}" re-contained successfully by ${respondersText}.` }
        ]
      });
      return completion.content.trim();
    } catch (e) {
      return `SCP-${scp.number} successfully re-contained. All protocols restored.`;
    }
  }

  async aiGenerateProjectDescription({ name, objective, description }) {
    try {
      const completion = await websim.chat.completions.create({
        messages: [
          { role: "system", content: "You write detailed SCP Foundation research project descriptions. Include objectives, methodologies, expected outcomes, and strategic importance. Keep it under 200 words, professional tone." },
          { role: "user", content: `Write a detailed description for research project "${name}". Objective: ${objective}. Initial description: ${description}. Provide a comprehensive project outline.` }
        ]
      });
      return completion.content.trim();
    } catch {
      return description;
    }
  }

  async generateBlueprintDescription({ name, level, purpose, capacity }) {
    try {
      const completion = await websim.chat.completions.create({
        messages: [
          { role: "system", content: "You write detailed SCP Foundation facility layouts and architectural descriptions. Include security zones, containment wing configurations, research areas, and security measures. Keep it under 250 words, professional tone." },
          { role: "user", content: `Design a facility blueprint for "${name}" (Security Level: ${level}, Capacity: ~${capacity} SCPs). Primary Purpose: ${purpose}. Describe the layout, zones, and key features.` }
        ]
      });
      return completion.content.trim();
    } catch {
      return "Standard tiered containment facility with perimeter security, central command center, humanoid containment wing, and research laboratory. Multiple redundant power and containment systems.";
    }
  }

  async generateRealisticBattle({ scp1, scp2 }) {
    try {
      const prompt = `You are analyzing a realistic combat scenario between two SCP Foundation anomalies.

SCP-${scp1.number}: "${scp1.name}" (Class: ${scp1.class})
Description: ${scp1.description}
Special Containment Procedures: ${scp1.containment}

SCP-${scp2.number}: "${scp2.name}" (Class: ${scp2.class})
Description: ${scp2.description}
Special Containment Procedures: ${scp2.containment}

Based on the actual capabilities and properties described, provide a comprehensive battle analysis in JSON format:
{
  "winner": "SCP-XXX",
  "winnerName": "name",
  "loserName": "name",
  "reason": "2-3 sentence explanation of why the winner would prevail based on specific abilities",
  "matchupAnalysis": "Analysis of key strengths, weaknesses, and how their abilities interact (3-4 sentences)",
  "battleDescription": "4-5 sentence vivid description of how the encounter would unfold, key turning points",
  "phases": ["Phase 1: description", "Phase 2: description", "Phase 3: description"],
  "winnerHP": 65,
  "loserHP": 20
}`;
      
      const completion = await websim.chat.completions.create({
        messages: [
          { role: "system", content: "You are an SCP Foundation combat analyst. Provide detailed, realistic outcomes based on canonical SCP properties and abilities. Consider containment procedures and documented interactions. Respond with pure JSON only." },
          { role: "user", content: prompt }
        ],
        json: true
      });
      
      return JSON.parse(completion.content);
    } catch (e) {
      return null;
    }
  }

  async generateInvestigationReport({ scp, scientist }) {
    // Create multiple stylistic/system prompt variants so the AI produces different reports each time
    const systemVariants = [
      `You are an SCP Foundation senior research analyst.
Write a detailed, in-universe investigation report of at least 320 words (aim for 320–450 words).
Use a clinical, formal tone and structure the report into clear sections with headings in ALL CAPS (e.g., OVERVIEW, OBSERVATIONS, ANALYSIS, RISKS, RECOMMENDATIONS).
Reference the assigned investigator by name and role.
Highlight anomalous behaviors, prior containment incidents (if implied by the description), theoretical mechanisms, and recommended follow-up tests or containment improvements.
Do not include markdown, bullet characters, or lists; just plain paragraphs with headings in-text.
Favor cautious conservatism in claims.`,

      `You are a senior Foundation field investigator writing an in-depth dossier.
Compose a vivid investigation report (320–450 words) with ALL-CAPS headings (OVERVIEW, OBSERVATIONS, ANALYSIS, RISKS, RECOMMENDATIONS).
Adopt a slightly narrative investigative voice while remaining professional — include anecdotal field notes, possible hypotheses, and procedural suggestions.
Avoid lists or markdown; write continuous paragraphs separated by headings.`,

      `You are an institutional analyst drafting a director-level investigation for internal circulation.
Produce a comprehensive report (320–450 words) with ALL-CAPS sections (OVERVIEW, OBSERVATIONS, ANALYSIS, RISKS, RECOMMENDATIONS).
Use crisp, clipped sentences and emphasize policy implications, containment costs, and recommended experiments.
Keep the tone formal but bring in memetic caution notes where appropriate.`,

      `You are a forensic research lead creating an investigative report.
Write 320–450 words with ALL-CAPS headings (OVERVIEW, OBSERVATIONS, ANALYSIS, RISKS, RECOMMENDATIONS).
Include hypothesized mechanisms, experimental suggestions, red-team failure modes, and ethical considerations.
Use plain paragraphs with headings; vary sentence rhythm and include at least one evocative observation of incident footage or logs.`
    ];

    // Small helper to pick a random element
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // Append a subtle random seed phrase to encourage varied outputs (non-semantic)
    const seedPhrase = ` [seed:${Math.floor(Math.random() * 1000000)}]`;

    // Build the user prompt; include seed but keep original structured content
    const userPrompt = `
SCP: SCP-${scp.number} "${scp.name}"
Class: ${scp.class}
Anomaly Type: ${scp.anomalyType || 'Unknown'}
Primary Ability / Threat: ${scp.primaryAbility || 'Unknown'}
Danger Level: ${scp.dangerLevel || 'N/A'}/10

Special Containment Procedures:
${scp.containment}

Description:
${scp.description}

Assigned Investigator:
Name: ${scientist.name}
Role: ${scientist.role}
Department: ${scientist.department}
Clearance: ${scientist.clearance}

Produce a full investigation report as if authored by the assigned investigator and reviewed by Foundation oversight.${seedPhrase}
`;

    // Choose a system variant to increase stylistic diversity
    const systemPrompt = pick(systemVariants);

    try {
      const completion = await websim.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
      // Trim and return AI-produced content; small post-processing to ensure length
      const out = completion.content ? completion.content.trim() : '';
      if (out.length < 120) {
        // fallback: request a shorter alternate phrasing from the AI to ensure content richness
        try {
          const alt = await websim.chat.completions.create({
            messages: [
              { role: "system", content: pick(systemVariants) },
              { role: "user", content: userPrompt + "\nPlease expand the report with additional observations and analysis." }
            ]
          });
          return (alt.content || out).trim();
        } catch (e) {
          return out || `INVESTIGATION SUMMARY

Assigned investigator ${scientist.name} (${scientist.role}) conducted a preliminary review of SCP-${scp.number}. Due to a data error, the full report could not be generated.`;
        }
      }
      return out;
    } catch (e) {
      return `INVESTIGATION SUMMARY

Assigned investigator ${scientist.name} (${scientist.role}) conducted a preliminary review of SCP-${scp.number}. Due to a data corruption event, the full report could not be reconstructed. However, current evidence indicates that the anomaly requires continued monitoring and standard experimental protocols.`;
    }
  }

  async generateLore({ scps, foundationName }) {
    try {
      // Filter-out neutralized SCPs and ensure we have items
      const filtered = (scps || []).filter(s => (s.class || '').toLowerCase() !== 'neutralized');
      if (!filtered.length) return `No active SCPs available for lore generation.`;

      // Helper: shuffle array in-place (Fisher-Yates)
      function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      // Randomize order so inputs vary between calls
      const randomized = shuffle(filtered.slice());

      // Build concise summaries for the prompt (truncated to keep prompt size sane)
      const scpSummaries = randomized.map(s => {
        return `SCP-${s.number}: "${s.name}" — Class: ${s.class}. Primary Ability: ${s.primaryAbility || 'Unknown'}. Danger Level: ${s.dangerLevel || 'N/A'}. Short description: ${ (s.description || '').slice(0, 300) }`;
      }).join('\n\n');

      // Provide several stylistic system prompts and pick one at random to vary voice/angle
      const systemVariants = [
        `You are an in-universe Foundation historian and narrative architect. Compose a long-form dossier-level lore narrative (700–1000 words) in a clinical but atmospheric in-universe voice. Use ALL-CAPS headings (ORIGIN, INCIDENT CHRONOLOGY, CROSS-CONNECTIONS, ANALYSIS, RECOMMENDATIONS). Weave motifs, memetic footnotes, personnel notes, and ambiguous connective tissue. Avoid neutralized SCPs. Leave questions unresolved for narrative depth.`,
        `You are a clandestine Foundation archivist drafting an extended dossier aimed at senior staff. Produce a layered, investigative narrative (700–1000 words) with ALL-CAPS sections. Emphasize institutional consequences, coverups, human cost, and recurring anomalies. Adopt an ominous, slowly-unfolding tone; vary sentence rhythm and include at least one evocative incident vignette.`,
        `You are a director-level chronicler assembling a strategic dossier. Create a continuous 700–1000 word narrative with ALL-CAPS headings (ORIGIN, INCIDENT CHRONOLOGY, CROSS-CONNECTIONS, ANALYSIS, RECOMMENDATIONS). Focus on policy, memetic risk, and cross-SCP implications; include operational vignettes and subtle conspiratorial threads.`,
        `You are a narrative analyst blending field notes and archival reports. Produce 700–1000 words with ALL-CAPS headings. Use a slightly poetic but formal in-universe voice, include an extended incident vignette, and weave SCPs together via motifs and unanswered inferences. Avoid lists; prefer flowing paragraphs under headings.`
      ];
      const systemPrompt = systemVariants[Math.floor(Math.random() * systemVariants.length)];

      // Append a short, random seed phrase to encourage variation on the AI side
      const seedPhrase = ` [seed:${Math.floor(Math.random() * 1000000)}]`;

      const userPrompt = `Foundation: ${foundationName || 'The Foundation'}.
SCP Inventory (filtered summaries, neutralized entries excluded):
${scpSummaries}

Using the above inventory, produce a continuous, deeply detailed lore dossier (700–1000 words). Structure it with ALL-CAPS headings (ORIGIN, INCIDENT CHRONOLOGY, CROSS-CONNECTIONS, ANALYSIS, RECOMMENDATIONS), keep narrative flow (not a letter or list), weave recurring motifs and ambiguous connections between SCPs, include at least one evocative incident vignette, and end with a director-level strategic outlook and open questions for future investigation.${seedPhrase}`;

      // Submit to AI with the randomized system prompt and user prompt
      const completion = await websim.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      return completion.content.trim();
    } catch (e) {
      return `The Foundation dossier could not be generated due to service limitations.`;
    }
  }
}