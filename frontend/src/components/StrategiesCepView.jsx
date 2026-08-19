import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../lib/sanityClient';

// ── Strategy definitions ───────────────────────────────────────────────────────
const STRATEGIES = [
  {
    key:       'pbl',
    label:     'Problem-Based Learning',
    icon:      'bi-puzzle-fill',
    color:     '#6366f1',
    gradient:  ['#4f46e5', '#7c3aed'],
    dataType:  'cepData_pbl',
    col1Header: 'Course Code and Title',
    col2Header: 'Learning Activity',
    col1Field:  'courseCodeTitle',
    col2Field:  'learningActivity',
    hasCol2:    true,
  },
  {
    key:       'projbl',
    label:     'Project-Based Learning',
    icon:      'bi-kanban-fill',
    color:     '#0ea5e9',
    gradient:  ['#0284c7', '#0369a1'],
    dataType:  'cepData_projbl',
    col1Header: 'Course Code and Title',
    col2Header: 'Learning Activity',
    col1Field:  'courseCodeTitle',
    col2Field:  'learningActivity',
    hasCol2:    true,
  },
  {
    key:       'mini',
    label:     'Mini Projects',
    icon:      'bi-box-fill',
    color:     '#10b981',
    gradient:  ['#059669', '#047857'],
    dataType:  'cepData_mini',
    col1Header: 'Course Code and Title',
    col2Header: 'Learning Activity',
    col1Field:  'courseCodeTitle',
    col2Field:  'learningActivity',
    hasCol2:    true,
  },
  {
    key:       'capstone',
    label:     'Capstone Projects',
    icon:      'bi-mortarboard-fill',
    color:     '#ef4444',
    gradient:  ['#dc2626', '#b91c1c'],
    dataType:  'cepData_capstone',
    col1Header: 'Course Code and Title',
    col2Header: 'Learning Activity',
    col1Field:  'courseCodeTitle',
    col2Field:  'learningActivity',
    hasCol2:    true,
  },
  {
    key:       'idp',
    label:     'Integrated Design Projects',
    icon:      'bi-layers-fill',
    color:     '#f59e0b',
    gradient:  ['#d97706', '#b45309'],
    dataType:  'cepData_idp',
    col1Header: 'Course Code and Title',
    col2Header: 'Learning Activity',
    col1Field:  'courseCodeTitle',
    col2Field:  'learningActivity',
    hasCol2:    true,
  },
  {
    key:       'hackathon',
    label:     'Hackathons',
    icon:      'bi-code-slash',
    color:     '#f97316',
    gradient:  ['#ea580c', '#c2410c'],
    dataType:  'cepData_hackathon',
    col1Header: 'Student Team',
    col2Header: 'Hackathon and Problem Statement',
    col1Field:  'studentTeam',
    col2Field:  'hackathonProblem',
    hasCol2:    true,
  },
  {
    key:       'abl',
    label:     'Activity Based Learning',
    icon:      'bi-people-fill',
    color:     '#8b5cf6',
    gradient:  ['#7c3aed', '#6d28d9'],
    dataType:  'cepData_abl',
    col1Header: 'Organized By',
    col2Header: null,
    col1Field:  'organizedBy',
    col2Field:  null,
    hasCol2:    false,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const sanitize = (str) => {
  if (!str) return '';
  return str
    .replace(/^[\uFEFF\u200B\u200C\u200D\u00A0\u202F\u2060]+/, '')
    .trim();
};

// ── Strategy Button ────────────────────────────────────────────────────────────
function StrategyButton({ strategy, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);
  const active = isActive || hovered;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.6rem 1.1rem',
        borderRadius: 10,
        border: `2px solid ${isActive ? strategy.color : strategy.color + '44'}`,
        background: isActive
          ? `linear-gradient(135deg, ${strategy.gradient[0]}, ${strategy.gradient[1]})`
          : hovered
          ? strategy.color + '18'
          : '#fff',
        color: isActive ? '#fff' : strategy.color,
        fontWeight: 700,
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'all 0.18s',
        boxShadow: isActive
          ? `0 4px 16px ${strategy.color}44`
          : hovered
          ? `0 2px 10px ${strategy.color}22`
          : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <i className={`bi ${strategy.icon}`} style={{ fontSize: '1rem' }} />
      {strategy.label}
    </button>
  );
}

// ── Data Table ─────────────────────────────────────────────────────────────────
function StrategyTable({ strategy, rows }) {
  const { color, col1Header, col2Header, col1Field, col2Field, hasCol2 } = strategy;

  if (rows.length === 0) {
    return (
      <div className="cse-loader-container">
        <div className="cse-loader-text">CSE</div>
      </div>
    );
  }

  return (
    <div className="table-container section-table-wrap" style={{ marginTop: '1rem' }}>
      <table className="table table-bordered table-hover align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th style={{ width: 55 }}>S.No</th>
            <th className="text-start" style={{ minWidth: 180 }}>{col1Header}</th>
            {hasCol2 && (
              <th className="text-start" style={{ minWidth: 160 }}>{col2Header}</th>
            )}
            <th className="text-start" style={{ minWidth: 200 }}>
              Complex Engineering Problem Addressed
            </th>
            <th className="text-start" style={{ minWidth: 200 }}>SDGs Mapped</th>
            <th style={{ width: 90 }}>Link</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row._id || idx}>
              {/* S.No */}
              <td>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: color + '22',
                    color,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  {row.sNo ?? idx + 1}
                </span>
              </td>

              {/* Col 1 (Course Code / Student Team / Organized By) */}
              <td className="text-start">
                <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                  {sanitize(row[col1Field]) || '—'}
                </strong>
              </td>

              {/* Col 2 (Learning Activity / Hackathon Statement) — optional */}
              {hasCol2 && (
                <td className="text-start">
                  {sanitize(row[col2Field]) ? (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 12,
                        background: color + '1a',
                        color,
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                    >
                      {sanitize(row[col2Field])}
                    </span>
                  ) : '—'}
                </td>
              )}

              {/* Complex Engineering Problem */}
              <td className="text-start" style={{ fontSize: '0.84rem', color: '#475569' }}>
                {sanitize(row.complexProblem) || '—'}
              </td>

              {/* SDGs Mapped */}
              <td className="text-start" style={{ fontSize: '0.84rem', color: '#475569' }}>
                {sanitize(row.sdg) || '—'}
              </td>

              {/* Link */}
              <td>
                {sanitize(row.link) ? (
                  <a
                    href={sanitize(row.link)}
                    target="_blank"
                    rel="noreferrer"
                    className="cert-link-badge"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="bi bi-box-arrow-up-right me-1" />
                    View
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
// ── Extract unique SDGs from rows ─────────────────────────────────────────────
function extractSDGs(rows) {
  const sdgs = new Set();
  rows.forEach(row => {
    if (row.sdg) {
      const matches = row.sdg.match(/SDG\s*\d+/gi);
      if (matches) {
        matches.forEach(m => sdgs.add(m.toUpperCase()));
      }
    }
  });
  return Array.from(sdgs).sort((a, b) => {
    const numA = parseInt(a.replace(/[^\d]/g, ''), 10);
    const numB = parseInt(b.replace(/[^\d]/g, ''), 10);
    return numA - numB;
  });
}

// ── Main Component ─────────────────────────────────────────────────────────────
function StrategiesCepView() {
  const [dataCache, setDataCache] = useState({});   // key → rows[]
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modalStrategy, setModalStrategy] = useState(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const newCache = {};
      await Promise.all(
        STRATEGIES.map(async (s) => {
          const query = `*[_type == $dataType] | order(sNo asc) {
            _id,
            sNo,
            courseCodeTitle,
            learningActivity,
            studentTeam,
            hackathonProblem,
            organizedBy,
            complexProblem,
            sdg,
            link
          }`;
          const data = await client.fetch(query, { dataType: s.dataType });
          newCache[s.key] = data || [];
        })
      );
      setDataCache(newCache);
    } catch (err) {
      console.error('CEP fetch error:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle closing modal on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setModalStrategy(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Error ── */}
      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* ── Loading ── */}
      {loading && (
        <div className="alert alert-info mb-4 d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" role="status"></div>
          <span className="cse-loader-text" style={{fontSize:"1.5rem"}}>CSE</span>
        </div>
      )}

      {/* ── Strategy Cards List ── */}
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {STRATEGIES.map((s) => {
            const rows = dataCache[s.key] || [];
            const sdgs = extractSDGs(rows);
            
            return (
              <div
                key={s.key}
                onClick={() => setModalStrategy(s)}
                style={{
                  background: '#fff',
                  border: `1px solid ${s.color}33`,
                  borderLeft: `4px solid ${s.color}`,
                  borderRadius: 12,
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 16px ${s.color}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 54,
                    height: 54,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${s.gradient[0]}, ${s.gradient[1]})`,
                    color: '#fff',
                    fontSize: '1.4rem',
                    flexShrink: 0,
                  }}
                >
                  <i className={`bi ${s.icon}`} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <h5 style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>
                      {s.label}
                    </h5>
                    <span
                      style={{
                        background: s.color + '1a',
                        color: s.color,
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {rows.length} record{rows.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>SDGs Covered:</span>
                    {sdgs.length > 0 ? (
                      sdgs.map(sdg => (
                        <span key={sdg} style={{
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          color: '#475569',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}>
                          {sdg}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>None mapped</span>
                    )}
                  </div>
                </div>
                
                <div style={{ color: s.color, fontSize: '1.5rem', opacity: 0.5 }}>
                  <i className="bi bi-chevron-right" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal (Pop up message) ── */}
      {modalStrategy && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)', 
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }} 
          onClick={() => setModalStrategy(null)}
        >
          <div 
            style={{
              background: '#fff', 
              borderRadius: 16, 
              width: '100%', 
              maxWidth: '1100px',
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)', 
              overflow: 'hidden',
              animation: 'modalFadeIn 0.2s ease-out'
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: `linear-gradient(135deg, ${modalStrategy.gradient[0]}, ${modalStrategy.gradient[1]})`,
              color: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  width: 36, height: 36, 
                  borderRadius: 10, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem' 
                }}>
                  <i className={`bi ${modalStrategy.icon}`} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.15rem' }}>
                    {modalStrategy.label}
                  </h4>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                    {(dataCache[modalStrategy.key] || []).length} Records
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setModalStrategy(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
              <StrategyTable strategy={modalStrategy} rows={dataCache[modalStrategy.key] || []} />
            </div>
          </div>
          
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(0.98) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default StrategiesCepView;
