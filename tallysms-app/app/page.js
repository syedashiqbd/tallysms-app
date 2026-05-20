'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authKey] = useState(process.env.NEXT_PUBLIC_AUTH_KEY || '');

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch(`/api/queue?auth_key=${process.env.NEXT_PUBLIC_AUTH_KEY}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setStats(data.stats);
      }
    } catch (e) {}
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: 'Arial', padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', marginBottom: 8 }}>📱 TallySMS Dashboard</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>Auto-refresh every 10 seconds</p>

      {stats && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={cardStyle('#4CAF50')}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.sent || 0}</div>
            <div>Sent (24h)</div>
          </div>
          <div style={cardStyle('#f44336')}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.failed || 0}</div>
            <div>Failed (24h)</div>
          </div>
          <div style={cardStyle('#2196F3')}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.total || 0}</div>
            <div>Total (24h)</div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1976D2', color: '#fff' }}>
              <th style={thStyle}>Time</th>
              <th style={thStyle}>Mobile</th>
              <th style={thStyle}>Message</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24 }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#888' }}>No SMS yet</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{new Date(log.created_at).toLocaleString()}</td>
                <td style={tdStyle}>{log.mobile}</td>
                <td style={{ ...tdStyle, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 'bold',
                    background: log.status === 'sent' ? '#E8F5E9' : '#FFEBEE',
                    color: log.status === 'sent' ? '#2E7D32' : '#C62828'
                  }}>
                    {log.status === 'sent' ? '✓ SENT' : '✗ FAILED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cardStyle = (color) => ({
  background: '#fff',
  borderRadius: 8,
  padding: '16px 24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  borderLeft: `4px solid ${color}`,
  color: '#333',
  minWidth: 120
});

const thStyle = { padding: '12px 16px', textAlign: 'left', fontWeight: 'bold' };
const tdStyle = { padding: '10px 16px', color: '#444' };
