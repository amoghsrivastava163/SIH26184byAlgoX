import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  Map,
  Search,
  ShieldAlert,
  LogOut,
  Settings,
  Database,
  Brain,
  ClipboardList,
  ArrowUpRight,
  UserRound,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Download,
  Play,
  Eye,
  Filter,
  XCircle,
  Bell,
  FilePlus2,
} from 'lucide-react';
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import { ComplaintWorkspace, Complaint } from './ComplaintWorkspace';

type ATM = {
  id: string;
  zone: string;
  bank: string;
  address: string;
  lat: number;
  lng: number;
  risk_score: number;
  risk_level: string;
  window: string;
  activity: number;
  incidents: number;
  signals: string[];
};

type Transaction = {
  id?: string;
  transaction_id?: string;
  atm_id?: string;
  amount?: number;
  timestamp?: string;
  time?: string;
  risk_score?: number;
  suspicious?: boolean;
  status?: string;
};

type Alert = {
  id?: string;
  alert_id?: string;
  title?: string;
  message?: string;
  description?: string;
  atm_id?: string;
  severity?: string;
  status?: string;
  created_at?: string;
  timestamp?: string;
  [key: string]: any;
};

type CaseItem = {
  id?: string;
  case_id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  severity?: string;
  atm_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

type Prediction = {
  id?: string;
  prediction_id?: string;
  atm_id?: string;
  transaction_id?: string;
  risk_score?: number;
  risk_level?: string;
  predicted_risk?: number;
  model_version?: string;
  timestamp?: string;
  [key: string]: any;
};

const api = axios.create({ baseURL: '/api' });

const nav = [
  'Dashboard',
  'Live Risk Map',
  'ATM Intelligence',
  'Transactions',
  'Complaints',
  'Cases',
  'Alerts',
  'Predictions',
  'Analytics',
  'Reports',
  'Data Management',
  'Model Management',
  'Audit Logs',
  'Settings',
];

function getIcon(name: string) {
  const props = { size: 17 };
  if (name === 'Dashboard') return <LayoutDashboard {...props} />;
  if (name === 'Live Risk Map') return <Map {...props} />;
  if (name === 'ATM Intelligence') return <Building2 {...props} />;
  if (name === 'Transactions') return <Activity {...props} />;
  if (name === 'Complaints') return <FilePlus2 {...props} />;
  if (name === 'Cases') return <ClipboardList {...props} />;
  if (name === 'Alerts') return <ShieldAlert {...props} />;
  if (name === 'Predictions') return <Brain {...props} />;
  if (name === 'Analytics') return <BarChart3 {...props} />;
  if (name === 'Reports') return <FileText {...props} />;
  if (name === 'Data Management') return <Database {...props} />;
  if (name === 'Model Management') return <Brain {...props} />;
  if (name === 'Audit Logs') return <ClipboardList {...props} />;
  if (name === 'Settings') return <Settings {...props} />;
  return <Activity {...props} />;
}

function Risk({ level, score }: { level?: string; score?: number }) {
  const safe = String(level || 'LOW').toUpperCase();
  return (
    <span className={'risk ' + safe.toLowerCase()}>
      {safe}
      {score !== undefined && ` · ${Number(score).toFixed(2)}`}
    </span>
  );
}

function riskFromScore(score?: number) {
  const n = Number(score || 0);
  if (n >= 0.8) return 'HIGH';
  if (n >= 0.5) return 'MEDIUM';
  return 'LOW';
}

function value(obj: any, keys: string[], fallback = '—') {
  for (const key of keys) {
    const v = obj?.[key];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return fallback;
}

function formatDate(v: any) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('en-IN');
}

function formatAmount(v: any) {
  if (v === undefined || v === null || v === '') return '—';
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : `₹${n.toLocaleString('en-IN')}`;
}

function unwrap(data: any): any[] {
  if (Array.isArray(data)) return data;
  return data?.items || data?.results || data?.data || [];
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 18 }}>
      <div>
        <div style={{ color: '#697581', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
          {eyebrow}
        </div>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p style={{ margin: '4px 0 0' }}>{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ message = 'No records returned by the API.' }: { message?: string }) {
  return (
    <div style={{ padding: 34, textAlign: 'center', color: '#697581', fontSize: 12 }}>
      {message}
    </div>
  );
}

function DataTable({ columns, rows, empty }: { columns: string[]; rows: React.ReactNode[][]; empty?: string }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          )) : (
            <tr><td colSpan={columns.length}><EmptyState message={empty} /></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


function mapRiskLevel(score?: number, level?: string) {
  if (level) {
    const normalized = String(level).toUpperCase();
    if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(normalized)) {
      return normalized;
    }
  }

  const n = Number(score ?? 0);

  // The API normally uses 0–1 risk scores.
  // Also tolerate 0–100 values if a backend record uses that format.
  const normalizedScore = n > 1 ? n / 100 : n;

  if (normalizedScore >= 0.9) return 'CRITICAL';
  if (normalizedScore >= 0.75) return 'HIGH';
  if (normalizedScore >= 0.35) return 'MEDIUM';
  return 'LOW';
}

function mapRiskColor(level: string) {
  if (level === 'CRITICAL') return '#c93c3c';
  if (level === 'HIGH') return '#e06b5d';
  if (level === 'MEDIUM') return '#d9a441';
  return '#35b779';
}

function MapSizeFix() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

function MadhyaPradeshMap({
  atms,
  selected,
  onSelect,
  complaintCounts = {},
}: {
  atms: ATM[];
  selected: ATM | null;
  onSelect: (atm: ATM) => void;
  complaintCounts?: Record<string, number>;
}) {
  const [filter, setFilter] = useState('ALL');
  const [showComplaints, setShowComplaints] = useState(false);

  const visibleATMs = useMemo(() => {
    return atms.filter((atm) => {
      const level = mapRiskLevel(atm.risk_score, atm.risk_level);
      return filter === 'ALL' || level === filter;
    });
  }, [atms, filter]);

  return (
    <div
      style={{
        position: 'relative',
        height: 570,
        overflow: 'hidden',
        background: '#d9dee2',
        borderRadius: 7,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 12px',
          background: 'rgba(15,20,26,.95)',
          border: '1px solid #29333d',
          borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,.16)',
        }}
      >
        <div>
          <strong style={{ display: 'block', fontSize: 13 }}>
            Madhya Pradesh · ATM Risk Map
          </strong>
          <span style={{ color: '#929da8', fontSize: 10 }}>
            Real geographic map · synthetic CyberCash risk data
          </span>
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              style={{
                minHeight: 28,
                padding: '4px 9px',
                border: `1px solid ${filter === item ? '#426fae' : '#29333d'}`,
                borderRadius: 4,
                background: filter === item ? '#1b3048' : '#18212a',
                color:
                  item === 'LOW'
                    ? '#35b779'
                    : item === 'MEDIUM'
                    ? '#d9a441'
                    : item === 'HIGH'
                    ? '#e06b5d'
                    : item === 'CRITICAL'
                    ? '#ef7777'
                    : '#e7ebef',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {item}
            </button>
          ))}
          <button type="button" onClick={() => setShowComplaints(!showComplaints)} className={showComplaints ? 'map-layer active' : 'map-layer'}>Complaint density</button>
        </div>
      </div>

      <MapContainer
        center={[23.2599, 77.4126]}
        zoom={6}
        minZoom={5}
        maxZoom={16}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapSizeFix />

        {showComplaints && Object.entries(complaintCounts).map(([district, count]) => {
          const districtAtms = atms.filter((atm) => (atm as ATM & { district?: string }).district === district || atm.zone === district);
          if (!districtAtms.length) return null;
          const lat = districtAtms.reduce((sum, atm) => sum + Number(atm.lat), 0) / districtAtms.length;
          const lng = districtAtms.reduce((sum, atm) => sum + Number(atm.lng), 0) / districtAtms.length;
          return <CircleMarker key={`complaint-${district}`} center={[lat, lng]} radius={Math.min(20, 6 + count * 1.2)} interactive={false} pathOptions={{ color: '#4A86E8', fillColor: '#4A86E8', fillOpacity: .17, weight: 1 }} />;
        })}

        {visibleATMs.map((atm) => {
          const latitude = Number(atm.lat);
          const longitude = Number(atm.lng);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          const level = mapRiskLevel(atm.risk_score, atm.risk_level);
          const color = mapRiskColor(level);
          const isSelected = selected?.id === atm.id;

          return (
            <CircleMarker
              key={atm.id}
              center={[latitude, longitude]}
              radius={isSelected ? 11 : level === 'CRITICAL' ? 9 : 7}
              pathOptions={{
                color: isSelected ? '#ffffff' : color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onSelect(atm),
              }}
            />
          );
        })}
      </MapContainer>

      <div
        style={{
          position: 'absolute',
          left: 14,
          bottom: 14,
          zIndex: 1000,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          padding: '8px 10px',
          background: 'rgba(15,20,26,.94)',
          border: '1px solid #29333d',
          borderRadius: 5,
          color: '#929da8',
          fontSize: 10,
        }}
      >
        <span><b style={{ color: '#35b779' }}>●</b> Low</span>
        <span><b style={{ color: '#d9a441' }}>●</b> Medium</span>
        <span><b style={{ color: '#e06b5d' }}>●</b> High</span>
        <span><b style={{ color: '#c93c3c' }}>●</b> Critical</span>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 14,
          bottom: 14,
          zIndex: 1000,
          padding: '7px 9px',
          background: 'rgba(15,20,26,.94)',
          border: '1px solid #29333d',
          borderRadius: 5,
          color: '#697581',
          fontSize: 10,
        }}
      >
        {visibleATMs.length} of {atms.length} ATMs
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [page, setPage] = useState('Dashboard');
  const [atms, setAtms] = useState<ATM[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [hourly, setHourly] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selected, setSelected] = useState<ATM | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState({
    email: 'investigator@cybercash.local',
    password: 'DemoInvestigator!2026',
  });
  const [loggingIn, setLoggingIn] = useState(false);
  const [reportResult, setReportResult] = useState<any>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = 'Bearer ' + token;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  const loadCore = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [s, a, t, al, c, cmp] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/atms'),
        api.get('/transactions'),
        api.get('/alerts').catch(() => ({ data: { items: [] } })),
        api.get('/cases').catch(() => ({ data: { items: [] } })),
        api.get('/complaints').catch(() => ({ data: { items: [] } })),
      ]);
      setSummary(s.data);
      const atmItems = unwrap(a.data) as ATM[];
      setAtms(atmItems);
      setTransactions(unwrap(t.data) as Transaction[]);
      setAlerts(unwrap(al.data) as Alert[]);
      setCases(unwrap(c.data) as CaseItem[]);
      setComplaints(unwrap(cmp.data) as Complaint[]);
      if (!selected && atmItems.length) setSelected(atmItems[0]);
      setAuditEvents((prev) => [
        { time: new Date().toISOString(), action: 'Data refresh', detail: 'Dashboard and operational data refreshed' },
        ...prev,
      ].slice(0, 50));
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        setToken('');
        setError('Your session expired. Please sign in again.');
      } else {
        setError('Unable to load the API. Make sure the backend is running on port 8000.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadCore();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const loadPageData = async () => {
      try {
        if (page === 'Predictions') {
          const r = await api.get('/predictions');
          setPredictions(unwrap(r.data) as Prediction[]);
        }
        if (page === 'Analytics') {
          const [h, z] = await Promise.all([
            api.get('/analytics/hourly'),
            api.get('/analytics/zones'),
          ]);
          setHourly(unwrap(h.data));
          setZones(unwrap(z.data));
        }
        if (page === 'Model Management') {
          const r = await api.get('/models');
          setModels(unwrap(r.data));
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 403) setError('Your current role does not have permission to access this module.');
        else setError(`Could not load ${page}.`);
      }
    };
    loadPageData();
  }, [page, token]);

  const doLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoggingIn(true);
    setError('');
    try {
      const response = await api.post('/auth/login', login);
      const newToken = response.data.access_token || response.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
    } catch (err) {
      setError('Login failed. Check the email and password.');
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
    setToken('');
    setPage('Dashboard');
    setSummary(null);
    setAtms([]);
    setTransactions([]);
    setAlerts([]);
    setCases([]);
    setPredictions([]);
    setModels([]);
    setComplaints([]);
  };

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) =>
      [t.transaction_id, t.id, t.atm_id, t.status, t.timestamp, t.time]
        .some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [transactions, query]);

  const filteredATMs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return atms;
    return atms.filter((a) =>
      [a.id, a.zone, a.bank, a.address, a.risk_level]
        .some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [atms, query]);

  const filteredAlerts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return alerts;
    return alerts.filter((a) => JSON.stringify(a).toLowerCase().includes(q));
  }, [alerts, query]);

  const filteredCases = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) => JSON.stringify(c).toLowerCase().includes(q));
  }, [cases, query]);

  const refreshComplaints = async () => {
    try {
      const response = await api.get('/complaints');
      setComplaints(unwrap(response.data) as Complaint[]);
    } catch {
      setError('Unable to load complaint intelligence.');
    }
  };

  const openATM = (atmId: string, destination = 'ATM Intelligence') => {
    const match = atms.find((atm) => atm.id === atmId);
    if (match) setSelected(match);
    setPage(destination);
  };

  const dashboard = (
    <div className="page-content">
      <PageHeader
        eyebrow="Operations / Dashboard"
        title="Madhya Pradesh ATM Risk Overview"
        description="Monitoring potential cash-withdrawal risk based on cybercrime complaints, transaction patterns and predictive analytics."
        action={<div className="page-actions"><span className="geo-context">Madhya Pradesh<br/><b>36 districts · {atms.length || 100} ATMs</b></span><select aria-label="Date range"><option>Last 24 Hours</option><option>Last 7 Days</option><option>Last 30 Days</option></select><button onClick={loadCore} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button></div>}
      />

      <div className="dashboard-kpis" style={{ display: 'grid' }}>
        <div className="kpi"><h3>ATM Network</h3><strong>{atms.length || '—'}</strong><small>Total ATMs</small></div>
        <div className="kpi"><h3>Risk Exposure</h3><strong>{atms.filter((a) => ['HIGH', 'CRITICAL'].includes(String(a.risk_level).toUpperCase())).length}</strong><small>High / Critical ATMs</small></div>
        <div className="kpi"><h3>Transaction Activity</h3><strong>{summary?.suspicious_transactions ?? '—'}</strong><small>Flagged transactions</small></div>
        <div className="kpi"><h3>Open Alerts</h3><strong>{alerts.filter((alert) => String(value(alert, ['status'], '')).toUpperCase() !== 'ACKNOWLEDGED').length}</strong><small>Requires review</small></div>
        <div className="kpi"><h3>Active Cases</h3><strong>{summary?.active_cases ?? '—'}</strong><small>{complaints.filter((c) => !['CLOSED', 'ANALYZED'].includes(c.status)).length} open complaints</small></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(340px, .65fr)', gap: 12, marginBottom: 12 }}>
        <section className="card">
          <div style={{ padding: '15px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><h3 style={{ margin: 0 }}>Geographic Risk Distribution</h3><p style={{ margin: '3px 0 0', fontSize: 11 }}>Madhya Pradesh · synthetic ATM risk data</p></div>
            <button onClick={() => setPage('Live Risk Map')}>View map →</button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 250px',
              minHeight: 310,
            }}
          >
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <MadhyaPradeshMap
                atms={atms.slice(0, 30)}
                selected={selected}
                onSelect={setSelected}
                complaintCounts={complaints.reduce<Record<string, number>>((counts, complaint) => ({ ...counts, [complaint.district]: (counts[complaint.district] || 0) + 1 }), {})}
              />
            </div>

            <div style={{ padding: 17, borderLeft: '1px solid var(--border-light)' }}>
              <span style={{ color: '#697581', fontSize: 11 }}>
                Selected ATM
              </span>

              {selected ? (
                <>
                  <h2 style={{ margin: '20px 0 3px' }}>
                    {selected.id}
                  </h2>

                  <p style={{ margin: 0, fontSize: 12 }}>
                    {selected.bank}
                  </p>

                  <p style={{ margin: '3px 0 18px', fontSize: 11 }}>
                    {selected.address}
                  </p>

                  <div style={{ borderTop: '1px solid var(--border-light)' }}>
                    <div className="detail-row">
                      <span>Risk score</span>
                      <strong>{selected.risk_score}</strong>
                    </div>

                    <div className="detail-row">
                      <span>Risk level</span>
                      <Risk level={selected.risk_level} />
                    </div>

                    <div className="detail-row">
                      <span>Activity</span>
                      <strong>{selected.activity}</strong>
                    </div>

                    <div className="detail-row">
                      <span>Incidents</span>
                      <strong>{selected.incidents}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12 }}>
                    <button onClick={() => { setQuery(selected.id); setPage('Transactions'); }}>Transactions</button><button onClick={() => { setQuery(selected.id); setPage('Complaints'); }}>Complaints</button><button onClick={() => { setQuery(selected.id); setPage('Cases'); }}>Cases</button><button onClick={() => { setQuery(selected.id); setPage('Alerts'); }}>Alerts</button><button className="primary" style={{ gridColumn: '1 / -1' }} onClick={() => { setQuery(selected.id); setPage('Predictions'); }}>View prediction</button>
                  </div>
                </>
              ) : (
                <p>Select an ATM marker to view details.</p>
              )}
            </div>
          </div>
        </section>

        <div style={{ display: 'grid', gap: 12 }}>
          <section className="card">
            <div style={{ padding: '15px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ margin: 0 }}>Risk Distribution</h3><p style={{ margin: '3px 0 0', fontSize: 11 }}>ATM fleet by predicted risk level</p>
            </div>
            <div style={{ padding: 16 }}>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => {
                const count = atms.filter((a) => String(a.risk_level).toUpperCase() === level).length;
                const percentage = atms.length ? Math.round((count / atms.length) * 100) : 0;
                const bar = level === 'LOW' ? 'var(--green)' : level === 'MEDIUM' ? 'var(--yellow)' : level === 'HIGH' ? 'var(--orange)' : 'var(--red)';
                return <div key={level} style={{ marginBottom: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: 11 }}>{level}</span><span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{count} · {percentage}%</span></div>
                  <div style={{ height: 6, background: '#202a33', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${percentage}%`, height: '100%', background: bar }} /></div>
                </div>;
              })}
            </div>
          </section>
          <section className="card">
            <div style={{ padding: '15px 16px', borderBottom: '1px solid var(--border-light)' }}><h3 style={{ margin: 0 }}>Time-Based Risk Pattern</h3><p style={{ margin: '3px 0 0', fontSize: 11 }}>Hourly synthetic activity signals</p></div>
            <div style={{ display: 'flex', alignItems: 'end', gap: 4, height: 82, padding: '12px 16px' }}>
              {hourly.slice(0, 12).map((point, index) => <div key={String(value(point, ['hour'], String(index)))} title={`${value(point, ['hour'], '')}: ${value(point, ['activity'], '0')}`} style={{ flex: 1, minWidth: 4, height: `${Math.max(8, Number(value(point, ['activity'], '0')) * 2)}%`, background: 'var(--blue)' }} />)}
              {!hourly.length && <span style={{ color: 'var(--muted)', fontSize: 11 }}>No hourly data available.</span>}
            </div>
          </section>
          <section className="card">
            <div style={{ padding: '15px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Recent Alerts</h3><button onClick={() => setPage('Alerts')}>View all →</button>
            </div>
            {alerts[0] && <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-light)' }}><span style={{ color: 'var(--red)', fontSize: 10, fontWeight: 700 }}>HIGH RISK ALERT</span><strong style={{ display: 'block', marginTop: 3 }}>{value(alerts[0], ['atm_id', 'atm'], 'ATM')} · {value(alerts[0], ['zone'], 'Madhya Pradesh')}</strong><p style={{ margin: '3px 0 8px', fontSize: 10 }}>Risk score {value(alerts[0], ['score'], '—')} · {value(alerts[0], ['window'], 'Window unavailable')}</p><button onClick={() => openATM(String(value(alerts[0], ['atm_id'], '')))}>View details</button></div>}
            {alerts.slice(0, 4).map((alert, index) => <div key={alert.id || index} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div><strong style={{ display: 'block', fontSize: 11 }}>{value(alert, ['title', 'message', 'description'], 'Risk alert')}</strong><span style={{ color: '#697581', fontSize: 10 }}>{value(alert, ['atm_id', 'atm'], 'ATM')}</span></div>
              <AlertTriangle size={15} color="#d9a441" />
            </div>)}
            {!alerts.length && <EmptyState message="No active alerts returned by the API." />}
          </section>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, .65fr)', gap: 12, marginBottom: 12 }}>
        <section className="card">
          <div style={{ padding: '15px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>Top Risk ATMs</h3><button onClick={() => setPage('ATM Intelligence')}>View all →</button></div>
          <DataTable columns={['Rank','ATM / Zone','Location','Risk Score','Predicted Time','Confidence']} rows={[...atms].sort((a,b) => b.risk_score - a.risk_score).slice(0,5).map((atm,index) => [index + 1,<button className="table-link" onClick={() => openATM(atm.id)}>{atm.id} · {atm.zone}</button>,atm.address,atm.risk_score,atm.window,<Risk level={atm.risk_level}/>])} empty="No ATM risk data available." />
        </section>
        <section className="card">
          <div style={{ padding: '15px 16px', borderBottom: '1px solid var(--border-light)' }}><h3 style={{ margin: 0 }}>Live Activity</h3></div>
          <div style={{ padding: '4px 16px' }}>{complaints.slice(0,3).map(c => <div className="detail-row" key={c.id}><span>Complaint received · {c.reference_number}</span><strong>{c.district}</strong></div>)}{alerts.slice(0,2).map(a => <div className="detail-row" key={String(a.id)}><span>Alert generated · {value(a,['atm_id'],'ATM')}</span><strong>{value(a,['status'],'NEW')}</strong></div>)}{!complaints.length&&!alerts.length&&<p style={{ color: 'var(--muted)', fontSize: 11 }}>No recent operational activity.</p>}</div>
        </section>
      </div>

      <section className="card">
        <div style={{ padding: '15px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h3 style={{ margin: 0 }}>Recent Predicted Cash-Out Events</h3><p style={{ margin: '3px 0 0', fontSize: 11 }}>Recent transaction activity from the prototype API</p></div>
          <button onClick={() => setPage('Transactions')}>View all →</button>
        </div>
        <DataTable
          columns={['Transaction', 'ATM ID', 'Time', 'Amount', 'Risk Score', 'Status']}
          rows={transactions.slice(0, 8).map((t, index) => {
            const score = typeof t.risk_score === 'number' ? t.risk_score : undefined;
            return [
              <strong>{value(t, ['transaction_id', 'id'], `TXN-${index + 1}`)}</strong>,
              value(t, ['atm_id']),
              formatDate(value(t, ['timestamp', 'time'], '')),
              formatAmount(t.amount),
              score !== undefined ? score.toFixed(2) : '—',
              <Risk level={t.suspicious ? 'HIGH' : riskFromScore(score)} />,
            ];
          })}
          empty="No transaction records returned by the API."
        />
      </section>
    </div>
  );

  const liveMap = (
    <div className="page-content">
      <PageHeader
        eyebrow="Operations / Live Risk Map"
        title="Live Risk Map"
        description="Geographic view of synthetic ATM risk signals across Madhya Pradesh"
        action={
          <button onClick={loadCore}>
            <RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Refresh
          </button>
        }
      />

      <section className="card">
        <MadhyaPradeshMap
          atms={filteredATMs}
          selected={selected}
          onSelect={setSelected}
          complaintCounts={complaints.reduce<Record<string, number>>((counts, complaint) => ({ ...counts, [complaint.district]: (counts[complaint.district] || 0) + 1 }), {})}
        />
      </section>

      <div style={{ marginTop: 12 }} className="card">
        <DataTable
          columns={['ATM', 'Bank', 'Zone', 'Risk', 'Activity', 'Incidents', 'Address']}
          rows={filteredATMs.map((a) => [
            <button
              onClick={() => setSelected(a)}
              style={{
                padding: 0,
                minHeight: 'auto',
                border: 0,
                background: 'transparent',
                color: '#4c8dff',
              }}
            >
              {a.id}
            </button>,
            a.bank,
            a.zone,
            <Risk level={a.risk_level} score={a.risk_score} />,
            a.activity,
            a.incidents,
            a.address,
          ])}
          empty="No ATMs match the current search."
        />
      </div>

      {selected && (
        <section className="card" style={{ marginTop: 12, padding: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            <div>
              <div style={{ color: '#697581', fontSize: 10 }}>
                SELECTED ATM
              </div>
              <h2 style={{ margin: '5px 0' }}>{selected.id}</h2>
              <p style={{ margin: 0 }}>
                {selected.bank} · {selected.zone}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 11 }}>
                {selected.address}
              </p>
            </div>

            <Risk
              level={selected.risk_level}
              score={selected.risk_score}
            />
          </div>

          <div className="detail-grid" style={{ marginTop: 16 }}>
            <div>
              <span>Latitude</span>
              <strong>{Number(selected.lat).toFixed(5)}</strong>
            </div>

            <div>
              <span>Longitude</span>
              <strong>{Number(selected.lng).toFixed(5)}</strong>
            </div>

            <div>
              <span>Activity</span>
              <strong>{selected.activity}</strong>
            </div>

            <div>
              <span>Incidents</span>
              <strong>{selected.incidents}</strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );

  const atmIntelligence = (
    <div className="page-content">
      <PageHeader eyebrow="Operations / ATM Intelligence" title="ATM Intelligence" description="Detailed risk and operational profile for monitored ATMs" />
      <section className="card">
        <DataTable columns={['ATM ID', 'Bank', 'Zone', 'Risk Score', 'Risk Level', 'Activity', 'Incidents', 'Signals']} rows={filteredATMs.map((a) => [
          <button onClick={() => openATM(a.id)} style={{ padding: 0, minHeight: 'auto', border: 0, background: 'transparent', color: '#4c8dff' }}>{a.id}</button>,
          a.bank, a.zone, a.risk_score, <Risk level={a.risk_level} />, a.activity, a.incidents, (a.signals || []).join(', ') || '—',
        ])} empty="No ATM intelligence records found." />
      </section>
      {selected && <section className="card" style={{ marginTop: 12, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><div><div style={{ color: '#697581', fontSize: 10 }}>SELECTED ATM</div><h2 style={{ margin: '5px 0' }}>{selected.id}</h2><p style={{ margin: 0 }}>{selected.bank} · {selected.zone}</p></div><Risk level={selected.risk_level} score={selected.risk_score} /></div>
        <div className="detail-grid">
          <div><span>Address</span><strong>{selected.address}</strong></div><div><span>Activity</span><strong>{selected.activity}</strong></div><div><span>Incidents</span><strong>{selected.incidents}</strong></div><div><span>Monitoring window</span><strong>{selected.window || '—'}</strong></div>
        </div>
        <section className="related-complaints"><h3>Related complaints</h3>{complaints.filter((c) => c.suspected_atm_id === selected.id).slice(0, 4).map((c) => <button className="candidate" key={c.id} onClick={() => { setQuery(c.id); setPage('Complaints'); }}><span><b>{c.reference_number}</b><small>{c.district} · ₹{c.amount.toLocaleString('en-IN')}</small></span><Risk level={c.priority}/></button>)}{!complaints.some((c) => c.suspected_atm_id === selected.id) && <p className="muted-copy">No linked synthetic complaints for this ATM.</p>}</section>
        <div className="inline-actions"><button onClick={() => { setQuery(selected.id); setPage('Transactions'); }}>View transactions</button><button onClick={() => { setQuery(selected.id); setPage('Cases'); }}>View cases</button><button onClick={() => { setQuery(selected.id); setPage('Alerts'); }}>View alerts</button><button className="primary" onClick={() => { setQuery(selected.id); setPage('Predictions'); }}>View prediction</button></div>
      </section>}
    </div>
  );

  const complaintsPage = <ComplaintWorkspace api={api} complaints={complaints} atms={atms} onRefresh={refreshComplaints} onOpenATM={(id) => openATM(id)} onNavigate={(destination, filter) => { if (filter) setQuery(filter); setPage(destination); }} onError={setError} />;

  const transactionsPage = (
    <div className="page-content">
      <PageHeader eyebrow="Operations / Transactions" title="Transactions" description={`${filteredTransactions.length} transaction records`} action={<button onClick={loadCore}><RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Refresh</button>} />
      <section className="card">
        <div style={{ padding: 14, borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 10, alignItems: 'center' }}><Filter size={15} color="#697581" /><span style={{ fontSize: 11, color: '#697581' }}>Search is applied from the global search field.</span>{query && <button onClick={() => setQuery('')}><XCircle size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />Clear</button>}</div>
        <DataTable columns={['Transaction ID', 'ATM ID', 'Timestamp', 'Amount', 'Risk', 'Suspicious', 'Status']} rows={filteredTransactions.map((t, i) => {
          const score = typeof t.risk_score === 'number' ? t.risk_score : undefined;
          const atmId = String(value(t, ['atm_id'], ''));
          return [value(t, ['transaction_id', 'id'], `TXN-${i + 1}`), atmId !== '—' ? <button className="table-link" onClick={() => openATM(atmId)}>{atmId}</button> : '—', formatDate(value(t, ['timestamp', 'time'], '')), formatAmount(t.amount), <Risk level={t.suspicious ? 'HIGH' : riskFromScore(score)} score={score} />, t.suspicious ? 'Yes' : 'No', value(t, ['status'])];
        })} empty="No transactions match your search." />
      </section>
    </div>
  );

  const casesPage = (
    <div className="page-content">
      <PageHeader eyebrow="Operations / Cases" title="Cases" description="Investigation workload from the operational API" action={<button onClick={loadCore}><RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Refresh</button>} />
      <section className="card">
        <DataTable columns={['Case ID', 'Title', 'ATM', 'Priority', 'Status', 'Created']} rows={filteredCases.map((c, i) => [
          <strong>{value(c, ['case_id', 'id'], `CASE-${i + 1}`)}</strong>,
          value(c, ['title', 'description'], 'Investigation case'),
          String(value(c, ['atm_id'], '')) !== '—' ? <button className="table-link" onClick={() => openATM(String(value(c, ['atm_id'], '')))}>{value(c, ['atm_id'])}</button> : '—',
          <Risk level={String(value(c, ['priority', 'severity'], 'LOW')).toUpperCase()} />,
          value(c, ['status'], 'OPEN'),
          formatDate(value(c, ['created_at', 'timestamp'], '')),
        ])} empty="No investigation cases returned by the API." />
      </section>
    </div>
  );

  const acknowledgeAlert = async (alert: Alert) => {
    const id = alert.id || alert.alert_id;
    if (!id) return;
    try {
      await api.patch(`/alerts/${id}`, { status: 'ACKNOWLEDGED' });
      await loadCore();
    } catch (err: any) {
      setError(err?.response?.status === 403 ? 'Your role cannot update alerts.' : 'Unable to update this alert.');
    }
  };

  const alertsPage = (
    <div className="page-content">
      <PageHeader eyebrow="Operations / Alerts" title="Alerts" description={`${filteredAlerts.length} alert records requiring operational review`} action={<button onClick={loadCore}><RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Refresh</button>} />
      <section className="card">
        <DataTable columns={['Alert', 'ATM', 'Severity', 'Status', 'Created', 'Action']} rows={filteredAlerts.map((a, i) => [
          <strong>{value(a, ['title', 'message', 'description'], `Alert ${i + 1}`)}</strong>,
          String(value(a, ['atm_id', 'atm'], '')) !== '—' ? <button className="table-link" onClick={() => openATM(String(value(a, ['atm_id', 'atm'], '')))}>{value(a, ['atm_id', 'atm'])}</button> : '—',
          <Risk level={String(value(a, ['severity'], 'MEDIUM')).toUpperCase()} />,
          value(a, ['status'], 'OPEN'),
          formatDate(value(a, ['created_at', 'timestamp'], '')),
          <button onClick={() => acknowledgeAlert(a)} disabled={String(value(a, ['status'], '')).toUpperCase() === 'ACKNOWLEDGED'}><CheckCircle2 size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />Acknowledge</button>,
        ])} empty="No active alerts returned by the API." />
      </section>
    </div>
  );

  const predictionsPage = (
    <div className="page-content">
      <PageHeader
        eyebrow="Intelligence / Predictions"
        title="Predictions"
        description="ML-generated ATM and transaction risk predictions"
        action={<button onClick={async () => {
          try {
            setLoading(true); setError('');
            await api.post('/predictions/run');
            const r = await api.get('/predictions');
            setPredictions(unwrap(r.data) as Prediction[]);
            setAuditEvents((p) => [{ time: new Date().toISOString(), action: 'Prediction run', detail: 'Seed predictions refreshed' }, ...p].slice(0, 50));
          } catch (err: any) {
            setError(err?.response?.status === 403 ? 'Your role cannot run predictions.' : 'Prediction run failed.');
          } finally { setLoading(false); }
        }} disabled={loading}><Play size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />Run prediction</button>}
      />
      <section className="card">
        <DataTable columns={['Prediction', 'ATM', 'Transaction', 'Risk Score', 'Risk Level', 'Model', 'Time']} rows={predictions.map((p, i) => {
          const score = Number(p.risk_score ?? p.predicted_risk);
          const atmId = String(value(p, ['atm_id'], ''));
          return [value(p, ['prediction_id', 'id'], `PRED-${i + 1}`), atmId !== '—' ? <button className="table-link" onClick={() => openATM(atmId)}>{atmId}</button> : '—', value(p, ['transaction_id']), Number.isFinite(score) ? score.toFixed(3) : '—', <Risk level={p.risk_level || riskFromScore(score)} />, value(p, ['model_version']), formatDate(value(p, ['timestamp', 'created_at'], ''))];
        })} empty="No predictions returned. Run the prediction job to refresh seed predictions." />
      </section>
    </div>
  );

  const analyticsPage = (
    <div className="page-content">
      <PageHeader eyebrow="Intelligence / Analytics" title="Analytics" description="Hourly activity and zone-level risk signals" action={<button onClick={() => setPage('Predictions')}><Eye size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />View predictions</button>} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <section className="card">
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-light)' }}><h3 style={{ margin: 0 }}>Hourly Activity</h3><p style={{ margin: '4px 0 0', fontSize: 11 }}>Aggregated hourly operational signals</p></div>
          <DataTable columns={['Hour', 'Transactions', 'Suspicious', 'Risk']} rows={hourly.map((r, i) => [
            value(r, ['hour', 'timestamp', 'time'], `Hour ${i + 1}`),
            value(r, ['transactions', 'transaction_count', 'count']),
            value(r, ['suspicious', 'suspicious_transactions', 'flagged']),
            value(r, ['risk_score', 'risk']),
          ])} empty="No hourly analytics returned." />
        </section>
        <section className="card">
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-light)' }}><h3 style={{ margin: 0 }}>Zone Analytics</h3><p style={{ margin: '4px 0 0', fontSize: 11 }}>Risk signals grouped by operational zone</p></div>
          <DataTable columns={['Zone', 'ATMs', 'Risk', 'Transactions']} rows={zones.map((r, i) => [
            value(r, ['zone', 'name'], `Zone ${i + 1}`),
            value(r, ['atm_count', 'atms', 'count']),
            <Risk level={String(value(r, ['risk_level', 'risk'], 'LOW')).toUpperCase()} score={Number(r.risk_score)} />,
            value(r, ['transactions', 'transaction_count']),
          ])} empty="No zone analytics returned." />
        </section>
      </div>
    </div>
  );

  const reportsPage = (
    <div className="page-content">
      <PageHeader eyebrow="Management / Reports" title="Reports" description="Generate operational reports from the backend" />
      <section className="card" style={{ padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Operational report</h3>
        <p style={{ fontSize: 12, color: '#929da8', lineHeight: 1.6 }}>
          The report action uses the existing protected reports API. The generated response is shown below so you can verify the backend integration.
        </p>
        <button onClick={async () => {
          try {
            setLoading(true); setError(''); setReportResult(null);
            const r = await api.post('/reports', {});
            setReportResult(r.data);
            setAuditEvents((p) => [{ time: new Date().toISOString(), action: 'Report generated', detail: 'Operational report requested' }, ...p].slice(0, 50));
          } catch (err: any) {
            setError(err?.response?.status === 403 ? 'Your role cannot generate reports.' : `Report generation failed (${err?.response?.status || 'network error'}).`);
          } finally { setLoading(false); }
        }} disabled={loading}><Download size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Generate report</button>
        {reportResult && <pre style={{ marginTop: 16, padding: 14, background: '#10161d', border: '1px solid var(--border-light)', overflow: 'auto', fontSize: 11 }}>{JSON.stringify(reportResult, null, 2)}</pre>}
      </section>
    </div>
  );

  const dataManagementPage = (
    <div className="page-content">
      <PageHeader eyebrow="Management / Data Management" title="Data Management" description="Operational dataset status and refresh controls" action={<button onClick={loadCore}><RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Refresh data</button>} />
      <div className="dashboard-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div className="kpi"><h3>ATMs</h3><strong>{atms.length}</strong><small>Loaded from API</small></div>
        <div className="kpi"><h3>Transactions</h3><strong>{transactions.length}</strong><small>Loaded from API</small></div>
        <div className="kpi"><h3>Alerts</h3><strong>{alerts.length}</strong><small>Current queue</small></div>
        <div className="kpi"><h3>Cases</h3><strong>{cases.length}</strong><small>Current workload</small></div>
      </div>
      <section className="card" style={{ marginTop: 12, padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>Dataset status</h3>
        <div className="detail-grid">
          <div><span>Source</span><strong>Synthetic operational dataset</strong></div>
          <div><span>API</span><strong>Connected</strong></div>
          <div><span>Last refresh</span><strong>{new Date().toLocaleString('en-IN')}</strong></div>
          <div><span>Purpose</span><strong>Prototype risk intelligence</strong></div>
        </div>
      </section>
    </div>
  );

  const modelManagementPage = (
    <div className="page-content">
      <PageHeader eyebrow="Management / Model Management" title="Model Management" description="Available ML model versions and metrics" action={<button onClick={async () => {
        try { const r = await api.get('/models'); setModels(unwrap(r.data)); setError(''); } catch (err: any) { setError(err?.response?.status === 403 ? 'Investigator role cannot access model management.' : 'Unable to load models.'); }
      }}><RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Refresh models</button>} />
      <section className="card">
        <DataTable columns={['Model', 'Version', 'Status', 'Metric / Details']} rows={models.map((m, i) => [
          value(m, ['name', 'model_name'], `Model ${i + 1}`),
          value(m, ['version', 'model_version']),
          <Risk level={String(value(m, ['status'], 'ACTIVE')).toUpperCase() === 'ACTIVE' ? 'LOW' : 'MEDIUM'} />,
          value(m, ['roc_auc', 'accuracy', 'metrics', 'description']),
        ])} empty="No model records returned, or your role does not have model-management permission." />
      </section>
    </div>
  );

  const auditPage = (
    <div className="page-content">
      <PageHeader eyebrow="Management / Audit Logs" title="Audit Logs" description="Local session activity recorded by the frontend" action={<button onClick={() => setAuditEvents([])}>Clear session log</button>} />
      <section className="card">
        <DataTable columns={['Time', 'Action', 'Detail']} rows={auditEvents.map((e) => [formatDate(e.time), <strong>{e.action}</strong>, e.detail])} empty="No frontend session events recorded yet. Refresh data or perform an operational action to create an event." />
      </section>
    </div>
  );

  const settingsPage = (
    <div className="page-content">
      <PageHeader eyebrow="System / Settings" title="Settings" description="Local application preferences and session controls" />
      <section className="card" style={{ padding: 20 }}>
        <div className="detail-grid">
          <div><span>Application</span><strong>CyberCash Predict</strong></div>
          <div><span>Environment</span><strong>Local prototype</strong></div>
          <div><span>API base</span><strong>/api</strong></div>
          <div><span>Dataset</span><strong>Synthetic only</strong></div>
        </div>
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
          <h3 style={{ marginTop: 0 }}>Session</h3>
          <button onClick={logout}><LogOut size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Sign out</button>
        </div>
      </section>
    </div>
  );

  if (!token) {
    return (
      <main className="login">
        <form onSubmit={doLogin}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', background: '#18283a', border: '1px solid #263e59', borderRadius: 6 }}><ShieldAlert size={20} /></div>
            <div><h1>CyberCash Predict</h1><p style={{ margin: 0 }}>ATM Risk Intelligence</p></div>
          </div>
          {error && <p className="error">{error}</p>}
          <label>Email<input type="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} /></label>
          <label>Password<input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></label>
          <button className="primary" type="submit" disabled={loggingIn}>{loggingIn ? 'Signing in...' : 'Sign in'}</button>
          <p style={{ marginTop: 16, fontSize: 11, textAlign: 'center' }}>Authorized personnel only</p>
        </form>
      </main>
    );
  }

  let content = dashboard;
  if (page === 'Live Risk Map') content = liveMap;
  else if (page === 'ATM Intelligence') content = atmIntelligence;
  else if (page === 'Transactions') content = transactionsPage;
  else if (page === 'Complaints') content = complaintsPage;
  else if (page === 'Cases') content = casesPage;
  else if (page === 'Alerts') content = alertsPage;
  else if (page === 'Predictions') content = predictionsPage;
  else if (page === 'Analytics') content = analyticsPage;
  else if (page === 'Reports') content = reportsPage;
  else if (page === 'Data Management') content = dataManagementPage;
  else if (page === 'Model Management') content = modelManagementPage;
  else if (page === 'Audit Logs') content = auditPage;
  else if (page === 'Settings') content = settingsPage;

  const navGroup = (label: string, items: string[]) => (
    <React.Fragment key={label}>
      <div style={{ padding: '18px 10px 7px', color: '#697581', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.8px' }}>{label}</div>
      {items.map((item) => (
        <button key={item} className={page === item ? 'active' : ''} onClick={() => { setPage(item); setError(''); }}>
          {getIcon(item)}<span>{item}</span>
        </button>
      ))}
    </React.Fragment>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div style={{ minHeight: 74, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 6, background: '#18283a', border: '1px solid #263e59' }}><BarChart3 size={19} color="#4c8dff" /></div>
          <div><div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '.2px' }}>CYBERCASH</div><div style={{ color: '#4c8dff', fontSize: 11, letterSpacing: '.4px' }}>PREDICT</div></div>
        </div>
        <nav>
          <div style={{ padding: '0 10px 7px', color: '#697581', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.8px' }}>Overview</div>
          <button className={page === 'Dashboard' ? 'active' : ''} onClick={() => { setPage('Dashboard'); setError(''); }}>{getIcon('Dashboard')}<span>Dashboard</span></button>
          {navGroup('Operations', ['Live Risk Map', 'ATM Intelligence', 'Transactions', 'Complaints', 'Cases', 'Alerts'])}
          {navGroup('Intelligence', ['Predictions', 'Analytics'])}
          {navGroup('Management', ['Reports', 'Data Management', 'Model Management', 'Audit Logs'])}
          {navGroup('System', ['Settings'])}
        </nav>
        <div style={{ marginTop: 'auto', padding: 14, borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#203650', color: '#dce7f3', fontSize: 11 }}>IN</div>
            <div style={{ flex: 1 }}><strong style={{ display: 'block', fontSize: 11 }}>Investigator</strong><span style={{ color: '#35b779', fontSize: 10 }}>● Online</span></div>
            <button onClick={logout} title="Sign out" style={{ padding: 6 }}><LogOut size={14} /></button>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <Search size={17} color="#697581" />
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ATM, transaction, case or location..." style={{ width: 330, border: '1px solid var(--border)', background: '#111820' }} />
            <kbd>Ctrl + K</kbd>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <span style={{ color: '#35b779', fontSize: 11 }}>● API Online</span>
            <span style={{ color: '#697581', fontSize: 11 }}>{new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            <span aria-label="Notifications"><Bell size={15} /></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><UserRound size={15} /><span style={{ fontSize: 11 }}>Investigator</span></div>
          </div>
        </header>

        {error && <div className="error" style={{ margin: '14px 28px 0' }}>{error}</div>}
        {content}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
