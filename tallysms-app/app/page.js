'use client';
import { useState, useEffect, useCallback } from 'react';

export default function SMSDashboard() {
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('send');
  const [filterDate, setFilterDate] = useState('');

  const AUTH_KEY = 'tally-sms-secret-2024';

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?auth_key=${AUTH_KEY}&limit=100`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setStats(data.stats);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  async function handleSend() {
    if (!mobile.trim() || !message.trim()) {
      setResult({ success: false, error: 'Mobile number and message required' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/send?auth_key=${AUTH_KEY}&mobile=${encodeURIComponent(mobile.trim())}&message=${encodeURIComponent(message.trim())}`);
      const data = await res.json();
      setResult(data);
      if (data.success) {
        fetchLogs();
      }
    } catch (e) {
      setResult({ success: false, error: 'Network error' });
    }
    setSending(false);
  }

  const filteredLogs = filterDate
    ? logs.filter(l => new Date(l.created_at).toLocaleDateString('en-CA') === filterDate)
    : logs;

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>📱</div>
            <div>
              <h1 style={styles.title}>TallySMS</h1>
              <p style={styles.subtitle}>Max Care Trading</p>
            </div>
          </div>
          <div style={styles.statsBadges}>
            <div style={styles.badge('#22c55e')}>
              <span style={styles.badgeNum}>{stats?.sent || 0}</span>
              <span style={styles.badgeLabel}>Sent today</span>
            </div>
            <div style={styles.badge('#ef4444')}>
              <span style={styles.badgeNum}>{stats?.failed || 0}</span>
              <span style={styles.badgeLabel}>Failed</span>
            </div>
            <div style={styles.badge('#3b82f6')}>
              <span style={styles.badgeNum}>{stats?.total || 0}</span>
              <span style={styles.badgeLabel}>Total</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button style={tab === 'send' ? styles.tabActive : styles.tab} onClick={() => setTab('send')}>
            ✉️ Send SMS
          </button>
          <button style={tab === 'history' ? styles.tabActive : styles.tab} onClick={() => setTab('history')}>
            📋 History ({logs.length})
          </button>
        </div>

        {/* Send Tab */}
        {tab === 'send' && (
          <div style={styles.card}>
            <div style={styles.formGroup}>
              <label style={styles.label}>📞 Mobile Number</label>
              <input
                style={styles.input}
                type="text"
                placeholder="01XXXXXXXXX"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>💬 SMS Text</label>
              <textarea
                style={styles.textarea}
                placeholder="Type your message here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
              />
              <div style={styles.charCount}>{message.length} characters</div>
            </div>

            {result && (
              <div style={result.success ? styles.successBox : styles.errorBox}>
                {result.success
                  ? `✅ SMS sent successfully! ID: ${result.sms_uid || 'N/A'}`
                  : `❌ Failed: ${result.error || result.message || 'Unknown error'}`}
              </div>
            )}

            <button
              style={sending ? styles.btnDisabled : styles.btn}
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? '⏳ Sending...' : '📤 Send SMS'}
            </button>

            {/* Last sent info */}
            {logs.length > 0 && (
              <div style={styles.lastSent}>
                <div style={styles.lastSentTitle}>Last Sent</div>
                <div style={styles.lastSentInfo}>
                  <span>📞 {logs[0].mobile}</span>
                  <span style={styles.dot}>•</span>
                  <span>🕐 {new Date(logs[0].created_at).toLocaleString('en-GB')}</span>
                  <span style={styles.dot}>•</span>
                  <span style={{ color: logs[0].status === 'sent' ? '#22c55e' : '#ef4444' }}>
                    {logs[0].status === 'sent' ? '✓ Sent' : '✗ Failed'}
                  </span>
                </div>
                <div style={styles.lastSentMsg}>{logs[0].message}</div>
                <button style={styles.reuseBtn} onClick={() => {
                  setMobile(logs[0].mobile);
                  setMessage(logs[0].message);
                  setTab('send');
                }}>
                  ↩ Reuse this SMS
                </button>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div style={styles.card}>
            <div style={styles.filterRow}>
              <label style={styles.label}>📅 Filter by Date</label>
              <input
                type="date"
                style={styles.dateInput}
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              />
              {filterDate && (
                <button style={styles.clearBtn} onClick={() => setFilterDate('')}>Clear</button>
              )}
            </div>

            {Object.keys(groupedLogs).length === 0 ? (
              <div style={styles.empty}>No SMS history found</div>
            ) : (
              Object.entries(groupedLogs).map(([date, items]) => (
                <div key={date} style={styles.dateGroup}>
                  <div style={styles.dateHeader}>
                    📅 {date} <span style={styles.dateCount}>({items.length} SMS)</span>
                  </div>
                  {items.map(log => (
                    <div key={log.id} style={styles.logItem}>
                      <div style={styles.logTop}>
                        <span style={styles.logMobile}>📞 {log.mobile}</span>
                        <span style={log.status === 'sent' ? styles.statusSent : styles.statusFailed}>
                          {log.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                        </span>
                      </div>
                      <div style={styles.logMsg}>{log.message}</div>
                      <div style={styles.logTime}>
                        🕐 {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <button style={styles.reuseSmallBtn} onClick={() => {
                        setMobile(log.mobile);
                        setMessage(log.message);
                        setTab('send');
                      }}>↩ Reuse</button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', fontFamily: "'Segoe UI', sans-serif", padding: '20px 16px' },
  container: { maxWidth: 600, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logo: { fontSize: 36 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: 700, margin: 0 },
  subtitle: { color: '#64748b', fontSize: 13, margin: 0 },
  statsBadges: { display: 'flex', gap: 8 },
  badge: (color) => ({ background: '#1e293b', border: `1px solid ${color}30`, borderRadius: 10, padding: '6px 12px', textAlign: 'center', minWidth: 60 }),
  badgeNum: { display: 'block', color: '#f1f5f9', fontSize: 20, fontWeight: 700 },
  badgeLabel: { display: 'block', color: '#64748b', fontSize: 11 },
  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: { flex: 1, padding: '10px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  tabActive: { flex: 1, padding: '10px 16px', background: '#2563eb', border: '1px solid #3b82f6', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  card: { background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', fontSize: 15, boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box', resize: 'vertical', outline: 'none', lineHeight: 1.6 },
  charCount: { color: '#475569', fontSize: 12, textAlign: 'right', marginTop: 4 },
  btn: { width: '100%', padding: '14px', background: '#2563eb', border: 'none', borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  btnDisabled: { width: '100%', padding: '14px', background: '#1e3a5f', border: 'none', borderRadius: 10, color: '#94a3b8', fontSize: 16, fontWeight: 700, cursor: 'not-allowed', marginTop: 8 },
  successBox: { background: '#052e16', border: '1px solid #22c55e', borderRadius: 10, padding: '12px 16px', color: '#86efac', fontSize: 14, marginBottom: 12 },
  errorBox: { background: '#2d0a0a', border: '1px solid #ef4444', borderRadius: 10, padding: '12px 16px', color: '#fca5a5', fontSize: 14, marginBottom: 12 },
  lastSent: { marginTop: 20, padding: '14px 16px', background: '#0f172a', borderRadius: 10, border: '1px solid #334155' },
  lastSentTitle: { color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  lastSentInfo: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 },
  lastSentMsg: { color: '#94a3b8', fontSize: 13, marginBottom: 10 },
  dot: { color: '#334155' },
  reuseBtn: { background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
  filterRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  dateInput: { padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14 },
  clearBtn: { padding: '8px 12px', background: '#334155', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer' },
  empty: { textAlign: 'center', color: '#475569', padding: '40px 0' },
  dateGroup: { marginBottom: 20 },
  dateHeader: { color: '#64748b', fontSize: 13, fontWeight: 600, padding: '8px 0', borderBottom: '1px solid #334155', marginBottom: 10 },
  dateCount: { color: '#475569', fontWeight: 400 },
  logItem: { background: '#0f172a', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: '1px solid #1e293b' },
  logTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logMobile: { color: '#f1f5f9', fontSize: 14, fontWeight: 600 },
  statusSent: { background: '#052e16', color: '#22c55e', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  statusFailed: { background: '#2d0a0a', color: '#ef4444', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  logMsg: { color: '#94a3b8', fontSize: 13, marginBottom: 6, lineHeight: 1.5 },
  logTime: { color: '#475569', fontSize: 12, marginBottom: 8 },
  reuseSmallBtn: { background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#64748b', padding: '4px 10px', fontSize: 11, cursor: 'pointer' },
};
