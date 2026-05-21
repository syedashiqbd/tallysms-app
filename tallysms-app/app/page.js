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
      setResult({ success: false, error: 'Mobile number and message are required' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/send?auth_key=${AUTH_KEY}&mobile=${encodeURIComponent(mobile.trim())}&message=${encodeURIComponent(message.trim())}`);
      const data = await res.json();
      setResult(data);
      if (data.success) fetchLogs();
    } catch (e) {
      setResult({ success: false, error: 'Network error. Please try again.' });
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
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.logoBox}>📱</div>
            <div>
              <h1 style={s.title}>TallySMS</h1>
              <p style={s.subtitle}>Max Care Trading</p>
            </div>
          </div>
          <div style={s.statsRow}>
            {[
              { label: 'Sent Today', value: stats?.sent || 0, color: '#10b981', bg: '#052e1a' },
              { label: 'Failed', value: stats?.failed || 0, color: '#f43f5e', bg: '#2d0a14' },
              { label: 'Total', value: stats?.total || 0, color: '#38bdf8', bg: '#0a1f2d' },
            ].map(b => (
              <div key={b.label} style={{ ...s.statCard, background: b.bg, borderColor: b.color + '40' }}>
                <span style={{ ...s.statNum, color: b.color }}>{b.value}</span>
                <span style={s.statLabel}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {['send', 'history'].map(t => (
            <button key={t} style={tab === t ? s.tabActive : s.tab} onClick={() => setTab(t)}>
              {t === 'send' ? '✉️ Send SMS' : `📋 History (${logs.length})`}
            </button>
          ))}
        </div>

        {/* SEND TAB */}
        {tab === 'send' && (
          <div style={s.card}>
            <div style={s.formGroup}>
              <label style={s.label}>
                <span style={s.labelIcon}>📞</span> Mobile Number
              </label>
              <input
                style={s.input}
                type="text"
                placeholder="e.g. 01711000000"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>
                <span style={s.labelIcon}>💬</span> SMS Message
              </label>
              <textarea
                style={s.textarea}
                placeholder="Type your message here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
              />
              <div style={s.charCount}>
                <span style={{ color: message.length > 160 ? '#f43f5e' : '#475569' }}>
                  {message.length} characters
                </span>
                {message.length > 160 && <span style={{ color: '#f43f5e', marginLeft: 8 }}>⚠ Multi-part SMS</span>}
              </div>
            </div>

            {result && (
              <div style={result.success ? s.successBox : s.errorBox}>
                {result.success
                  ? <><span style={{ fontSize: 18 }}>✅</span> SMS sent! ID: <strong>{result.sms_uid || 'N/A'}</strong></>
                  : <><span style={{ fontSize: 18 }}>❌</span> {result.error || result.message || 'Failed to send'}</>}
              </div>
            )}

            <button style={sending ? s.btnLoading : s.btn} onClick={handleSend} disabled={sending}>
              {sending ? <><span style={s.spinner}>⏳</span> Sending...</> : '📤 Send SMS'}
            </button>

            {/* Last Sent Card */}
            {logs.length > 0 && (
              <div style={s.lastSentCard}>
                <div style={s.lastSentBadge}>LAST SENT</div>
                <div style={s.lastSentGrid}>
                  <div style={s.lastSentItem}>
                    <span style={s.lastSentIcon}>📞</span>
                    <div>
                      <div style={s.lastSentItemLabel}>Mobile</div>
                      <div style={s.lastSentItemValue}>{logs[0].mobile}</div>
                    </div>
                  </div>
                  <div style={s.lastSentItem}>
                    <span style={s.lastSentIcon}>🕐</span>
                    <div>
                      <div style={s.lastSentItemLabel}>Time</div>
                      <div style={s.lastSentItemValue}>
                        {new Date(logs[0].created_at).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={s.lastSentItem}>
                    <span style={s.lastSentIcon}>📊</span>
                    <div>
                      <div style={s.lastSentItemLabel}>Status</div>
                      <div style={{ color: logs[0].status === 'sent' ? '#10b981' : '#f43f5e', fontWeight: 700, fontSize: 14 }}>
                        {logs[0].status === 'sent' ? '✓ Delivered' : '✗ Failed'}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={s.lastSentMsg}>"{logs[0].message}"</div>
                <button style={s.reuseBtn} onClick={() => { setMobile(logs[0].mobile); setMessage(logs[0].message); }}>
                  ↩ Reuse this SMS
                </button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div style={s.card}>
            <div style={s.filterRow}>
              <span style={s.label}>📅 Filter by Date</span>
              <input type="date" style={s.dateInput} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              {filterDate && <button style={s.clearBtn} onClick={() => setFilterDate('')}>✕ Clear</button>}
            </div>

            {Object.keys(groupedLogs).length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ color: '#475569' }}>No SMS history found</div>
              </div>
            ) : (
              Object.entries(groupedLogs).map(([date, items]) => (
                <div key={date} style={s.dateGroup}>
                  <div style={s.dateHeader}>
                    <span>📅 {date}</span>
                    <span style={s.dateBadge}>{items.length} SMS</span>
                  </div>
                  {items.map(log => (
                    <div key={log.id} style={s.logCard}>
                      <div style={s.logHeader}>
                        <div style={s.logMobileRow}>
                          <span style={s.logMobileIcon}>📞</span>
                          <span style={s.logMobile}>{log.mobile}</span>
                        </div>
                        <span style={log.status === 'sent' ? s.badgeSent : s.badgeFailed}>
                          {log.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                        </span>
                      </div>
                      <div style={s.logMsg}>{log.message}</div>
                      <div style={s.logFooter}>
                        <span style={s.logTime}>
                          🕐 {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <button style={s.reuseSmallBtn} onClick={() => { setMobile(log.mobile); setMessage(log.message); setTab('send'); }}>
                          ↩ Reuse
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        <div style={s.footer}>TallySMS • Max Care Trading • Auto-refresh every 15s</div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a1628 100%)', fontFamily: "'Segoe UI', -apple-system, sans-serif", padding: '24px 16px' },
  container: { maxWidth: 620, margin: '0 auto' },

  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  logoBox: { width: 52, height: 52, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: '0 4px 20px #2563eb50' },
  title: { color: '#f8fafc', fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 },
  subtitle: { color: '#64748b', fontSize: 13, margin: '2px 0 0', fontWeight: 500 },

  statsRow: { display: 'flex', gap: 10 },
  statCard: { borderRadius: 12, padding: '10px 16px', textAlign: 'center', border: '1px solid', minWidth: 72 },
  statNum: { display: 'block', fontSize: 22, fontWeight: 800, lineHeight: 1.2 },
  statLabel: { display: 'block', color: '#64748b', fontSize: 11, fontWeight: 600, marginTop: 2 },

  tabs: { display: 'flex', gap: 8, marginBottom: 18, background: '#1e293b', padding: 4, borderRadius: 14 },
  tab: { flex: 1, padding: '11px 16px', background: 'transparent', border: 'none', borderRadius: 11, color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' },
  tabActive: { flex: 1, padding: '11px 16px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none', borderRadius: 11, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 12px #2563eb40' },

  card: { background: 'linear-gradient(145deg, #1e293b, #162032)', borderRadius: 20, padding: 24, border: '1px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' },

  formGroup: { marginBottom: 20 },
  label: { display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  labelIcon: { fontSize: 16 },
  input: { width: '100%', padding: '13px 16px', background: '#0f172a', border: '2px solid #334155', borderRadius: 12, color: '#f1f5f9', fontSize: 15, boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s', fontWeight: 500 },
  textarea: { width: '100%', padding: '13px 16px', background: '#0f172a', border: '2px solid #334155', borderRadius: 12, color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box', resize: 'vertical', outline: 'none', lineHeight: 1.7, fontWeight: 400 },
  charCount: { display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: 12 },

  btn: { width: '100%', padding: '15px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 4, boxShadow: '0 4px 20px #2563eb40', letterSpacing: 0.5 },
  btnLoading: { width: '100%', padding: '15px', background: '#1e3a5f', border: 'none', borderRadius: 12, color: '#64748b', fontSize: 16, fontWeight: 700, cursor: 'not-allowed', marginTop: 4 },

  successBox: { background: 'linear-gradient(135deg, #052e16, #063d1e)', border: '1px solid #10b98140', borderRadius: 12, padding: '14px 18px', color: '#6ee7b7', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 },
  errorBox: { background: 'linear-gradient(135deg, #2d0a14, #3d0a1a)', border: '1px solid #f43f5e40', borderRadius: 12, padding: '14px 18px', color: '#fda4af', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 },

  lastSentCard: { marginTop: 20, background: '#0f172a', borderRadius: 14, border: '1px solid #334155', padding: '16px 18px' },
  lastSentBadge: { color: '#475569', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 12 },
  lastSentGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 },
  lastSentItem: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  lastSentIcon: { fontSize: 18, marginTop: 2 },
  lastSentItemLabel: { color: '#475569', fontSize: 11, fontWeight: 600, marginBottom: 3 },
  lastSentItemValue: { color: '#e2e8f0', fontSize: 13, fontWeight: 600 },
  lastSentMsg: { color: '#64748b', fontSize: 13, fontStyle: 'italic', marginBottom: 12, padding: '8px 12px', background: '#1e293b', borderRadius: 8, lineHeight: 1.5 },
  reuseBtn: { background: 'linear-gradient(135deg, #1e293b, #243044)', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', padding: '7px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 },

  filterRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  dateInput: { padding: '9px 14px', background: '#0f172a', border: '2px solid #334155', borderRadius: 10, color: '#e2e8f0', fontSize: 14, fontWeight: 500 },
  clearBtn: { padding: '9px 14px', background: '#334155', border: 'none', borderRadius: 10, color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: 600 },

  empty: { textAlign: 'center', padding: '50px 0' },

  dateGroup: { marginBottom: 24 },
  dateHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 700, padding: '10px 14px', background: '#0f172a', borderRadius: 10, marginBottom: 10 },
  dateBadge: { background: '#1e293b', color: '#64748b', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },

  logCard: { background: '#0f172a', borderRadius: 12, padding: '14px 16px', marginBottom: 8, border: '1px solid #1e293b', transition: 'border 0.2s' },
  logHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logMobileRow: { display: 'flex', alignItems: 'center', gap: 8 },
  logMobileIcon: { fontSize: 16 },
  logMobile: { color: '#e2e8f0', fontSize: 15, fontWeight: 700 },
  badgeSent: { background: '#052e1a', color: '#10b981', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid #10b98130' },
  badgeFailed: { background: '#2d0a14', color: '#f43f5e', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid #f43f5e30' },
  logMsg: { color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 10 },
  logFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logTime: { color: '#475569', fontSize: 12, fontWeight: 500 },
  reuseSmallBtn: { background: '#1e293b', border: '1px solid #334155', borderRadius: 7, color: '#64748b', padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 },

  footer: { textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 24, fontWeight: 500 },
};
