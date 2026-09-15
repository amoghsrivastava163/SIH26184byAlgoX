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
  LogOut,
  Settings,
  Database,
  Brain,
  ClipboardList,
  ArrowUpRight,
  UserRound
} from 'lucide-react';

import './styles.css';


/* =========================================================
   TYPES
   ========================================================= */

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


/* =========================================================
   API
   ========================================================= */

const api = axios.create({
  baseURL: '/api'
});


/* =========================================================
   NAVIGATION
   ========================================================= */

const nav = [
  'Dashboard',
  'Live Risk Map',
  'ATM Intelligence',
  'Transactions',
  'Cases',
  'Alerts',
  'Predictions',
  'Analytics',
  'Reports',
  'Data Management',
  'Model Management',
  'Audit Logs',
  'Settings'
];


function getIcon(name: string) {

  if (name === 'Dashboard') {
    return <LayoutDashboard />;
  }

  if (name === 'Live Risk Map') {
    return <Map />;
  }

  if (name === 'ATM Intelligence') {
    return <Building2 />;
  }

  if (name === 'Transactions') {
    return <Activity />;
  }

  if (name === 'Cases') {
    return <ClipboardList />;
  }

  if (name === 'Alerts') {
    return <ShieldAlert />;
  }

  if (name === 'Predictions') {
    return <Brain />;
  }

  if (name === 'Analytics') {
    return <BarChart3 />;
  }

  if (name === 'Reports') {
    return <FileText />;
  }

  if (name === 'Data Management') {
    return <Database />;
  }

  if (name === 'Model Management') {
    return <Brain />;
  }

  if (name === 'Audit Logs') {
    return <ClipboardList />;
  }

  if (name === 'Settings') {
    return <Settings />;
  }

  return <Activity />;
}


/* =========================================================
   RISK BADGE
   ========================================================= */

function Risk({
  level,
  score
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


/* =========================================================
   APP
   ========================================================= */

function App() {

  const [token, setToken] = useState(
    localStorage.getItem('token') || ''
  );

  const [page, setPage] = useState('Dashboard');

  const [atms, setAtms] = useState<ATM[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [summary, setSummary] =
    useState<any>(null);

  const [alerts, setAlerts] =
    useState<any[]>([]);

  const [selected, setSelected] =
    useState<ATM | null>(null);

  const [query, setQuery] =
    useState('');

  const [error, setError] =
    useState('');

  const [login, setLogin] = useState({
    email: 'investigator@cybercash.local',
    password: 'DemoInvestigator!2026'
  });

  const [loggingIn, setLoggingIn] =
    useState(false);


  /* =======================================================
     LOAD DATA
     ======================================================= */

  useEffect(() => {

    if (!token) {
      return;
    }

    api.defaults.headers.common.Authorization =
      'Bearer ' + token;

    Promise.all([
      api.get('/dashboard/summary'),

      api.get('/atms'),

      api.get('/transactions'),

      api.get('/alerts').catch(() => ({
        data: { items: [] }
      }))
    ])

      .then(
        ([
          summaryResponse,
          atmResponse,
          transactionResponse,
          alertResponse
        ]) => {

          setSummary(
            summaryResponse.data
          );

          const atmItems =
            atmResponse.data.items || [];

          setAtms(atmItems);

          setTransactions(
            transactionResponse.data.items || []
          );

          setAlerts(
            alertResponse.data.items || []
          );

          if (atmItems.length > 0) {
            setSelected(atmItems[0]);
          }

          setError('');

        }
      )

      .catch((err) => {

        console.error(err);

        setError(
          'Unable to reach the API. Start the backend at port 8000.'
        );

      });

  }, [token]);


  /* =======================================================
     LOGIN
     ======================================================= */

  const doLogin = async (
    event: React.FormEvent
  ) => {

    event.preventDefault();

    setLoggingIn(true);
    setError('');

    try {

      const response =
        await api.post(
          '/auth/login',
          login
        );

      const newToken =
        response.data.access_token ||
        response.data.token;

      localStorage.setItem(
        'token',
        newToken
      );

      setToken(newToken);

    } catch (err) {

      console.error(err);

      setError(
        'Login failed. Check the email and password.'
      );

    } finally {

      setLoggingIn(false);

    }
  };


  /* =======================================================
     LOGOUT
     ======================================================= */

  const logout = () => {

    localStorage.removeItem('token');

    delete api.defaults
      .headers.common.Authorization;

    setToken('');

  };


  /* =======================================================
     LOGIN SCREEN
     ======================================================= */

  if (!token) {

    return (

      <main className="login">

        <form onSubmit={doLogin}>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 22
            }}
          >

            <div
              style={{
                width: 38,
                height: 38,
                display: 'grid',
                placeItems: 'center',
                background: '#18283a',
                border: '1px solid #263e59',
                borderRadius: 6
              }}
            >

              <ShieldAlert size={20} />

            </div>


            <div>

              <h1>
                CyberCash Predict
              </h1>

              <p
                style={{
                  margin: 0
                }}
              >
                ATM Risk Intelligence
              </p>

            </div>

          </div>


          {error && (
            <p className="error">
              {error}
            </p>
          )}


          <label>

            Email

            <input
              type="email"
              value={login.email}
              onChange={(event) =>
                setLogin({
                  ...login,
                  email: event.target.value
                })
              }
            />

          </label>


          <label>

            Password

            <input
              type="password"
              value={login.password}
              onChange={(event) =>
                setLogin({
                  ...login,
                  password: event.target.value
                })
              }
            />

          </label>


          <button
            className="primary"
            type="submit"
            disabled={loggingIn}
          >

            {loggingIn
              ? 'Signing in...'
              : 'Sign in'}

          </button>


          <p
            style={{
              marginTop: 16,
              fontSize: 11,
              textAlign: 'center'
            }}
          >
            Authorized personnel only
          </p>

        </form>

      </main>

    );

  }


  /* =======================================================
     DASHBOARD
     ======================================================= */

  const dashboard = (

    <div className="page-content">


      {/* PAGE HEADING */}

      <div
        className="page-heading"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 18
        }}
      >

        <div>

          <div
            style={{
              color: '#697581',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '.5px',
              marginBottom: 4
            }}
          >
            Operations / Dashboard
          </div>

          <h1
            style={{
              margin: 0
            }}
          >
            Dashboard
          </h1>

          <p
            style={{
              margin: '4px 0 0'
            }}
          >
            ATM and transaction risk overview
          </p>

        </div>


        <button>
          Last 24 hours ▾
        </button>

      </div>


      {/* =====================================================
          KPI CARDS
         ===================================================== */}

      <div
        className="dashboard-kpis"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(5, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 14
        }}
      >


        {/* ATMS */}

        <div className="kpi">

          <h3>
            ATMs monitored
          </h3>

          <strong>
            {atms.length || '—'}
          </strong>

          <small>
            Active ATM fleet
          </small>

        </div>


        {/* HIGH RISK */}

        <div className="kpi">

          <h3>
            High-risk ATMs
          </h3>

          <strong>

            {
              atms.filter(
                (atm) =>
                  atm.risk_level === 'HIGH' ||
                  atm.risk_level === 'CRITICAL'
              ).length
            }

          </strong>

          <small>
            Requires attention
          </small>

        </div>


        {/* FLAGGED TRANSACTIONS */}

        <div className="kpi">

          <h3>
            Flagged transactions
          </h3>

          <strong>
            {summary?.suspicious_transactions ?? '—'}
          </strong>

          <small>
            From synthetic dataset
          </small>

        </div>


        {/* ALERTS */}

        <div className="kpi">

          <h3>
            Open alerts
          </h3>

          <strong>
            {alerts.length}
          </strong>

          <small>
            Active alert queue
          </small>

        </div>


        {/* CASES */}

        <div className="kpi">

          <h3>
            Active cases
          </h3>

          <strong>
            {summary?.active_cases ?? '—'}
          </strong>

          <small>
            Investigation workload
          </small>

        </div>

      </div>


      {/* =====================================================
          MAP + RIGHT COLUMN
         ===================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1.35fr) minmax(340px, .65fr)',
          gap: 12,
          marginBottom: 12
        }}
      >


        {/* ===================================================
            ATM RISK MAP
           =================================================== */}

        <section className="card">

          <div
            style={{
              padding: '15px 16px',
              borderBottom:
                '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >

            <div>

              <h3
                style={{
                  margin: 0
                }}
              >
                ATM Risk Overview
              </h3>

              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 11
                }}
              >
                Current predicted risk across monitored ATMs
              </p>

            </div>


            <button
              onClick={() =>
                setPage('Live Risk Map')
              }
            >
              View map →
            </button>

          </div>


          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(0, 1fr) 250px',
              minHeight: 310
            }}
          >


            {/* MAP */}

            <div
              style={{
                position: 'relative',
                background:
                  'radial-gradient(circle at center, #18232d 0%, #111820 70%)',
                overflow: 'hidden'
              }}
            >


              {/* GRID */}

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: .18,
                  backgroundImage:
                    'linear-gradient(#41505c 1px, transparent 1px), linear-gradient(90deg, #41505c 1px, transparent 1px)',
                  backgroundSize:
                    '45px 45px'
                }}
              />


              {/* LABEL */}

              <div
                style={{
                  position: 'absolute',
                  top: 18,
                  left: 18,
                  color: '#697581',
                  fontSize: 10,
                  textTransform: 'uppercase'
                }}
              >
                Bengaluru · Synthetic geospatial view
              </div>


              {/* ATM MARKERS */}

              {atms
                .slice(0, 20)
                .map((atm, index) => {

                  const x =
                    10 +
                    ((index * 29) % 80);

                  const y =
                    23 +
                    ((index * 43) % 62);


                  let marker =
                    '#35b779';


                  if (
                    atm.risk_level === 'MEDIUM'
                  ) {
                    marker =
                      '#d9a441';
                  }


                  if (
                    atm.risk_level === 'HIGH'
                  ) {
                    marker =
                      '#e06b5d';
                  }


                  if (
                    atm.risk_level === 'CRITICAL'
                  ) {
                    marker =
                      '#c93c3c';
                  }


                  return (

                    <button
                      key={atm.id}
                      onClick={() =>
                        setSelected(atm)
                      }
                      title={atm.id}
                      style={{
                        position: 'absolute',
                        left: `${x}%`,
                        top: `${y}%`,
                        width: 11,
                        height: 11,
                        minHeight: 11,
                        padding: 0,
                        borderRadius: '50%',
                        border:
                          '2px solid ' +
                          marker,
                        background:
                          marker,
                        boxShadow: 'none',
                        transform:
                          'translate(-50%, -50%)'
                      }}
                    />

                  );

                })}


              {/* LEGEND */}

              <div
                style={{
                  position: 'absolute',
                  left: 18,
                  bottom: 16,
                  display: 'flex',
                  gap: 14,
                  fontSize: 10,
                  color: '#929da8'
                }}
              >

                <span>
                  ● Low
                </span>

                <span>
                  ● Medium
                </span>

                <span>
                  ● High
                </span>

                <span>
                  ● Critical
                </span>

              </div>

            </div>


            {/* SELECTED ATM */}

            <div
              style={{
                padding: 17,
                borderLeft:
                  '1px solid var(--border-light)'
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center'
                }}
              >

                <span
                  style={{
                    color: '#697581',
                    fontSize: 11
                  }}
                >
                  Selected ATM
                </span>


                <ArrowUpRight
                  size={15}
                  color="#4c8dff"
                />

              </div>


              {selected ? (

                <>

                  <h2
                    style={{
                      margin:
                        '20px 0 3px'
                    }}
                  >
                    {selected.id}
                  </h2>


                  <p
                    style={{
                      margin: 0,
                      fontSize: 12
                    }}
                  >
                    {selected.bank}
                  </p>


                  <p
                    style={{
                      margin:
                        '3px 0 18px',
                      fontSize: 11
                    }}
                  >
                    {selected.address}
                  </p>


                  <div
                    style={{
                      borderTop:
                        '1px solid var(--border-light)'
                    }}
                  >


                    {/* RISK SCORE */}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        padding: '10px 0',
                        borderBottom:
                          '1px solid var(--border-light)'
                      }}
                    >

                      <span>
                        Risk score
                      </span>

                      <strong>
                        {selected.risk_score}
                      </strong>

                    </div>


                    {/* RISK LEVEL */}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom:
                          '1px solid var(--border-light)'
                      }}
                    >

                      <span>
                        Risk level
                      </span>

                      <Risk
                        level={
                          selected.risk_level
                        }
                      />

                    </div>


                    {/* ACTIVITY */}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        padding: '10px 0',
                        borderBottom:
                          '1px solid var(--border-light)'
                      }}
                    >

                      <span>
                        Activity
                      </span>

                      <strong>
                        {selected.activity}
                      </strong>

                    </div>


                    {/* INCIDENTS */}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        padding: '10px 0'
                      }}
                    >

                      <span>
                        Incidents
                      </span>

                      <strong>
                        {selected.incidents}
                      </strong>

                    </div>

                  </div>

                </>

              ) : (

                <p>
                  Select an ATM marker to view details.
                </p>

              )}

            </div>

          </div>

        </section>


        {/* ===================================================
            RIGHT COLUMN
           =================================================== */}

        <div
          style={{
            display: 'grid',
            gap: 12
          }}
        >


          {/* RISK DISTRIBUTION */}

          <section className="card">

            <div
              style={{
                padding: '15px 16px',
                borderBottom:
                  '1px solid var(--border-light)'
              }}
            >

              <h3
                style={{
                  margin: 0
                }}
              >
                Risk Distribution
              </h3>

              <p
                style={{
                  margin:
                    '3px 0 0',
                  fontSize: 11
                }}
              >
                ATM fleet by predicted risk level
              </p>

            </div>


            <div
              style={{
                padding: 16
              }}
            >

              {[
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
              ].map((riskLevel) => {

                const count =
                  atms.filter(
                    (atm) =>
                      atm.risk_level ===
                      riskLevel
                  ).length;


                const percentage =
                  atms.length
                    ? Math.round(
                        (count /
                          atms.length) *
                          100
                      )
                    : 0;


                return (

                  <div
                    key={riskLevel}
                    style={{
                      marginBottom: 13
                    }}
                  >

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        marginBottom: 5
                      }}
                    >

                      <span
                        style={{
                          fontSize: 11
                        }}
                      >
                        {riskLevel}
                      </span>


                      <span
                        style={{
                          color:
                            'var(--text-secondary)',
                          fontSize: 11
                        }}
                      >
                        {count} · {percentage}%
                      </span>

                    </div>


                    <div
                      style={{
                        height: 6,
                        background:
                          '#202a33',
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}
                    >

                      <div
                        style={{
                          width:
                            `${percentage}%`,
                          height: '100%',
                          background:
                            riskLevel ===
                            'LOW'
                              ? '#35b779'
                              : riskLevel ===
                                'MEDIUM'
                              ? '#d9a441'
                              : riskLevel ===
                                'HIGH'
                              ? '#e06b5d'
                              : '#c93c3c'
                        }}
                      />

                    </div>

                  </div>

                );

              })}

            </div>

          </section>


          {/* RECENT ALERTS */}

          <section className="card">

            <div
              style={{
                padding: '15px 16px',
                borderBottom:
                  '1px solid var(--border-light)',
                display: 'flex',
                justifyContent:
                  'space-between'
              }}
            >

              <h3
                style={{
                  margin: 0
                }}
              >
                Recent Alerts
              </h3>


              <button
                onClick={() =>
                  setPage('Alerts')
                }
              >
                View all →
              </button>

            </div>


            <div>

              {alerts
                .slice(0, 4)
                .map((alert, index) => (

                  <div
                    key={
                      alert.id ||
                      index
                    }
                    style={{
                      padding:
                        '11px 16px',
                      borderBottom:
                        '1px solid var(--border-light)',
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      gap: 12
                    }}
                  >

                    <div>

                      <strong
                        style={{
                          display:
                            'block',
                          fontSize: 11
                        }}
                      >
                        {
                          alert.title ||
                          alert.message ||
                          alert.description ||
                          'Risk alert'
                        }
                      </strong>


                      <span
                        style={{
                          color:
                            '#697581',
                          fontSize: 10
                        }}
                      >
                        {
                          alert.atm_id ||
                          alert.atm ||
                          'ATM'
                        }
                      </span>

                    </div>


                    <AlertTriangle
                      size={15}
                      color="#d9a441"
                    />

                  </div>

                ))}


              {alerts.length === 0 && (

                <div
                  style={{
                    padding: 18,
                    color:
                      '#697581',
                    fontSize: 11
                  }}
                >
                  No active alerts returned by the API.
                </div>

              )}

            </div>

          </section>

        </div>

      </div>


      {/* =====================================================
          RECENT TRANSACTIONS
         ===================================================== */}

      <section className="card">

        <div
          style={{
            padding: '15px 16px',
            borderBottom:
              '1px solid var(--border-light)',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center'
          }}
        >

          <div>

            <h3
              style={{
                margin: 0
              }}
            >
              Recent Transactions
            </h3>

            <p
              style={{
                margin:
                  '3px 0 0',
                fontSize: 11
              }}
            >
              Recent transaction activity from the prototype API
            </p>

          </div>


          <button
            onClick={() =>
              setPage('Transactions')
            }
          >
            View all →
          </button>

        </div>


        <div
          style={{
            overflowX: 'auto'
          }}
        >

          <table>

            <thead>

              <tr>

                <th>
                  Transaction
                </th>

                <th>
                  ATM ID
                </th>

                <th>
                  Time
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Risk Score
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              {transactions
                .slice(0, 8)
                .map(
                  (
                    transaction,
                    index
                  ) => {

                    const risk =
                      transaction.risk_score ??
                      0;


                    const riskLevel =
                      risk >= 0.8
                        ? 'HIGH'
                        : risk >= 0.5
                        ? 'MEDIUM'
                        : 'LOW';


                    return (

                      <tr
                        key={
                          transaction.transaction_id ||
                          transaction.id ||
                          index
                        }
                      >

                        <td>

                          <strong>
                            {
                              transaction.transaction_id ||
                              transaction.id ||
                              `TXN-${index + 1}`
                            }
                          </strong>

                        </td>


                        <td>
                          {
                            transaction.atm_id ||
                            '—'
                          }
                        </td>


                        <td>
                          {
                            transaction.timestamp ||
                            transaction.time ||
                            '—'
                          }
                        </td>


                        <td>

                          ₹
                          {
                            typeof transaction.amount ===
                            'number'
                              ? transaction.amount.toLocaleString(
                                  'en-IN'
                                )
                              : '—'
                          }

                        </td>


                        <td>

                          {
                            typeof transaction.risk_score ===
                            'number'
                              ? transaction.risk_score.toFixed(
                                  2
                                )
                              : '—'
                          }

                        </td>


                        <td>

                          <Risk
                            level={
                              riskLevel
                            }
                            score={
                              typeof transaction.risk_score ===
                              'number'
                                ? transaction.risk_score
                                : undefined
                            }
                          />

                        </td>

                      </tr>

                    );

                  }
                )}


              {transactions.length === 0 && (

                <tr>

                  <td
                    colSpan={6}
                    style={{
                      textAlign:
                        'center',
                      padding: 24,
                      color:
                        '#697581'
                    }}
                  >
                    No transaction records returned by the API.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>

  );


  /* =======================================================
     TEMPORARY OTHER PAGES
     ======================================================= */

  const otherPage = (

    <div
      className="page-content"
    >

      <div
        style={{
          color: '#697581',
          fontSize: 11,
          textTransform:
            'uppercase',
          letterSpacing: '.5px'
        }}
      >
        Operations / {page}
      </div>


      <h1
        style={{
          margin:
            '5px 0 4px'
        }}
      >
        {page}
      </h1>


      <p>
        This module will be redesigned in the next step.
      </p>


      <section
        className="card"
        style={{
          marginTop: 20,
          padding: 20
        }}
      >

        <h3>
          {page} module
        </h3>

        <p>
          The API integration is preserved.
          This page will receive its own
          operational layout during the next
          redesign step.
        </p>

      </section>

    </div>

  );


  /* =======================================================
     APPLICATION SHELL
     ======================================================= */

  return (

    <div className="shell">


      {/* ===================================================
          SIDEBAR
         =================================================== */}

      <aside className="sidebar">


        {/* BRAND */}

        <div
          style={{
            minHeight: 74,
            padding: '0 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >

          <div
            style={{
              width: 34,
              height: 34,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 6,
              background:
                '#18283a',
              border:
                '1px solid #263e59'
            }}
          >

            <BarChart3
              size={19}
              color="#4c8dff"
            />

          </div>


          <div>

            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '.2px'
              }}
            >
              CYBERCASH
            </div>


            <div
              style={{
                color:
                  '#4c8dff',
                fontSize: 11,
                letterSpacing: '.4px'
              }}
            >
              PREDICT
            </div>

          </div>

        </div>


        {/* NAVIGATION */}

        <nav>


          {/* OVERVIEW */}

          <div
            style={{
              padding:
                '0 10px 7px',
              color:
                '#697581',
              fontSize: 9,
              textTransform:
                'uppercase',
              letterSpacing:
                '.8px'
            }}
          >
            Overview
          </div>


          {nav
            .slice(0, 1)
            .map((item) => (

              <button
                key={item}
                className={
                  page === item
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setPage(item)
                }
              >

                {getIcon(item)}

                <span>
                  {item}
                </span>

              </button>

            ))}


          {/* OPERATIONS */}

          <div
            style={{
              padding:
                '18px 10px 7px',
              color:
                '#697581',
              fontSize: 9,
              textTransform:
                'uppercase',
              letterSpacing:
                '.8px'
            }}
          >
            Operations
          </div>


          {nav
            .slice(1, 6)
            .map((item) => (

              <button
                key={item}
                className={
                  page === item
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setPage(item)
                }
              >

                {getIcon(item)}

                <span>
                  {item}
                </span>

              </button>

            ))}


          {/* INTELLIGENCE */}

          <div
            style={{
              padding:
                '18px 10px 7px',
              color:
                '#697581',
              fontSize: 9,
              textTransform:
                'uppercase',
              letterSpacing:
                '.8px'
            }}
          >
            Intelligence
          </div>


          {nav
            .slice(6, 8)
            .map((item) => (

              <button
                key={item}
                className={
                  page === item
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setPage(item)
                }
              >

                {getIcon(item)}

                <span>
                  {item}
                </span>

              </button>

            ))}


          {/* MANAGEMENT */}

          <div
            style={{
              padding:
                '18px 10px 7px',
              color:
                '#697581',
              fontSize: 9,
              textTransform:
                'uppercase',
              letterSpacing:
                '.8px'
            }}
          >
            Management
          </div>


          {nav
            .slice(8, 12)
            .map((item) => (

              <button
                key={item}
                className={
                  page === item
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setPage(item)
                }
              >

                {getIcon(item)}

                <span>
                  {item}
                </span>

              </button>

            ))}


          {/* SYSTEM */}

          <div
            style={{
              padding:
                '18px 10px 7px',
              color:
                '#697581',
              fontSize: 9,
              textTransform:
                'uppercase',
              letterSpacing:
                '.8px'
            }}
          >
            System
          </div>


          {nav
            .slice(12)
            .map((item) => (

              <button
                key={item}
                className={
                  page === item
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setPage(item)
                }
              >

                {getIcon(item)}

                <span>
                  {item}
                </span>

              </button>

            ))}

        </nav>


        {/* USER AREA */}

        <div
          style={{
            marginTop:
              'auto',
            padding: 14,
            borderTop:
              '1px solid var(--border-light)'
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9
            }}
          >

            <div
              style={{
                width: 30,
                height: 30,
                display: 'grid',
                placeItems:
                  'center',
                borderRadius:
                  '50%',
                background:
                  '#203650',
                color:
                  '#dce7f3',
                fontSize: 11
              }}
            >
              IN
            </div>


            <div
              style={{
                flex: 1
              }}
            >

              <strong
                style={{
                  display:
                    'block',
                  fontSize: 11
                }}
              >
                Investigator
              </strong>


              <span
                style={{
                  color:
                    '#35b779',
                  fontSize: 10
                }}
              >
                ● Online
              </span>

            </div>


            <button
              onClick={logout}
              title="Sign out"
              style={{
                padding: 6
              }}
            >

              <LogOut
                size={14}
              />

            </button>

          </div>

        </div>

      </aside>


      {/* ===================================================
          WORKSPACE
         =================================================== */}

      <main className="workspace">


        {/* HEADER */}

        <header>


          <div
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap: 10,
              flex: 1
            }}
          >

            <Search
              size={17}
              color="#697581"
            />


            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Search ATM, transaction, or case ID..."
              style={{
                width: 330,
                border:
                  '1px solid var(--border)',
                background:
                  '#111820'
              }}
            />

          </div>


          <div
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap: 22
            }}
          >

            <span
              style={{
                color:
                  '#35b779',
                fontSize: 11
              }}
            >
              ● API Online
            </span>


            <span
              style={{
                color:
                  '#697581',
                fontSize: 11
              }}
            >
              Last sync: just now
            </span>


            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                gap: 7
              }}
            >

              <UserRound
                size={15}
              />

              <span
                style={{
                  fontSize: 11
                }}
              >
                Investigator
              </span>

            </div>

          </div>

        </header>


        {/* ERROR */}

        {error && (

          <p className="error">
            {error}
          </p>

        )}


        {/* PAGE */}

        {page === 'Dashboard'
          ? dashboard
          : otherPage}

      </main>

    </div>

  );

}


/* =========================================================
   START REACT APPLICATION
   ========================================================= */

createRoot(
  document.getElementById('root')!
).render(
  <App />
);