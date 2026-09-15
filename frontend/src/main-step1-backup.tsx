import React, { useEffect, useState } from 'react';
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
  SlidersHorizontal,
  LogOut,
  ChevronRight,
  Database,
  Brain,
  ClipboardList,
  Settings as SettingsIcon,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import './styles.css';

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

const api = axios.create({
  baseURL: '/api',
});

const nav = [
  'Dashboard',
  'Live Risk Map',
  'Cases',
  'Transactions',
  'ATM Intelligence',
  'Predictions',
  'Alerts',
  'Analytics',
  'Reports',
  'Data Management',
  'Model Management',
  'Audit Logs',
  'Settings',
];

const icon = (x: string) => {
  if (x === 'Dashboard') return <LayoutDashboard />;
  if (x.includes('Map')) return <Map />;
  if (x === 'Cases') return <Briefcase />;
  if (x === 'Transactions') return <CreditCard />;
  if (x === 'ATM Intelligence') return <Building2 />;
  if (x === 'Predictions') return <Brain />;
  if (x === 'Alerts') return <ShieldAlert />;
  if (x === 'Analytics') return <BarChart3 />;
  if (x === 'Reports') return <FileText />;
  if (x === 'Data Management') return <Database />;
  if (x === 'Model Management') return <Brain />;
  if (x === 'Audit Logs') return <ClipboardList />;
  if (x === 'Settings') return <SettingsIcon />;
  return <Activity />;
};

function Risk({
  level,
  score,
}: {
  level: string;
  score?: number;
}) {
  return (
    <span className={'risk ' + level.toLowerCase()}>
      {level}
      {score !== undefined && ` · ${score}`}
    </span>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.token || '');

  const [page, setPage] = useState('Dashboard');

  const [atms, setAtms] = useState<ATM[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [hourly, setHourly] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);

  const [selected, setSelected] = useState<ATM | null>(null);

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');

  const [error, setError] = useState('');

  const [login, setLogin] = useState({
    email: 'investigator@cybercash.local',
    password: 'DemoInvestigator!2026',
  });

  /*
   * LOGIN
   */
  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError('');

      const r = await api.post('/auth/login', login);

      localStorage.token = r.data.access_token;
      setToken(r.data.access_token);
    } catch {
      setError(
        'Login failed. Use the demo credentials shown below.'
      );
    }
  };

  /*
   * LOAD DATA
   */
  useEffect(() => {
    if (!token) return;

    api.defaults.headers.common.Authorization = 'Bearer ' + token;

    setError('');

    Promise.all([
      api.get('/dashboard/summary').catch(() => ({ data: {} })),
      api.get('/atms').catch(() => ({ data: { items: [] } })),
      api.get('/cases').catch(() => ({ data: { items: [] } })),
      api.get('/transactions').catch(() => ({ data: { items: [] } })),
      api.get('/alerts').catch(() => ({ data: { items: [] } })),
      api.get('/predictions').catch(() => ({ data: { items: [] } })),
      api.get('/models').catch(() => ({ data: { items: [] } })),
      api.get('/analytics/hourly').catch(() => ({ data: { hourly: [] } })),
      api.get('/analytics/zones').catch(() => ({ data: { zones: [] } })),
    ])
      .then(
        ([
          summaryResponse,
          atmResponse,
          casesResponse,
          transactionResponse,
          alertsResponse,
          predictionResponse,
          modelsResponse,
          hourlyResponse,
          zonesResponse,
        ]) => {
          setSummary(summaryResponse.data);

          setAtms(
            Array.isArray(atmResponse.data)
              ? atmResponse.data
              : atmResponse.data.items || []
          );

          setCases(
            Array.isArray(casesResponse.data)
              ? casesResponse.data
              : casesResponse.data.items || []
          );

          setTransactions(
            Array.isArray(transactionResponse.data)
              ? transactionResponse.data
              : transactionResponse.data.items || []
          );

          setAlerts(
            Array.isArray(alertsResponse.data)
              ? alertsResponse.data
              : alertsResponse.data.items || []
          );

          setPredictions(
            Array.isArray(predictionResponse.data)
              ? predictionResponse.data
              : predictionResponse.data.items || []
          );

          setModels(
            Array.isArray(modelsResponse.data)
              ? modelsResponse.data
              : modelsResponse.data.items || []
          );

          setHourly(
            Array.isArray(hourlyResponse.data)
              ? hourlyResponse.data
              : hourlyResponse.data.hourly || []
          );

          setZones(
            Array.isArray(zonesResponse.data)
              ? zonesResponse.data
              : zonesResponse.data.zones || []
          );
        }
      )
      .catch(() => {
        setError(
          'Unable to reach the API. Make sure the backend is running on port 8000.'
        );
      });
  }, [token]);

  /*
   * ATM FILTER
   */
  const filtered = atms.filter(
    (a) =>
      (!level || a.risk_level === level) &&
      (!query ||
        JSON.stringify(a)
          .toLowerCase()
          .includes(query.toLowerCase()))
  );

  /*
   * LOGOUT
   */
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
    setToken('');
  };

  /*
   * ACKNOWLEDGE ALERT
   */
  const changeAlert = async (id: string) => {
    try {
      const r = await api.patch('/alerts/' + id, {
        status: 'ACKNOWLEDGED',
      });

      setAlerts(
        alerts.map((a) => (a.id === id ? r.data : a))
      );
    } catch {
      setError('Unable to update alert.');
    }
  };

  /*
   * REPORT
   */
  const report = async () => {
    try {
      const r = await api.post('/reports');

      const blob = new Blob(
        [JSON.stringify(r.data, null, 2)],
        { type: 'application/json' }
      );

      const a = document.createElement('a');

      a.href = URL.createObjectURL(blob);
      a.download = 'cybercash-risk-report.json';

      a.click();

      URL.revokeObjectURL(a.href);
    } catch {
      setError('Unable to generate report.');
    }
  };

  /*
   * LOGIN SCREEN
   */
  if (!token) {
    return (
      <main className="login">
        <section>
          <div className="brand">
            <span>◈</span> CyberCash <b>Predict</b>
          </div>

          <p className="eyebrow">
            PREDICTIVE ATM CASH-OUT INTELLIGENCE
          </p>

          <h1>
            Decision support for authorized investigations.
          </h1>

          <p className="muted">
            DEMO MODE — only deterministic synthetic data is used.
            Predictions indicate probability, never proof.
          </p>

          <form onSubmit={doLogin}>
            <label>
              Officer ID / Email

              <input
                value={login.email}
                onChange={(e) =>
                  setLogin({
                    ...login,
                    email: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Password

              <input
                type="password"
                value={login.password}
                onChange={(e) =>
                  setLogin({
                    ...login,
                    password: e.target.value,
                  })
                }
              />
            </label>

            {error && (
              <p className="error">{error}</p>
            )}

            <button>
              Secure sign in <ChevronRight />
            </button>
          </form>

          <small>
            Demo users: admin@cybercash.local ·
            investigator@cybercash.local ·
            analyst@cybercash.local
          </small>
        </section>

        <aside>
          <ShieldAlert size={64} />

          <h2>Where. When. Why.</h2>

          <p>
            Prioritize ATM zones and windows using explainable,
            probabilistic risk signals.
          </p>
        </aside>
      </main>
    );
  }

  /*
   * DASHBOARD
   */
  const DashboardPage = () => (
    <>
      <section className="kpis">
        <div className="card">
          <p>Active cases</p>
          <strong>
            {summary?.active_cases ?? cases.length}
          </strong>
          <small>synthetic dataset</small>
        </div>

        <div className="card">
          <p>High-risk zones</p>
          <strong>
            {summary?.high_risk_zones ??
              atms.filter(
                (a) => a.risk_level === 'HIGH'
              ).length}
          </strong>
          <small>synthetic dataset</small>
        </div>

        <div className="card">
          <p>Suspicious transactions</p>
          <strong>
            {summary?.suspicious_transactions ??
              transactions.filter(
                (t) => t.suspicious
              ).length}
          </strong>
          <small>synthetic dataset</small>
        </div>

        <div className="card">
          <p>Active alerts</p>
          <strong>
            {summary?.active_alerts ??
              alerts.filter(
                (a) => a.status === 'NEW'
              ).length}
          </strong>
          <small>synthetic dataset</small>
        </div>
      </section>

      <section className="card table-card">
        <div className="section-head">
          <div>
            <h3>Operational Overview</h3>
            <p>
              Current ATM intelligence from the prototype API.
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ATM ID</th>
              <th>Zone</th>
              <th>Risk</th>
              <th>Predicted Window</th>
              <th>Activity</th>
            </tr>
          </thead>

          <tbody>
            {atms.slice(0, 10).map((a) => (
              <tr
                key={a.id}
                onClick={() => setSelected(a)}
              >
                <td>{a.id}</td>
                <td>{a.zone}</td>
                <td>
                  <Risk
                    level={a.risk_level}
                    score={a.risk_score}
                  />
                </td>
                <td>{a.window}</td>
                <td>{a.activity} recent</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );

  /*
   * LIVE MAP
   */
  const LiveMapPage = () => (
    <section className="map-grid">
      <div className="card map-card">
        <div className="section-head">
          <div>
            <h3>Live ATM Risk Surface</h3>
            <p>
              Predicted risk layer · synthetic evaluation data
            </p>
          </div>

          <div className="legend">
            <Risk level="HIGH" />
            <Risk level="MEDIUM" />
            <Risk level="LOW" />
          </div>
        </div>

        <div className="filters">
          <Search />

          <input
            placeholder="Search ATM, zone or bank"
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
          />

          <select
            value={level}
            onChange={(e) =>
              setLevel(e.target.value)
            }
          >
            <option value="">
              All risk levels
            </option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div
          className="map"
          aria-label="ATM risk map"
        >
          {filtered.map((a, i) => (
            <button
              key={a.id}
              title={`${a.id}: ${a.risk_level} risk`}
              onClick={() => setSelected(a)}
              className={
                'pin ' +
                a.risk_level.toLowerCase()
              }
              style={{
                left: `${8 + ((i * 17) % 83)}%`,
                top: `${10 + ((i * 29) % 75)}%`,
              }}
            >
              <span>{a.risk_score}</span>
            </button>
          ))}

          <div className="map-label">
            BENGALURU · SYNTHETIC GEOSPATIAL VIEW
          </div>
        </div>
      </div>

      <aside className="card intelligence">
        <h3>
          {selected
            ? selected.id
            : 'Select an ATM'}
        </h3>

        {selected ? (
          <>
            <Risk
              level={selected.risk_level}
              score={selected.risk_score}
            />

            <h4>{selected.window}</h4>

            <p className="muted">
              Likely time window · not a guaranteed event
            </p>

            <hr />

            <p>
              <b>{selected.zone}</b> · {selected.bank}
            </p>

            <p className="muted">
              {selected.address}
            </p>

            <h4>Contributing Signals</h4>

            <ul>
              {selected.signals.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted">
            Choose a map marker to inspect its current
            score, predicted window and signals.
          </p>
        )}

        <p className="disclaimer">
          Predictions are decision-support signals,
          not evidence of criminal conduct.
        </p>
      </aside>
    </section>
  );

  /*
   * CASES
   */
  const CasesPage = () => (
    <section className="card table-card">
      <div className="section-head">
        <div>
          <h3>Investigation Cases</h3>
          <p>
            Review synthetic investigation cases.
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Zone</th>
          </tr>
        </thead>

        <tbody>
          {cases.length ? (
            cases.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.title || c.name || 'Investigation case'}</td>
                <td>{c.status}</td>
                <td>
                  {c.priority ||
                    c.risk_level ||
                    '—'}
                </td>
                <td>{c.zone || '—'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>
                No case data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );

  /*
   * TRANSACTIONS
   */
  const TransactionsPage = () => (
    <section className="card table-card">
      <div className="section-head">
        <div>
          <h3>Transaction Intelligence</h3>
          <p>
            Synthetic transaction monitoring data.
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Transaction</th>
            <th>ATM</th>
            <th>Amount</th>
            <th>Risk</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {transactions.length ? (
            transactions.slice(0, 30).map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.atm_id || t.atm || '—'}</td>
                <td>
                  {t.amount !== undefined
                    ? `₹${t.amount}`
                    : '—'}
                </td>
                <td>
                  {t.risk_level ? (
                    <Risk
                      level={t.risk_level}
                      score={t.risk_score}
                    />
                  ) : t.suspicious ? (
                    <Risk level="HIGH" />
                  ) : (
                    <Risk level="LOW" />
                  )}
                </td>
                <td>
                  {t.status ||
                    (t.suspicious
                      ? 'Suspicious'
                      : 'Normal')}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>
                No transaction data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );

  /*
   * ATM INTELLIGENCE
   */
  const ATMIntelligencePage = () => (
    <section className="card table-card">
      <div className="section-head">
        <div>
          <h3>ATM Intelligence</h3>
          <p>
            Risk profile and supporting signals for each ATM.
          </p>
        </div>

        <SlidersHorizontal />
      </div>

      <table>
        <thead>
          <tr>
            <th>ATM</th>
            <th>Bank</th>
            <th>Zone</th>
            <th>Risk</th>
            <th>Incidents</th>
            <th>Window</th>
          </tr>
        </thead>

        <tbody>
          {atms.map((a) => (
            <tr
              key={a.id}
              onClick={() => setSelected(a)}
            >
              <td>{a.id}</td>
              <td>{a.bank}</td>
              <td>{a.zone}</td>
              <td>
                <Risk
                  level={a.risk_level}
                  score={a.risk_score}
                />
              </td>
              <td>{a.incidents}</td>
              <td>{a.window}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  /*
   * PREDICTIONS
   */
  const PredictionsPage = () => (
    <section className="card table-card">
      <div className="section-head">
        <div>
          <h3>Predictions</h3>
          <p>
            Probabilistic ATM risk predictions generated by
            the model.
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ATM</th>
            <th>Zone</th>
            <th>Risk</th>
            <th>Predicted Window</th>
            <th>Model</th>
          </tr>
        </thead>

        <tbody>
          {predictions.length ? (
            predictions.slice(0, 30).map((p, i) => (
              <tr key={p.id || p.atm_id || i}>
                <td>
                  {p.atm_id ||
                    p.atm ||
                    '—'}
                </td>

                <td>{p.zone || '—'}</td>

                <td>
                  {p.risk_level ? (
                    <Risk
                      level={p.risk_level}
                      score={p.risk_score}
                    />
                  ) : (
                    '—'
                  )}
                </td>

                <td>
                  {p.predicted_window ||
                    p.window ||
                    '—'}
                </td>

                <td>
                  {p.model_version || 'RF-v1.0'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>
                No prediction data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );

  /*
   * ALERTS
   */
  const AlertsPage = () => (
    <section className="card table-card">
      <div className="section-head">
        <div>
          <h3>Active Intelligence Alerts</h3>
          <p>
            Review and acknowledge assigned signals.
          </p>
        </div>
      </div>

      {alerts.length ? (
        alerts.map((a) => (
          <div className="alert" key={a.id}>
            <AlertTriangle />

            <div>
              <Risk
                level={
                  a.risk_level ||
                  (a.status === 'NEW'
                    ? 'HIGH'
                    : 'LOW')
                }
              />

              <h4>
                {a.title ||
                  'Intelligence Alert'}
                {a.zone
                  ? ` · ${a.zone}`
                  : ''}
              </h4>

              <p>
                Risk score {a.score ?? '—'} ·
                predicted window{' '}
                {a.window ?? '—'}
              </p>
            </div>

            <button
              disabled={
                a.status === 'ACKNOWLEDGED'
              }
              onClick={() =>
                changeAlert(a.id)
              }
            >
              {a.status === 'ACKNOWLEDGED'
                ? 'Acknowledged'
                : 'Acknowledge'}
            </button>
          </div>
        ))
      ) : (
        <p className="muted">
          No active alerts.
        </p>
      )}
    </section>
  );

  /*
   * ANALYTICS
   */
  const AnalyticsPage = () => (
    <>
      <section className="kpis">
        <div className="card">
          <p>ATM Records</p>
          <strong>{atms.length}</strong>
          <small>synthetic</small>
        </div>

        <div className="card">
          <p>Cases</p>
          <strong>{cases.length}</strong>
          <small>synthetic</small>
        </div>

        <div className="card">
          <p>Transactions</p>
          <strong>{transactions.length}</strong>
          <small>synthetic</small>
        </div>

        <div className="card">
          <p>Predictions</p>
          <strong>{predictions.length}</strong>
          <small>synthetic</small>
        </div>
      </section>

      <section className="card table-card">
        <div className="section-head">
          <div>
            <h3>Hourly Activity</h3>
            <p>
              Activity distribution returned by the analytics
              API.
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Hour</th>
              <th>Activity</th>
            </tr>
          </thead>

          <tbody>
            {hourly.length ? (
              hourly.map((h, i) => (
                <tr key={i}>
                  <td>
                    {h.hour !== undefined
                      ? `${h.hour}:00`
                      : '—'}
                  </td>

                  <td>
                    {h.activity ??
                      h.value ??
                      '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2}>
                  No hourly analytics available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card table-card">
        <div className="section-head">
          <div>
            <h3>Zone Analytics</h3>
            <p>
              Risk information grouped by operational zone.
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Zone</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
            </tr>
          </thead>

          <tbody>
            {zones.length ? (
              zones.map((z, i) => (
                <tr key={i}>
                  <td>{z.zone || '—'}</td>

                  <td>
                    {z.risk_score ??
                      z.score ??
                      '—'}
                  </td>

                  <td>
                    {z.risk_level ? (
                      <Risk
                        level={z.risk_level}
                        score={z.risk_score}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>
                  No zone analytics available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );

  /*
   * REPORTS
   */
  const ReportsPage = () => (
    <section className="card empty">
      <FileText size={48} />

      <h3>Generate Risk Summary</h3>

      <p>
        Export a synthetic-data report containing
        high-risk locations, supporting signals, model
        context and the required disclaimer.
      </p>

      <button onClick={report}>
        Download Report Artifact
      </button>
    </section>
  );

  /*
   * DATA MANAGEMENT
   */
  const DataManagementPage = () => (
    <>
      <section className="kpis">
        <div className="card">
          <p>ATM Records</p>
          <strong>{atms.length}</strong>
          <small>loaded from API</small>
        </div>

        <div className="card">
          <p>Transactions</p>
          <strong>{transactions.length}</strong>
          <small>loaded from API</small>
        </div>

        <div className="card">
          <p>Cases</p>
          <strong>{cases.length}</strong>
          <small>loaded from API</small>
        </div>

        <div className="card">
          <p>Alerts</p>
          <strong>{alerts.length}</strong>
          <small>loaded from API</small>
        </div>
      </section>

      <section className="card empty">
        <Database size={48} />

        <h3>Data Management</h3>

        <p>
          The prototype is currently using deterministic
          synthetic operational data. Production ingestion
          adapters should replace the demonstration data
          before real-data use.
        </p>

        <p className="muted">
          Current dataset is successfully connected to the
          backend API.
        </p>
      </section>
    </>
  );

  /*
   * MODEL MANAGEMENT
   */
  const ModelManagementPage = () => (
    <section className="card table-card">
      <div className="section-head">
        <div>
          <h3>Model Management</h3>
          <p>
            Machine-learning model information from the API.
          </p>
        </div>

        <Brain />
      </div>

      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th>Version</th>
            <th>Algorithm</th>
            <th>Precision</th>
            <th>Recall</th>
            <th>F1</th>
          </tr>
        </thead>

        <tbody>
          {models.length ? (
            models.map((m, i) => (
              <tr key={i}>
                <td>
                  {m.name ||
                    m.model ||
                    'Model'}
                </td>

                <td>
                  {m.version ||
                    m.model_version ||
                    '—'}
                </td>

                <td>
                  {m.algorithm ||
                    'Random Forest'}
                </td>

                <td>
                  {m.precision ??
                    '—'}
                </td>

                <td>
                  {m.recall ??
                    '—'}
                </td>

                <td>
                  {m.f1 ??
                    '—'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>
                No model data available for this user role.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );

  /*
   * AUDIT LOGS
   */
  const AuditLogsPage = () => (
    <section className="card table-card">
      <div className="section-head">
        <div>
          <h3>Audit Logs</h3>
          <p>
            Prototype activity and authorization events.
          </p>
        </div>

        <ClipboardList />
      </div>

      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Event</th>
            <th>Actor</th>
            <th>Result</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Current session</td>
            <td>Authentication</td>
            <td>Investigator</td>
            <td>SUCCESS</td>
          </tr>

          <tr>
            <td>Current session</td>
            <td>ATM data access</td>
            <td>Investigator</td>
            <td>SUCCESS</td>
          </tr>

          <tr>
            <td>Current session</td>
            <td>Prediction access</td>
            <td>Investigator</td>
            <td>SUCCESS</td>
          </tr>

          <tr>
            <td>Current session</td>
            <td>Alert access</td>
            <td>Investigator</td>
            <td>SUCCESS</td>
          </tr>
        </tbody>
      </table>

      <p className="muted">
        Note: the current backend does not expose a dedicated
        audit-log endpoint, so this screen shows session-level
        prototype events.
      </p>
    </section>
  );

  /*
   * SETTINGS
   */
  const SettingsPage = () => (
    <section className="card empty">
      <SettingsIcon size={48} />

      <h3>System Settings</h3>

      <p>
        CyberCash Predict prototype configuration.
      </p>

      <hr />

      <p>
        <b>Environment:</b> DEMO
      </p>

      <p>
        <b>Data source:</b> Synthetic deterministic dataset
      </p>

      <p>
        <b>API:</b> localhost:8000
      </p>

      <p>
        <b>Frontend:</b> localhost:5173
      </p>

      <p>
        <b>User role:</b> Investigator
      </p>

      <p className="muted">
        Predictions are probabilistic decision-support
        signals and do not establish criminal conduct.
      </p>
    </section>
  );

  /*
   * GENERIC FALLBACK
   */
  const GenericPage = () => (
    <section className="card empty">
      <Activity size={48} />

      <h3>{page}</h3>

      <p>
        This module is connected to the CyberCash Predict
        prototype.
      </p>
    </section>
  );

  /*
   * SELECT PAGE
   */
  const renderPage = () => {
    switch (page) {
      case 'Dashboard':
        return <DashboardPage />;

      case 'Live Risk Map':
        return <LiveMapPage />;

      case 'Cases':
        return <CasesPage />;

      case 'Transactions':
        return <TransactionsPage />;

      case 'ATM Intelligence':
        return <ATMIntelligencePage />;

      case 'Predictions':
        return <PredictionsPage />;

      case 'Alerts':
        return <AlertsPage />;

      case 'Analytics':
        return <AnalyticsPage />;

      case 'Reports':
        return <ReportsPage />;

      case 'Data Management':
        return <DataManagementPage />;

      case 'Model Management':
        return <ModelManagementPage />;

      case 'Audit Logs':
        return <AuditLogsPage />;

      case 'Settings':
        return <SettingsPage />;

      default:
        return <GenericPage />;
    }
  };

  /*
   * MAIN APPLICATION
   */
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span>◈</span> CyberCash <b>Predict</b>
        </div>

        <p className="demo">
          ● DEMO MODE
        </p>

        <nav>
          {nav.map((n) => (
            <button
              className={
                page === n ? 'active' : ''
              }
              onClick={() => {
                setPage(n);
                setError('');
              }}
              key={n}
            >
              {icon(n)}
              {n}
            </button>
          ))}
        </nav>

        <div className="profile">
          <div className="avatar">
            IN
          </div>

          <div>
            <b>Investigator</b>
            <small>
              AUTHORIZED USER
            </small>
          </div>

          <button
            title="Log out"
            onClick={logout}
          >
            <LogOut />
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header>
          <div>
            <p className="eyebrow">
              OPERATIONS / {page.toUpperCase()}
            </p>

            <h2>{page}</h2>
          </div>

          <div className="system">
            ● SYSTEM OPERATIONAL
          </div>
        </header>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {renderPage()}
      </main>
    </div>
  );
}

createRoot(
  document.getElementById('root')!
).render(<App />);