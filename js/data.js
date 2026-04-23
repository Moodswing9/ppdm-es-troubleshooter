/* =========================================================
   PPDM Elasticsearch Troubleshooter — Diagnostic Data
   ========================================================= */

'use strict';

const diagnosticScenarios = {
  connectivity: {
    label: 'Network Connectivity',
    checks: [
      { name: 'DNS Resolution',  status: 'pass',    detail: 'es-cluster.ppdm.local → 192.168.1.100' },
      { name: 'Port 9200 TCP',   status: 'pass',    detail: 'Connection established in 12 ms' },
      { name: 'Port 9300 TCP',   status: 'pass',    detail: 'Transport layer accessible' },
      { name: 'HTTP Response',   status: 'warning', detail: 'HTTP 200 but response time 2.3 s (threshold: 1 s)' }
    ],
    remediation: [
      'Check network latency between PPDM and ES nodes',
      'Verify firewall rules for ports 9200 and 9300',
      'Consider increasing connection timeout in PPDM config'
    ]
  },

  service: {
    label: 'Service Status',
    checks: [
      { name: 'ES Process',       status: 'pass',    detail: 'PID 18432 running since 2026-04-20' },
      { name: 'JVM Status',       status: 'pass',    detail: 'OpenJDK 17, heap 8 GB / 16 GB' },
      { name: 'Thread Pools',     status: 'warning', detail: 'Search queue: 45 / 1000 (elevated)' },
      { name: 'Circuit Breakers', status: 'pass',    detail: 'All breakers closed' }
    ],
    remediation: [
      'Monitor search thread pool queue depth',
      'Scale ES data nodes if queue is consistently high',
      'Review expensive search queries in PPDM'
    ]
  },

  credentials: {
    label: 'Authentication',
    checks: [
      { name: 'Certificate Validity', status: 'pass',    detail: 'Valid until 2027-01-15' },
      { name: 'Certificate Chain',    status: 'pass',    detail: 'Root CA trusted' },
      { name: 'Basic Auth',           status: 'pass',    detail: 'User ppdm_search authenticated' },
      { name: 'Role Permissions',     status: 'warning', detail: 'Missing monitor privilege on .security index' }
    ],
    remediation: [
      'Grant monitor privilege to ppdm_search user',
      'Verify certificate renewal schedule',
      'Check LDAP / AD integration if using external auth'
    ]
  },

  memory: {
    label: 'Memory Pressure',
    checks: [
      { name: 'Heap Usage',      status: 'warning', detail: '78% (12.5 GB / 16 GB) — above 75% threshold' },
      { name: 'GC Collections',  status: 'warning', detail: 'Young GC: 45 / min (elevated)' },
      { name: 'Fielddata Cache', status: 'pass',    detail: 'Using 234 MB of 1 GB limit' },
      { name: 'Segment Memory',  status: 'pass',    detail: '2.3 GB for 45 segments' }
    ],
    remediation: [
      'Increase heap size if physical memory is available (max 32 GB)',
      'Enable doc_values for high-cardinality fields',
      'Clear fielddata cache: POST /_cache/clear',
      'Consider force merge to reduce segment count'
    ]
  },

  disk: {
    label: 'Disk Usage',
    checks: [
      { name: 'Total Disk',     status: 'pass',    detail: '500 GB total per node' },
      { name: 'Used Disk',      status: 'warning', detail: '420 GB (84%) — approaching high watermark (85%)' },
      { name: 'Index Store',    status: 'pass',    detail: 'Throttling not active' },
      { name: 'Snapshot Repo',  status: 'pass',    detail: '/mnt/backup accessible' }
    ],
    remediation: [
      'URGENT: Free disk space or expand storage before watermark breach',
      'Delete old indices via Curator or ILM lifecycle policies',
      'Enable read-only-allow-delete at flood stage',
      'Move shards to nodes with more available disk space'
    ]
  },

  shards: {
    label: 'Shard Distribution',
    checks: [
      { name: 'Active Shards',      status: 'pass',     detail: '450 / 450 active' },
      { name: 'Unassigned Shards',  status: 'critical', detail: '12 unassigned (2 indices affected)' },
      { name: 'Relocating',         status: 'pass',     detail: '0 relocating' },
      { name: 'Initializing',       status: 'pass',     detail: '0 initializing' }
    ],
    remediation: [
      'CRITICAL: Investigate unassigned shards immediately',
      'Run: GET /_cluster/allocation/explain',
      'Possible node failure or disk watermark breach',
      'Reroute shards: POST /_cluster/reroute'
    ]
  },

  indices: {
    label: 'Index Health',
    checks: [
      { name: 'ppdm-assets', status: 'pass',    detail: 'Green — 5 shards, 1.2 M docs' },
      { name: 'ppdm-jobs',   status: 'warning', detail: 'Yellow — 1 unassigned replica' },
      { name: 'ppdm-logs',   status: 'pass',    detail: 'Green — 3 shards, 45 M docs' },
      { name: '.kibana',     status: 'pass',    detail: 'Green — 1 shard' }
    ],
    remediation: [
      'For yellow ppdm-jobs: check replica allocation',
      'Run: PUT /ppdm-jobs/_settings {"index.number_of_replicas": 0}',
      'If persistently yellow, check node availability'
    ]
  },

  corruption: {
    label: 'Corruption Detection',
    checks: [
      { name: 'Segment Check',   status: 'pass', detail: 'All segments verified' },
      { name: 'Translog',        status: 'pass', detail: 'No truncation detected' },
      { name: 'Checksum',        status: 'pass', detail: 'All checksums valid' },
      { name: 'Lucene Version',  status: 'pass', detail: 'Compatible with ES 8.11' }
    ],
    remediation: [
      'Data integrity confirmed — no immediate action required',
      'Schedule regular _cluster/health checks',
      'Maintain snapshot schedule for point-in-time recovery'
    ]
  },

  'ppdm-config': {
    label: 'Search Service Config',
    checks: [
      { name: 'Search Endpoint', status: 'pass',    detail: 'https://es-cluster:9200' },
      { name: 'Index Prefix',    status: 'pass',    detail: 'ppdm-' },
      { name: 'Batch Size',      status: 'warning', detail: '10 000 — may cause memory pressure' },
      { name: 'Retry Policy',    status: 'pass',    detail: '3 retries with exponential backoff' }
    ],
    remediation: [
      'Consider reducing batch size to 5 000',
      'Verify PPDM version compatibility with ES version',
      'Check search timeout settings (default 30 s)'
    ]
  },

  'ppdm-logs': {
    label: 'PPDM Log Analysis',
    checks: [
      { name: 'Search Service', status: 'warning', detail: '3 ERROR entries in last hour' },
      { name: 'Index Rate',     status: 'pass',    detail: '1 200 docs / sec' },
      { name: 'Query Rate',     status: 'pass',    detail: '450 queries / sec' },
      { name: 'Failed Queries', status: 'warning', detail: '2% failure rate (target < 1%)' }
    ],
    remediation: [
      'Investigate ERROR entries: grep "ERROR" /var/log/ppdm/*.log',
      'Check for query timeouts in the PPDM UI',
      'Review search patterns that are causing failures'
    ]
  }
};

/* ─── Error Patterns ───────────────────────────────────── */
const errorPatterns = {
  connection: {
    title: 'Connection Refused / Unreachable',
    severity: 'high',
    steps: [
      'Verify ES service is running: systemctl status elasticsearch',
      'Check network connectivity: curl -v http://es-host:9200',
      'Validate firewall rules and security groups for ports 9200 / 9300',
      'Review PPDM search service configuration file (ppdm-search.properties)',
      'Verify DNS resolution and /etc/hosts entries'
    ],
    commands: [
      'curl -X GET "localhost:9200/_cluster/health?pretty"',
      'netstat -tlnp | grep 9200',
      'systemctl status elasticsearch'
    ]
  },

  timeout: {
    title: 'Query Timeout',
    severity: 'medium',
    steps: [
      'Increase timeout in PPDM config: search.timeout=60s',
      'Identify long-running queries: GET /_tasks?detailed=true&actions=*search*',
      'Optimize queries by adding filters or reducing result scope',
      'Scale ES cluster if CPU is consistently high',
      'Enable query caching for repeated patterns'
    ],
    commands: [
      'GET /_tasks?detailed=true&actions=*search*',
      'GET /_nodes/hot_threads',
      'PUT /_cluster/settings {"transient":{"search.default_search_timeout":"60s"}}'
    ]
  },

  auth: {
    title: 'Authentication Failed',
    severity: 'high',
    steps: [
      'Verify credentials stored in PPDM keystore',
      'Check certificate expiration dates with openssl',
      'Validate user permissions in Elasticsearch',
      'Regenerate certificates if expired',
      'Check LDAP / AD connectivity if using SSO'
    ],
    commands: [
      'GET /_security/user/ppdm_search',
      'openssl x509 -in /etc/ppdm/certs/es.pem -text -noout | grep -A2 Validity',
      'keytool -list -v -keystore /etc/ppdm/keystore.jks'
    ]
  },

  memory: {
    title: 'Out of Memory / Circuit Breaker Tripped',
    severity: 'critical',
    steps: [
      'Increase JVM heap size in jvm.options (do not exceed 32 GB)',
      'Tighten circuit breaker limits to reject large requests early',
      'Clear fielddata cache: POST /_cache/clear',
      'Close unused indices to reclaim heap',
      'Add more data nodes to distribute load'
    ],
    commands: [
      'GET /_nodes/stats/jvm',
      'POST /_cache/clear',
      'GET /_nodes/hot_threads?type=wait'
    ]
  },

  disk: {
    title: 'Disk Full / Watermark Breached',
    severity: 'critical',
    steps: [
      'Free disk space immediately — indices may become read-only',
      'Delete old indices via Curator or ILM retention policies',
      'Add new data nodes or expand existing storage volumes',
      'Temporarily raise watermark threshold while remediation proceeds',
      'Enable flood-stage read-only mode if disk is critically low'
    ],
    commands: [
      'GET /_cat/allocation?v',
      'DELETE /ppdm-logs-2026.03.*',
      'PUT /_cluster/settings {"transient":{"cluster.routing.allocation.disk.watermark.high":"90%"}}'
    ]
  },

  red: {
    title: 'Red Cluster Status',
    severity: 'critical',
    steps: [
      'Identify unassigned primary shards: GET /_cat/shards?h=index,shard,prirep,state,node',
      'Get allocation failure explanation: GET /_cluster/allocation/explain',
      'Restart the failed node if it is recoverable',
      'Restore from snapshot if data loss has occurred',
      'Force-allocate stale primary if node is permanently lost'
    ],
    commands: [
      'GET /_cluster/health?level=shards',
      'GET /_cluster/allocation/explain',
      'POST /_cluster/reroute?retry_failed=true'
    ]
  },

  search: {
    title: 'Search Query Failed',
    severity: 'medium',
    steps: [
      'Check query syntax and verify field mappings: GET /<index>/_mapping',
      'Confirm the index exists and is not in closed state',
      'Review PPDM application logs for the full stack trace',
      'Test the query directly in Kibana Dev Tools or curl',
      'Check for mapping conflicts caused by dynamic field type changes'
    ],
    commands: [
      'GET /ppdm-assets/_mapping',
      'GET /ppdm-assets/_search?q=*&size=0',
      'GET /_cluster/pending_tasks'
    ]
  }
};
