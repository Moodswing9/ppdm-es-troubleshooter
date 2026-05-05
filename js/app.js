/* =========================================================
   PPDM Elasticsearch Troubleshooter — Application Logic
   ========================================================= */

'use strict';

/* ── State ────────────────────────────────────────────────── */
const state = {
  activeChecks:  new Set(),
  checkResults:  {},
  selectedError: null,
  darkMode:      false,
  settings: {
    ppdmHost: '192.168.1.50',
    ppdmPort: '8443',
    esHost:   '192.168.1.100',
    esPort:   '9200',
    esUser:   'ppdm_search'
  }
};

/* ── Utilities ────────────────────────────────────────────── */
const sleep = ms => new Promise(r => setTimeout(r, ms));

function $(id)   { return document.getElementById(id); }
function ts()    { return new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'; }

function addLog(message, type = 'info') {
  const viewer = $('logViewer');
  if (!viewer) return;
  const line = document.createElement('div');
  line.className = `log-line log-${type}`;
  line.textContent = `[${ts()}] ${type.toUpperCase().padEnd(5)}: ${message}`;
  viewer.appendChild(line);
  viewer.scrollTop = viewer.scrollHeight;
}

function copyToClipboard(el) {
  const text = el.dataset.cmd || el.textContent.trim();
  navigator.clipboard.writeText(text).then(() => {
    const prev = el.textContent;
    el.textContent = '✓ Copied!';
    el.style.color = '#a5d6a7';
    setTimeout(() => { el.textContent = prev; el.style.color = ''; }, 2000);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  });
}

/* ── Settings Panel ───────────────────────────────────────── */
function toggleSettings() {
  const panel = $('settingsPanel');
  panel.classList.toggle('open');
}

function saveSettings() {
  state.settings.ppdmHost   = $('cfgPpdmHost').value.trim()   || state.settings.ppdmHost;
  state.settings.ppdmPort   = $('cfgPpdmPort').value.trim()   || state.settings.ppdmPort;
  state.settings.esHost     = $('cfgEsHost').value.trim()     || state.settings.esHost;
  state.settings.esPort     = $('cfgEsPort').value.trim()     || state.settings.esPort;
  state.settings.esUser     = $('cfgEsUser').value.trim()     || state.settings.esUser;
  state.settings.anthropicKey = $('cfgAnthropicKey').value.trim() || state.settings.anthropicKey || '';
  addLog(`Settings saved — ES: ${state.settings.esHost}:${state.settings.esPort}`, 'info');
  toggleSettings();
}

/* ── Dark Mode ────────────────────────────────────────────── */
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : '');
  $('darkModeBtn').textContent = state.darkMode ? '☀️' : '🌙';
  addLog(`Switched to ${state.darkMode ? 'dark' : 'light'} mode`, 'info');
}

/* ── Diagnostic Items ─────────────────────────────────────── */
function toggleDiagnostic(el) {
  document.querySelectorAll('.diagnostic-item').forEach(d => d.classList.remove('active'));
  el.classList.add('active');
}

/* ── Run a Single Check ───────────────────────────────────── */
async function runCheck(type) {
  if (state.activeChecks.has(type)) return;
  state.activeChecks.add(type);

  const btn      = document.querySelector(`[data-check="${type}"]`);
  const progBar  = $(`progress-${type}`);
  const progFill = progBar.querySelector('.progress-fill');
  const panel    = $(`result-${type}`);

  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Running…'; }
  progBar.classList.add('active');
  panel.classList.remove('show');
  addLog(`Starting check: ${type}`, 'info');

  for (let i = 0; i <= 100; i += 25) {
    progFill.style.width = `${i}%`;
    await sleep(280);
  }

  const scenario  = diagnosticScenarios[type];
  const critical  = scenario.checks.some(c => c.status === 'critical');
  const hasIssue  = scenario.checks.some(c => c.status !== 'pass');
  state.checkResults[type] = { critical, hasIssue };

  panel.className = `result-panel show ${critical ? 'result-error' : hasIssue ? 'result-warning' : 'result-success'}`;
  panel.innerHTML = buildResultHTML(scenario, critical, hasIssue);

  progBar.classList.remove('active');
  progFill.style.width = '0%';
  if (btn) { btn.disabled = false; btn.innerHTML = 'Re-check'; }

  state.activeChecks.delete(type);
  addLog(`Check "${type}" → ${critical ? 'CRITICAL' : hasIssue ? 'WARNING' : 'PASS'}`,
    critical ? 'error' : hasIssue ? 'warn' : 'ok');
  updateWorkflowStep2(type, critical, hasIssue);
}

function buildResultHTML(scenario, critical, hasIssue) {
  const iconMap   = { pass: '✅', warning: '⚠️', critical: '❌' };
  const colorMap  = { pass: 'detail-pass', warning: 'detail-warning', critical: 'detail-critical' };
  const sevMap    = { pass: 'low', warning: 'medium', critical: 'critical' };

  let html = `<div class="section-label">Diagnostic Results</div>`;
  scenario.checks.forEach(c => {
    html += `
      <div class="check-row">
        <span class="check-row-icon">${iconMap[c.status] || '❓'}</span>
        <div class="check-row-body">
          <div class="check-row-name">${c.name}</div>
          <div class="check-row-detail ${colorMap[c.status] || ''}">${c.detail}</div>
        </div>
        <span class="severity-indicator severity-${sevMap[c.status] || 'low'}">${c.status.toUpperCase()}</span>
      </div>`;
  });

  if (scenario.remediation.length) {
    html += `<div class="section-label" style="margin-top:16px;">Recommended Actions</div>`;
    scenario.remediation.forEach((action, i) => {
      html += `<div class="remediation-step"><span class="step-num">${i + 1}.</span><span>${action}</span></div>`;
    });
  }
  return html;
}

/* ── Full Diagnostics ─────────────────────────────────────── */
async function runFullDiagnostics() {
  const btn     = $('fullDiagBtn');
  const spinner = $('fullDiagSpinner');

  btn.disabled = true;
  spinner.style.display = 'inline-block';
  addLog('Starting full system diagnostics…', 'info');

  for (const type of Object.keys(diagnosticScenarios)) {
    await runCheck(type);
    await sleep(400);
  }

  spinner.style.display = 'none';
  btn.disabled = false;
  refreshMetrics();
  addLog('Full diagnostics complete.', 'ok');
}

/* ── Metrics ──────────────────────────────────────────────── */
function refreshMetrics() {
  const results   = state.checkResults;
  const anyCrit   = Object.values(results).some(r => r.critical);
  const anyWarn   = Object.values(results).some(r => r.hasIssue);
  const hasData   = Object.keys(results).length > 0;

  const statusBadge = $('overallStatus');
  const indexVal    = $('indexHealth');
  const esNodes     = $('esNodes');
  const lastBackup  = $('lastBackup');
  const queryRate   = $('queryRate');

  if (hasData) {
    if (anyCrit) {
      statusBadge.className = 'status-badge status-critical';
      statusBadge.textContent = '🔴 Critical Issues';
      if (indexVal) { indexVal.textContent = 'RED'; indexVal.className = 'metric-value critical'; }
    } else if (anyWarn) {
      statusBadge.className = 'status-badge status-warning';
      statusBadge.textContent = '🟡 Warnings Present';
      if (indexVal) { indexVal.textContent = 'YELLOW'; indexVal.className = 'metric-value warn'; }
    } else {
      statusBadge.className = 'status-badge status-healthy';
      statusBadge.textContent = '🟢 System Healthy';
      if (indexVal) { indexVal.textContent = 'GREEN'; indexVal.className = 'metric-value ok'; }
    }
  }

  if (esNodes)    { esNodes.textContent = '3 / 3'; esNodes.className = 'metric-value ok'; }
  if (lastBackup) { lastBackup.textContent = '2 h ago'; }
  if (queryRate)  { queryRate.textContent = '450 / s'; }

  addLog('Metrics refreshed.', 'info');
}

/* ── Workflow ─────────────────────────────────────────────── */
function selectErrorPattern(pattern) {
  state.selectedError = pattern;

  document.querySelectorAll('.error-tag').forEach(t => {
    t.classList.toggle('selected', t.dataset.pattern === pattern);
  });

  const data  = errorPatterns[pattern];
  const step1 = $('step1');
  const step3 = $('step3');

  step1.classList.add('completed');
  step3.style.opacity = '1';

  const sevLabel = { critical: 'severity-critical', high: 'severity-high', medium: 'severity-medium', low: 'severity-low' };
  const steps = data.steps.map(s => `<li style="margin: 7px 0;">${s}</li>`).join('');
  const cmds  = data.commands.map(c => `
    <div class="code-block" onclick="copyToClipboard(this)" data-cmd="${c.replace(/"/g, '&quot;')}">${c}</div>`).join('');

  $('remediationActions').innerHTML = `
    <div style="margin-bottom:14px;">
      <span class="severity-indicator ${sevLabel[data.severity] || 'severity-low'}">${data.severity.toUpperCase()} SEVERITY</span>
      <h3 style="margin-top:10px; font-size:1.05rem;">${data.title}</h3>
    </div>
    <div class="section-label">Resolution Steps</div>
    <ol style="padding-left:20px; margin-bottom:16px;">${steps}</ol>
    <div class="section-label">Useful Commands</div>
    ${cmds}`;

  addLog(`Error pattern selected: ${data.title}`, 'info');
}

function updateWorkflowStep2(type, critical, hasIssue) {
  const step2 = $('step2');
  step2.style.opacity = '1';
  step2.classList.add('completed');

  const color  = critical ? 'var(--danger)' : hasIssue ? 'var(--warning)' : 'var(--success)';
  const status = critical ? 'CRITICAL' : hasIssue ? 'WARNING' : 'HEALTHY';
  const label  = diagnosticScenarios[type]?.label || type;

  $('diagnosticResults').innerHTML += `
    <div style="margin:5px 0; padding:8px 12px; background:${color}18; border-radius:8px; border-left:3px solid ${color};">
      <strong>${label}:</strong>
      <span style="color:${color}; font-weight:700; margin-left:6px;">${status}</span>
    </div>`;
}

/* ── Export ───────────────────────────────────────────────── */
function exportReport() {
  addLog('Generating diagnostic report…', 'info');

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      tool:        'PPDM ES Troubleshooter v1.0',
      ppdmHost:    state.settings.ppdmHost,
      esHost:      state.settings.esHost,
      esPort:      state.settings.esPort
    },
    summary: {
      anyCritical:  Object.values(state.checkResults).some(r => r.critical),
      anyWarning:   Object.values(state.checkResults).some(r => r.hasIssue),
      checksRun:    Object.keys(state.checkResults).length,
      selectedErrorPattern: state.selectedError
    },
    checkResults: Object.fromEntries(
      Object.entries(state.checkResults).map(([k, v]) => [
        k,
        {
          label:    diagnosticScenarios[k]?.label,
          critical: v.critical,
          hasIssue: v.hasIssue,
          checks:   diagnosticScenarios[k]?.checks,
          remediation: diagnosticScenarios[k]?.remediation
        }
      ])
    )
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `ppdm-es-diagnostic-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  addLog('Report exported to downloads.', 'ok');
}

function printReport() {
  window.print();
}

/* ── Log Viewer ───────────────────────────────────────────── */
function clearLogs() {
  $('logViewer').innerHTML = '';
  addLog('Log viewer cleared.', 'info');
}

/* ── AI Diagnose — Claude Haiku 4.5 ──────────────────────── */

function toggleAiPanel() {
  const panel = $('aiDiagnosePanel');
  const btn   = $('aiToggleBtn');
  const open  = panel.style.display === 'none';
  panel.style.display = open ? 'block' : 'none';
  btn.textContent = open ? '▲ Collapse' : '▼ Expand';
}

function clearAiOutput() {
  $('aiLogInput').value = '';
  $('aiOutput').style.display = 'none';
  $('aiOutputBody').textContent = '';
  $('aiRedactedNote').textContent = '';
}

function redactPII(text) {
  return text
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b(?:password|passwd|pwd|secret|token|key)\s*[:=]\s*\S+/gi, '[CREDENTIAL]=***');
}

async function callClaudeAPI(prompt, apiKey) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: (
        'You are an expert Dell EMC PowerProtect Data Manager (PPDM) and Elasticsearch administrator. '
        + 'Analyse the provided log excerpt or symptom description and output:\n'
        + '1. Root Cause: one sentence diagnosis\n'
        + '2. Severity: Critical | High | Medium | Low\n'
        + '3. Affected Component: which ES or PPDM subsystem\n'
        + '4. Immediate Actions: numbered list of concrete remediation steps with exact CLI commands\n'
        + '5. Prevention: 1-2 sentences on preventing recurrence\n\n'
        + 'Be concise and precise. Use real PPDM/ES commands (mminfo, nsradmin, curl ES REST API, etc.).'
      ),
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data.content?.[0]?.text || '(no response)';
}

async function runAiDiagnose() {
  const apiKey = state.settings.anthropicKey || $('cfgAnthropicKey')?.value?.trim();
  if (!apiKey) {
    addLog('Anthropic API key required — open Settings and enter your sk-ant-… key.', 'error');
    alert('Please enter your Anthropic API key in Settings (⚙️) first.');
    return;
  }

  const rawInput = $('aiLogInput').value.trim();
  if (!rawInput) {
    addLog('AI Diagnose: no input provided.', 'warn');
    return;
  }

  const btn = $('aiDiagnoseBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Analysing…';
  $('aiOutput').style.display = 'none';
  addLog('AI Diagnose: redacting PII…', 'info');

  try {
    const redacted = redactPII(rawInput);
    const piiCount = (rawInput.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || []).length
                   + (rawInput.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi) || []).length;

    addLog('AI Diagnose: calling Claude Haiku 4.5 for analysis…', 'info');
    const diagnosis = await callClaudeAPI(redacted, apiKey);

    $('aiOutputBody').textContent = diagnosis;
    $('aiRedactedNote').textContent = piiCount > 0
      ? `ℹ️  ${piiCount} PII token(s) were automatically redacted before sending to the AI.`
      : 'ℹ️  No PII patterns detected in the input.';
    $('aiOutput').style.display = 'block';
    addLog('AI Diagnose complete.', 'ok');
  } catch (err) {
    addLog(`AI Diagnose error: ${err.message}`, 'error');
    $('aiOutputBody').textContent = `Error: ${err.message}`;
    $('aiOutput').style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔍 Analyse with AI';
  }
}

/* ── Init ─────────────────────────────────────────────────── */
window.addEventListener('load', () => {
  addLog('PPDM Elasticsearch Troubleshooter initialized.', 'ok');
  addLog(`Target ES: ${state.settings.esHost}:${state.settings.esPort}`, 'info');
  addLog(`Target PPDM: ${state.settings.ppdmHost}:${state.settings.ppdmPort}`, 'info');
  addLog('Ready — run diagnostics or select an error pattern.', 'info');

  /* Prefill settings fields */
  state.settings.anthropicKey = '';
  const fields = { cfgPpdmHost: 'ppdmHost', cfgPpdmPort: 'ppdmPort',
                   cfgEsHost: 'esHost', cfgEsPort: 'esPort', cfgEsUser: 'esUser' };
  Object.entries(fields).forEach(([id, key]) => {
    const el = $(id);
    if (el) el.value = state.settings[key];
  });
});
