import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

// ── Cluster definitions ────────────────────────────────────────────────────────
const CLUSTERS = [
  {
    name: 'Role Play',
    variants: ['Role Play', 'Role play', 'RolePlay', 'ROLE play', 'Activity-Role Play',
      'Activity Based Learning (Role Play)', 'Working Models and Role Play'],
    color: '#6366f1',
  },
  {
    name: 'Case Study',
    variants: ['Case Study', 'Case study', 'case study', 'Case Study Based Learning',
      'Case-study based Learning', 'GSM Case Study', 'Case Study Presentation',
      'Case Study/Real-time Assignment'],
    color: '#0ea5e9',
  },
  {
    name: 'Quiz',
    variants: ['Quiz', 'Online Quiz', 'QUIZ', 'Quiz - Directed Translation',
      'Quiz + Activities', 'Crossword Puzzle & Quiz'],
    color: '#f59e0b',
  },
  {
    name: 'Seminar',
    variants: ['Seminar', 'Seminar Presentation', 'Seminar & Peer Learning',
      'Seminar + Assignment', 'Activity-Seminar'],
    color: '#10b981',
  },
  {
    name: 'Project / PBL',
    variants: ['Project', 'Mini Project', 'Micro Project', 'HCL Project',
      'Project Based Learning', 'Project-based Learning', 'Mini Project Based Learning',
      'Project Evaluation by Industry Expert'],
    color: '#ef4444',
  },
  {
    name: 'Industrial / Expert Lecture',
    variants: ['Industrial Expert Lecture', 'Industry Expert Lecture',
      'Industry Guest Lecture', 'Industrial Guest Lecture',
      'Practical Session by Industry Expert'],
    color: '#8b5cf6',
  },
  {
    name: 'Infosys Springboard',
    variants: ['Infosys Springboard', 'Infosys Spring Board',
      'Infosys Springboard Certification', 'Infosys Springboard Course'],
    color: '#06b6d4',
  },
  {
    name: 'HackerRank / Coding',
    variants: [
      'HackerRank', 'HackerRank Contest', 'HackerRank Questions',
      'HackerRank & LeetCode', 'Created HackerRank Contest',
      'Practical Programming in HackerRank',
      'Practical oriented pprogramming(Problem solving in Hacker Rank',
      'Practical oriented programming(Problem solving in HackerRank',
      'Problem solving in HackerRank', 'Problem Solving in Hacker Rank',
    ],
    color: '#f97316',
  },
  {
    name: 'LeetCode',
    variants: ['LeetCode'],
    color: '#fbbf24',
  },
  {
    name: 'Simulation-Based',
    variants: ['Simulation Based Learning', 'Simulation Tool',
      'Practical Oriented Learning using Simulation Tools',
      'ICT Usage-Simulation Tool'],
    color: '#14b8a6',
  },
  {
    name: 'Practical-Oriented',
    variants: ['Practical Oriented Learning', 'Practical Learning',
      'Practical Programming', 'Prototype Design',
      'Screen Layout Design using Figma'],
    color: '#a855f7',
  },
  {
    name: 'Activity-Based Learning',
    variants: [
      'Activity Based Learning', 'Activity-based Learning', 'Activity-Based Learning',
      'Acitivity Based Learning', 'Acitivity based learning', 'Acitivity Based learning',
      'Activity Sheet', 'Activity', 'Problem-based Activity',
    ],
    color: '#ec4899',
  },
  {
    name: 'Problem-Based Learning',
    variants: ['Problem Based Learning', 'Problem-based Teaching'],
    color: '#84cc16',
  },
  {
    name: 'Flipped Classroom',
    variants: ['Flipped Classroom', 'Flipped Class'],
    color: '#22c55e',
  },
  {
    name: 'Jigsaw Activity',
    variants: ['Jigsaw', 'ZigSaw Activity', 'Zigsaw Activity',
      'Jigsaw Activity Based Learning'],
    color: '#3b82f6',
  },
  {
    name: 'Peer Learning',
    variants: ['Peer Learning'],
    color: '#fb7185',
  },
  {
    name: 'Gamification',
    variants: ['Gamifying', 'Paper Plane Game', 'Kanban Board Activity',
      'Task Boards', 'Sticky Notes Activity'],
    color: '#f43f5e',
  },
  {
    name: 'Presentation',
    variants: ['Idea Presentation', 'Project Presentation', 'Chart Models', 'Working Models'],
    color: '#64748b',
  },
  {
    name: 'Assignment',
    variants: ['Assignment', 'Real-time Assignment'],
    color: '#d97706',
  },
  {
    name: 'Design Activities',
    variants: ['UI Design Task', 'Figma Design', 'High-Fidelity Prototype Design'],
    color: '#7c3aed',
  },
  {
    name: 'Training / Certification',
    variants: ['MATLAB Certification', 'HCL-Guvi Industrial Training',
      'Industrial Training & Project'],
    color: '#0891b2',
  },
  {
    name: 'Field Visit',
    variants: ['Field Visit'],
    color: '#16a34a',
  },
  {
    name: 'Debate',
    variants: ['Debate'],
    color: '#dc2626',
  },
  {
    name: 'Scenario-Based',
    variants: ['Scenario Based Learning'],
    color: '#7e22ce',
  },
  {
    name: 'Think-Pair-Share',
    variants: ['Think-Share-Pair'],
    color: '#0284c7',
  },
  {
    name: 'Implementation Activity',
    variants: [
      'Lex Compiler Implementation', 'Implementation of Lex Compiler',
      'Lex compiler Implementation', 'Lex Compiler',
      'Bluetooth Project', 'Kongu FM/Wi-Fi Activity',
    ],
    color: '#b45309',
  },
  {
    name: 'Other / NA',
    variants: ['NA', '\u2014'],
    color: '#94a3b8',
  },
];

/**
 * Match a single token (trimmed string) against CLUSTERS.
 * Returns matched cluster names (could be multiple if the token itself contains "and/&").
 */
function matchToken(token) {
  const t = token.trim();
  if (!t) return [];

  // Exact match first
  for (const cluster of CLUSTERS) {
    if (cluster.variants.some(v => v.toLowerCase() === t.toLowerCase())) {
      return [cluster.name];
    }
  }
  // Partial / fuzzy match
  for (const cluster of CLUSTERS) {
    if (cluster.variants.some(v =>
      t.toLowerCase().includes(v.toLowerCase()) ||
      v.toLowerCase().includes(t.toLowerCase())
    )) {
      return [cluster.name];
    }
  }
  return [t]; // unknown → keep raw string as its own cluster
}

/**
 * Given a raw typeOfActivity string (which may combine multiple activities
 * separated by "&", "+" or ","), return ALL matching cluster names as an array.
 * Deduplicates so the same cluster isn't counted twice for one item.
 */
function getClustersForActivity(rawActivity) {
  if (!rawActivity) return ['Other / NA'];
  const raw = rawActivity.trim();

  // Split on " & ", " and ", " + ", ", " — but NOT within known variant names.
  // Strategy: try whole string first (exact / fuzzy), then split.
  const exactMatches = matchToken(raw);
  // If an exact/fuzzy match was found for the whole string, use it.
  // (Avoids splitting "Seminar & Peer Learning" into ["Seminar", "Peer Learning"]
  //  when it's defined as a whole variant of Seminar.)
  const knownVariantFull = CLUSTERS.some(c =>
    c.variants.some(v => v.toLowerCase() === raw.toLowerCase())
  );
  if (knownVariantFull) return exactMatches;

  // Try splitting on " & " / " + " / ", "
  const parts = raw.split(/\s*[&+,]\s*/);
  if (parts.length > 1) {
    const results = new Set();
    parts.forEach(part => {
      matchToken(part).forEach(n => results.add(n));
    });
    if (results.size > 0) return [...results];
  }

  // Fallback: use the whole-string match (fuzzy)
  return exactMatches.length ? exactMatches : [raw];
}

function getClusterColor(clusterName) {
  const found = CLUSTERS.find(c => c.name === clusterName);
  return found ? found.color : '#94a3b8';
}

/**
 * Build cluster map for a doc.
 * Each item can belong to MULTIPLE clusters.
 * cluster.rows tracks items that appear in this cluster (for the detail table).
 */
function buildClusterMap(doc) {
  const clusterMap = {};

  (doc.sections || []).forEach(section => {
    (section.items || []).forEach(item => {
      const clusterNames = getClustersForActivity(item.typeOfActivity);
      clusterNames.forEach(cName => {
        if (!clusterMap[cName]) {
          clusterMap[cName] = { count: 0, color: getClusterColor(cName), rows: [] };
        }
        clusterMap[cName].count += 1;
        clusterMap[cName].rows.push({ sectionTitle: section.sectionTitle || '', item });
      });
    });
  });

  return clusterMap;
}

// ── Sunburst / Radial Diagram ─────────────────────────────────────────────────
function SunburstDiagram({ clusters, totalCount, onClusterClick, onCenterClick }) {
  const [hovered, setHovered] = useState(null);
  const [centerHovered, setCenterHovered] = useState(false);

  // Larger size
  const size = 960;
  const cx = size / 2;
  const cy = size / 2;
  const innerR = 110;
  const outerR = 220;
  const labelR = 310;
  const lineStartR = outerR + 10;
  const lineEndR = labelR - 16;

  const total = clusters.length;
  const angleStep = (2 * Math.PI) / total;
  const startOffset = -Math.PI / 2;

  const polar = (r, angle) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const arcPath = (i) => {
    const a1 = startOffset + i * angleStep;
    const a2 = a1 + angleStep;
    const gap = 0.04;
    const a1g = a1 + gap;
    const a2g = a2 - gap;

    const p1 = polar(innerR + 2, a1g);
    const p2 = polar(outerR - 2, a1g);
    const p3 = polar(outerR - 2, a2g);
    const p4 = polar(innerR + 2, a2g);
    const largeArc = a2g - a1g > Math.PI ? 1 : 0;

    return [
      `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
      `L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
      `A ${outerR - 2} ${outerR - 2} 0 ${largeArc} 1 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
      `L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
      `A ${innerR + 2} ${innerR + 2} 0 ${largeArc} 0 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`,
    ].join(' ');
  };

  return (
    <div className="sunburst-container">
      <svg
        viewBox={`0 130 ${size} 830`}
        className="sunburst-svg"
        style={{ width: '100%', maxWidth: `${size}px`, height: 'auto', display: 'block', margin: '0 auto' }}
      >
        <defs>
          <filter id="sb-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="center-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a56db" stopOpacity="1" />
            <stop offset="100%" stopColor="#1a038c" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="center-grad-hover" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="1" />
            <stop offset="100%" stopColor="#3730a3" stopOpacity="1" />
          </radialGradient>
          <filter id="center-glow" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Decorative outer rings */}
        <circle cx={cx} cy={cy} r={outerR + 26} fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 7" />
        <circle cx={cx} cy={cy} r={outerR + 48} fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 10" />

        {/* Cluster arcs */}
        {clusters.map((cluster, i) => {
          const midAngle = startOffset + i * angleStep + angleStep / 2;
          const midPoint = polar((innerR + outerR) / 2, midAngle);
          const lineStart = polar(lineStartR, midAngle);
          const lineEnd = polar(lineEndR, midAngle);
          const labelPos = polar(labelR + 10, midAngle);

          const isRight = Math.cos(midAngle) >= 0;
          const textAnchor = isRight ? 'start' : 'end';
          const labelShiftX = isRight ? 8 : -8;

          const isHov = hovered === cluster.name;
          const col = cluster.color;

          // Split label into max 2 lines
          const words = cluster.name.split(/[\s\/\-]+/);
          const midWord = Math.ceil(words.length / 2);
          const line1 = words.slice(0, midWord).join(' ');
          const line2 = words.length > 1 ? words.slice(midWord).join(' ') : null;

          return (
            <g
              key={cluster.name}
              style={{ cursor: 'pointer' }}
              onClick={() => onClusterClick(cluster)}
              onMouseEnter={() => setHovered(cluster.name)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Arc segment */}
              <path
                d={arcPath(i)}
                fill={col}
                opacity={isHov ? 1 : hovered ? 0.42 : 0.84}
                filter={isHov ? 'url(#sb-glow)' : undefined}
                transform={isHov
                  ? `translate(${(Math.cos(midAngle) * 9).toFixed(2)}, ${(Math.sin(midAngle) * 9).toFixed(2)})`
                  : undefined}
                style={{ transition: 'opacity 0.2s, transform 0.18s' }}
              />

              {/* Count badge inside arc */}
              <circle
                cx={midPoint.x} cy={midPoint.y} r="17"
                fill={isHov ? '#fff' : 'rgba(0,0,0,0.20)'}
                style={{ transition: 'fill 0.2s' }}
              />
              <text
                x={midPoint.x} y={midPoint.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize="13" fontWeight="800"
                fill={isHov ? col : '#fff'}
                style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.2s' }}
              >
                {cluster.count}
              </text>

              {/* Dashed connector line */}
              <line
                x1={lineStart.x.toFixed(2)} y1={lineStart.y.toFixed(2)}
                x2={lineEnd.x.toFixed(2)} y2={lineEnd.y.toFixed(2)}
                stroke={col}
                strokeWidth={isHov ? 2.5 : 1.2}
                strokeDasharray="5 4"
                opacity={isHov ? 1 : hovered ? 0.18 : 0.65}
                style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
              />

              {/* Label — line 1 */}
              <text
                x={labelPos.x + labelShiftX}
                y={labelPos.y - (line2 ? 9 : 0)}
                textAnchor={textAnchor}
                fontSize="14"
                fontWeight={isHov ? '700' : '600'}
                fill={isHov ? col : hovered ? '#94a3b8' : '#1e293b'}
                style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.2s' }}
              >
                {line1}
              </text>
              {/* Label — line 2 */}
              {line2 && (
                <text
                  x={labelPos.x + labelShiftX}
                  y={labelPos.y + 10}
                  textAnchor={textAnchor}
                  fontSize="14"
                  fontWeight={isHov ? '700' : '600'}
                  fill={isHov ? col : hovered ? '#94a3b8' : '#1e293b'}
                  style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.2s' }}
                >
                  {line2}
                </text>
              )}
            </g>
          );
        })}

        {/* Center circle — clickable to show all records */}
        <g
          style={{ cursor: 'pointer' }}
          onClick={onCenterClick}
          onMouseEnter={() => setCenterHovered(true)}
          onMouseLeave={() => setCenterHovered(false)}
        >
          <circle
            cx={cx} cy={cy} r={innerR - 6}
            fill={centerHovered ? 'url(#center-grad-hover)' : 'url(#center-grad)'}
            filter="url(#center-glow)"
            style={{ transition: 'filter 0.2s' }}
          />
          {/* Ring hint on hover */}
          {centerHovered && (
            <circle
              cx={cx} cy={cy} r={innerR - 4}
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              opacity="0.4"
            />
          )}
          <text x={cx} y={cy - 26} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff" style={{ userSelect: 'none' }}>
            Innovative
          </text>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff" style={{ userSelect: 'none' }}>
            Teaching
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="13" fontWeight="600" fill="#bfdbfe" style={{ userSelect: 'none' }}>
            {totalCount} total
          </text>
          <text x={cx} y={cy + 32} textAnchor="middle" fontSize="11" fill={centerHovered ? '#fff' : '#93c5fd'} style={{ userSelect: 'none', transition: 'fill 0.2s' }}>
            {centerHovered ? 'view all' : 'click center'}
          </text>
        </g>
      </svg>
    </div>
  );
}

// ── "All records" detail table ─────────────────────────────────────────────────
function AllRecordsDetail({ doc, onBack }) {
  let allRows = [];
  (doc.sections || []).forEach(section => {
    (section.items || []).forEach(item => {
      allRows.push({ sectionTitle: section.sectionTitle || '', item });
    });
  });

  return (
    <div>
      <div
        className="detail-top-bar"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline-secondary" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>Back to Diagram
          </button>
          <h2 className="detail-top-title" style={{ margin: 0 }}>All Records</h2>
        </div>
        <span style={{
          background: '#1a56db22', color: '#1a56db',
          border: '1px solid #1a56db55',
          padding: '3px 14px', borderRadius: 20,
          fontSize: '0.85rem', fontWeight: 600,
        }}>
          {allRows.length} total entries
        </span>
      </div>

      <div className="section-meta-bar" style={{ marginBottom: '1rem' }}>
        <span className="section-meta-year">
          <i className="bi bi-calendar2 me-1"></i>{doc.yearLabel}
        </span>
        <span className={`semester-badge ${doc.semester === 'ODD' ? 'semester-odd' : 'semester-even'}`}>
          {doc.semester} Semester
        </span>
      </div>

      {allRows.length === 0 ? (
        <div className="alert alert-info">No entries found.</div>
      ) : (
        <div className="table-container section-table-wrap">
          <table className="table table-bordered table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Year / Section</th>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Type of Activity</th>
                <th>Proof</th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((row, rIdx) => {
                const actCol = getClusterColor(getClustersForActivity(row.item.typeOfActivity)[0]);
                return (
                  <tr key={rIdx}>
                    <td>{rIdx + 1}</td>
                    <td className="text-start"><strong>{row.item.name || '—'}</strong></td>
                    <td>{row.sectionTitle || '—'}</td>
                    <td>{row.item.courseCode || '—'}</td>
                    <td className="text-start">{row.item.courseName || '—'}</td>
                    <td>
                      <span style={{
                        background: actCol + '22', color: actCol,
                        padding: '2px 9px', borderRadius: 12,
                        fontSize: '0.8rem', fontWeight: 600,
                      }}>
                        {row.item.typeOfActivity || '—'}
                      </span>
                    </td>
                    <td>
                      {row.item.proofs && row.item.proofs.length > 0 ? (
                        <div className="proof-links-cell">
                          {row.item.proofs.map((p, pIdx) => (
                            <a
                              key={pIdx}
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              className="cert-link-badge proof-btn"
                              onClick={e => e.stopPropagation()}
                            >
                              {'\uD83D\uDD17'} {p.label || `View Proof ${pIdx + 1}`}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Cluster detail table ───────────────────────────────────────────────────────
function ClusterDetail({ doc, cluster, onBack }) {
  const rows = cluster.rows || [];

  return (
    <div>
      <div
        className="detail-top-bar"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline-secondary" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>Back to Diagram
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-block', width: 14, height: 14,
              borderRadius: '50%', background: cluster.color, flexShrink: 0,
            }} />
            <h2 className="detail-top-title" style={{ margin: 0 }}>{cluster.name}</h2>
          </div>
        </div>
        <span style={{
          background: cluster.color + '22', color: cluster.color,
          border: `1px solid ${cluster.color}55`,
          padding: '3px 14px', borderRadius: 20,
          fontSize: '0.85rem', fontWeight: 600,
        }}>
          {rows.length} entr{rows.length === 1 ? 'y' : 'ies'}
        </span>
      </div>

      <div className="section-meta-bar" style={{ marginBottom: '1rem' }}>
        <span className="section-meta-year">
          <i className="bi bi-calendar2 me-1"></i>{doc.yearLabel}
        </span>
        <span className={`semester-badge ${doc.semester === 'ODD' ? 'semester-odd' : 'semester-even'}`}>
          {doc.semester} Semester
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="alert alert-info">No entries found for this cluster.</div>
      ) : (
        <div className="table-container section-table-wrap">
          <table className="table table-bordered table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Year / Section</th>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Type of Activity</th>
                <th>Proof</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  <td>{rIdx + 1}</td>
                  <td className="text-start"><strong>{row.item.name || '—'}</strong></td>
                  <td>{row.sectionTitle || '—'}</td>
                  <td>{row.item.courseCode || '—'}</td>
                  <td className="text-start">{row.item.courseName || '—'}</td>
                  <td>
                    <span style={{
                      background: cluster.color + '22', color: cluster.color,
                      padding: '2px 9px', borderRadius: 12,
                      fontSize: '0.8rem', fontWeight: 600,
                    }}>
                      {row.item.typeOfActivity || '—'}
                    </span>
                  </td>
                  <td>
                    {row.item.proofs && row.item.proofs.length > 0 ? (
                      <div className="proof-links-cell">
                        {row.item.proofs.map((p, pIdx) => (
                          <a
                            key={pIdx}
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="cert-link-badge proof-btn"
                            onClick={e => e.stopPropagation()}
                          >
                            {'\uD83D\uDD17'} {p.label || `View Proof ${pIdx + 1}`}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Year Sunburst view ────────────────────────────────────────────────────────
function YearSunburstView({ doc, onBack, menuLabel }) {
  // 'cluster' = a cluster object, 'all' = all records
  const [view, setView] = useState(null); // null | { type: 'cluster', cluster } | { type: 'all' }

  const clusterMap = buildClusterMap(doc);

  const clusters = Object.entries(clusterMap)
    .map(([name, v]) => ({ name, count: v.count, color: v.color, rows: v.rows }))
    .sort((a, b) => b.count - a.count);

  const totalCount = (doc.sections || []).reduce(
    (sum, s) => sum + (s.items || []).length, 0
  );

  if (view?.type === 'cluster') {
    return (
      <ClusterDetail
        doc={doc}
        cluster={view.cluster}
        onBack={() => setView(null)}
        menuLabel={menuLabel}
      />
    );
  }

  if (view?.type === 'all') {
    return (
      <AllRecordsDetail
        doc={doc}
        onBack={() => setView(null)}
      />
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div
        className="detail-top-bar"
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}
      >
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>Back to {menuLabel}
        </button>
        <h2 className="detail-top-title" style={{ margin: 0 }}>
          {doc.pageTitle || `${doc.yearLabel} — ${doc.semester} Semester`}
        </h2>
        <span className={`semester-badge ${doc.semester === 'ODD' ? 'semester-odd' : 'semester-even'}`}>
          {doc.semester} Semester
        </span>
      </div>

      {clusters.length === 0 ? (
        <div className="alert alert-info">No activity entries found for this period.</div>
      ) : (
        <>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
            <i className="bi bi-hand-index-thumb me-1"></i>
            Click a cluster arc or legend pill to filter — click the centre circle for all records
          </p>

          {/* Sunburst — diagram first */}
          <SunburstDiagram
            clusters={clusters}
            totalCount={totalCount}
            onClusterClick={(cl) => setView({ type: 'cluster', cluster: cl })}
            onCenterClick={() => setView({ type: 'all' })}
          />

          {/* Legend pills — below diagram */}
          <div className="inno-legend">
            {clusters.map(cl => (
              <button
                key={cl.name}
                className="inno-legend-pill"
                style={{ '--pill-color': cl.color }}
                onClick={() => setView({ type: 'cluster', cluster: cl })}
                title={`${cl.count} entries`}
              >
                <span className="inno-legend-dot" style={{ background: cl.color }} />
                {cl.name}
                <span className="inno-legend-count">{cl.count}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main InnovativeTeachingView ────────────────────────────────────────────────
function InnovativeTeachingView({ menuLabel = 'Innovative Teaching Activity' }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const query = `*[_type == "innovativeTeaching"] | order(yearLabel desc, semester asc) {
        _id,
        yearLabel,
        semester,
        pageTitle,
        sections[] {
          sectionTitle,
          items[] {
            name,
            courseCode,
            courseName,
            typeOfActivity,
            proofs[] { label, url }
          }
        }
      }`;
      const data = await client.fetch(query);
      setDocs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="cse-loader-container"><div className="cse-loader-text">CSE</div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  if (selectedDoc) {
    return (
      <YearSunburstView
        doc={selectedDoc}
        onBack={() => setSelectedDoc(null)}
        menuLabel={menuLabel}
      />
    );
  }

  return (
    <div>
      {docs.length === 0 ? (
        <div className="alert alert-info">
          No records found. Please add entries via the Sanity Studio.
        </div>
      ) : (
        <div className="row g-3">
          {docs.map(doc => (
            <div key={doc._id} className="col-md-6 col-lg-4">
              <div
                className="card year-card inno-year-card"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-calendar me-1"></i>
                    <h5 className="card-title mb-0">{doc.yearLabel}</h5>
                    <span className={`semester-badge ${doc.semester === 'ODD' ? 'semester-odd' : 'semester-even'}`}>
                      {doc.semester}
                    </span>
                  </div>
                  {doc.pageTitle && (
                    <p className="card-text small text-secondary mb-2">{doc.pageTitle}</p>
                  )}
                  <button className="btn btn-primary btn-sm w-100 mt-1" style={{ pointerEvents: 'none' }}>
                    <i className="bi bi-diagram-3 me-1"></i>View Activity Map
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InnovativeTeachingView;
