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
  state.settings.ppdmHost = $('cfgPpdmHost').value.trim() || state.settings.ppdmHost;
  state.settings.ppdmPort = $('cfgPpdmPort').value.trim() || state.settings.ppdmPort;
  state.settings.esHost   = $('cfgEsHost').value.trim()   || state.settings.esHost;
  state.settings.esPort   = $('cfgEsPort').value.trim()   || state.settings.esPort;
  state.settings.esUser   = $('cfgEsUser').value.trim()   || state.settings.esUser;
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

/* ── Init ─────────────────────────────────────────────────── */
window.addEventListener('load', () => {
  addLog('PPDM Elasticsearch Troubleshooter initialized.', 'ok');
  addLog(`Target ES: ${state.settings.esHost}:${state.settings.esPort}`, 'info');
  addLog(`Target PPDM: ${state.settings.ppdmHost}:${state.settings.ppdmPort}`, 'info');
  addLog('Ready — run diagnostics or select an error pattern.', 'info');

  /* Prefill settings fields */
  const fields = { cfgPpdmHost: 'ppdmHost', cfgPpdmPort: 'ppdmPort',
                   cfgEsHost: 'esHost', cfgEsPort: 'esPort', cfgEsUser: 'esUser' };
  Object.entries(fields).forEach(([id, key]) => {
    const el = $(id);
    if (el) el.value = state.settings[key];
  });
});
