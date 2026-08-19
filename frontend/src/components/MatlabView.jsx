import React from 'react';

// ── Static Matlab certification data ──────────────────────────────────────────
// Structure: academicYear → semesters → courses
// rowspan values are pre-computed:
//   yearSpan  = total rows across all semesters in the year
//   semSpan   = number of courses in that semester
const MATLAB_DATA = [
  {
    academicYear: '2025-2026',
    yearSpan: 5,
    driveLinks: [
      {
        label: 'Drive Link 1',
        url: 'https://drive.google.com/drive/folders/18u9yaRZMOag7i9p1gxV2BXIsKA1PzkRd',
      },
      {
        label: 'Drive Link 2',
        url: 'https://drive.google.com/drive/folders/1xgh4VdDhLKhklm5YLEl4W7uSy-UovR3q?usp=drive_link',
      },
    ],
    totalCertifications: 1078,
    semesters: [
      {
        name: 'III-CSE',
        certifications: 1030,
        semSpan: 1,
        courses: [
          { name: 'Regression methods with machine learning', be: 258, me: 12, cert: 270 },
        ],
      },
      {
        name: 'I-ME',
        certifications: 48,
        semSpan: 4,
        courses: [
          { name: 'Dimensionality reduction techniques',         be: 0,   me: 12, cert: 12  },
          { name: 'Cluster analysis with machine learning',      be: 260, me: 12, cert: 272 },
          { name: 'Classification methods with machine learning',be: 265, me: 0,  cert: 256 },
          { name: 'Machine Learning Techniques in MATLAB',       be: 256, me: 12, cert: 268 },
        ],
      },
    ],
  },
  {
    academicYear: '2023-2024',
    yearSpan: 4,
    driveLinks: [
      {
        label: 'Drive Link',
        url: 'https://drive.google.com/drive/folders/1U9yWLf-fhHX-DGHjZK-nxPfwkLZ5HYp5',
      },
    ],
    totalCertifications: 49,
    semesters: [
      {
        name: 'III CSE',
        certifications: 49,
        semSpan: 4,
        courses: [
          { name: 'MATLAB Onramp',                be: 16, me: null, cert: 16 },
          { name: 'MATLAB Fundamentals',           be: 12, me: null, cert: 12 },
          { name: 'Image Processing with MATLAB',  be: 8,  me: null, cert: 8  },
          { name: 'Image Processing Onramp',       be: 13, me: null, cert: 13 },
        ],
      },
    ],
  },
  {
    academicYear: '2024-2025 ODD',
    yearSpan: 5,
    driveLinks: [
      {
        label: 'Drive Link',
        url: 'https://drive.google.com/drive/folders/1EkdhytVf9Ww345Ex9HCpVBuLI185WmBH',
      },
    ],
    totalCertifications: 136,
    semesters: [
      {
        name: 'II CSE',
        certifications: 136,
        semSpan: 5,
        courses: [
          { name: 'Signal Processing Onramp',       be: 30, me: null, cert: 30 },
          { name: 'MATLAB Onramp',                  be: 28, me: null, cert: 28 },
          { name: 'MATLAB Fundamentals',             be: 22, me: null, cert: 22 },
          { name: 'Image Processing with MATLAB',    be: 25, me: null, cert: 25 },
          { name: 'Image Processing Onramp',         be: 31, me: null, cert: 31 },
        ],
      },
    ],
  },
  {
    academicYear: '2024-2025 EVEN',
    yearSpan: 2,
    driveLinks: [
      {
        label: 'Drive Link',
        url: 'https://drive.google.com/drive/folders/1oW3xseMCFp18Lvjx7OY6NBPEACRLo8L0',
      },
    ],
    totalCertifications: 29,
    semesters: [
      {
        name: 'II-CSE',
        certifications: 29,
        semSpan: 2,
        courses: [
          { name: 'MATLAB Onramp',                be: 15, me: null, cert: 15 },
          { name: 'Image Processing with MATLAB', be: 14, me: null, cert: 15 },
        ],
      },
    ],
  },
];

const BRAND = '#c2400c';          // MATLAB orange
const BRAND_DARK  = '#9a3109';
const BRAND_LIGHT = '#fff3ed';
const BRAND_MID   = '#f97316';

// ── Link badge ────────────────────────────────────────────────────────────────
function DriveLinkBadge({ url, label, index }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '3px 10px',
        borderRadius: 8,
        background: BRAND_LIGHT,
        color: BRAND,
        fontSize: '0.74rem',
        fontWeight: 700,
        textDecoration: 'none',
        border: `1px solid ${BRAND}33`,
        marginBottom: index < 99 ? '0.35rem' : 0,
        whiteSpace: 'nowrap',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#fde4d4'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = BRAND_LIGHT; }}
    >
      <i className="bi bi-folder2-open" />
      {label}
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function MatlabView() {
  // Build flat rows with rowspan info for table rendering
  const tableRows = [];

  MATLAB_DATA.forEach((yearGroup) => {
    let yearFirstRow = true;

    yearGroup.semesters.forEach((sem) => {
      let semFirstRow = true;

      sem.courses.forEach((course) => {
        tableRows.push({
          // Year-level cells (shown only on first row of year group)
          showYear: yearFirstRow && semFirstRow,
          academicYear: yearGroup.academicYear,
          yearSpan: yearGroup.yearSpan,
          totalCertifications: yearGroup.totalCertifications,
          driveLinks: yearGroup.driveLinks,

          // Semester-level cells (shown only on first row of semester)
          showSem: semFirstRow,
          semName: sem.name,
          semCertifications: sem.certifications,
          semSpan: sem.semSpan,

          // Course-level cells (every row)
          courseName: course.name,
          be: course.be,
          me: course.me,
          cert: course.cert,
        });

        semFirstRow = false;
        yearFirstRow = false;
      });
    });
  });

  const headerCell = {
    background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND})`,
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.8rem',
    padding: '0.6rem 0.75rem',
    textAlign: 'center',
    verticalAlign: 'middle',
    border: '1px solid rgba(255,255,255,0.15)',
    whiteSpace: 'nowrap',
  };

  const bodyCell = {
    padding: '0.55rem 0.75rem',
    fontSize: '0.82rem',
    verticalAlign: 'middle',
    border: '1px solid #e2e8f0',
    color: '#1e293b',
  };

  const numCell = {
    ...bodyCell,
    textAlign: 'center',
    fontWeight: 700,
    color: BRAND,
  };

  const yearCell = {
    ...bodyCell,
    fontWeight: 700,
    color: BRAND_DARK,
    background: '#fff7f3',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  };

  const semCell = {
    ...bodyCell,
    fontWeight: 600,
    textAlign: 'center',
    background: '#fef9f7',
    whiteSpace: 'nowrap',
  };

  const totalCount = MATLAB_DATA.reduce((s, y) => s + y.totalCertifications, 0);

  return (
    <div>
      {/* ── Summary banner ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND})`,
          borderRadius: 14,
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          color: '#fff',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 48, height: 48,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0,
          }}
        >
          <i className="bi bi-cpu-fill" />
        </div>
        <div>
          <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>
            MATLAB Certification
          </h5>
          <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.88 }}>
            {MATLAB_DATA.length} academic year{MATLAB_DATA.length !== 1 ? 's' : ''} ·{' '}
            {totalCount} total certifications
          </p>
        </div>
        {/* Quick stat pills */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {MATLAB_DATA.map((y) => (
            <span
              key={y.academicYear}
              style={{
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: '0.74rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {y.academicYear} — {y.totalCertifications}
            </span>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          overflowX: 'auto',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          border: '1px solid #e2e8f0',
        }}
      >
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 820 }}>
          <thead>
            <tr>
              <th style={{ ...headerCell, minWidth: 100 }}>Academic Year</th>
              <th style={{ ...headerCell, minWidth: 80 }}>Year</th>
              <th style={{ ...headerCell, minWidth: 80 }}>Certifications</th>
              <th style={{ ...headerCell, minWidth: 70 }}>Total</th>
              <th style={{ ...headerCell, minWidth: 220, textAlign: 'left' }}>Certifications (Course)</th>
              <th style={{ ...headerCell, minWidth: 70 }}>B.E Count</th>
              <th style={{ ...headerCell, minWidth: 70 }}>M.E Count</th>
              <th style={{ ...headerCell, minWidth: 100 }}>
                Certification Count<br />
                <span style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.85 }}>(Course Wise)</span>
              </th>
              <th style={{ ...headerCell, minWidth: 160, textAlign: 'left' }}>Drive Link</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, idx) => (
              <tr
                key={idx}
                style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fff7f3'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa'; }}
              >
                {/* Academic Year — rowSpan across all rows of this year */}
                {row.showYear && (
                  <td rowSpan={row.yearSpan} style={yearCell}>
                    {row.academicYear}
                  </td>
                )}

                {/* Semester name — rowSpan across its courses */}
                {row.showSem && (
                  <td rowSpan={row.semSpan} style={semCell}>
                    {row.semName}
                  </td>
                )}

                {/* Certifications count — rowSpan with semester */}
                {row.showSem && (
                  <td rowSpan={row.semSpan} style={{ ...numCell, background: '#fef9f7' }}>
                    {row.semCertifications}
                  </td>
                )}

                {/* Total — rowSpan across all rows of this year */}
                {row.showYear && (
                  <td rowSpan={row.yearSpan} style={{ ...numCell, background: '#fff3ed', fontWeight: 800, fontSize: '0.9rem' }}>
                    {row.totalCertifications}
                  </td>
                )}

                {/* Course name */}
                <td style={{ ...bodyCell, textAlign: 'left' }}>
                  {row.courseName}
                </td>

                {/* B.E Count */}
                <td style={{ ...numCell, color: '#1a73e8' }}>
                  {row.be != null ? row.be : '—'}
                </td>

                {/* M.E Count */}
                <td style={{ ...numCell, color: '#059669' }}>
                  {row.me != null ? row.me : '—'}
                </td>

                {/* Certification Count (Course Wise) */}
                <td style={{ ...numCell, fontWeight: 800, color: BRAND }}>
                  {row.cert}
                </td>

                {/* Drive Link — rowSpan across year */}
                {row.showYear && (
                  <td
                    rowSpan={row.yearSpan}
                    style={{
                      ...bodyCell,
                      textAlign: 'left',
                      verticalAlign: 'top',
                      paddingTop: '0.75rem',
                      background: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {row.driveLinks.map((link, li) => (
                        <DriveLinkBadge key={li} url={link.url} label={link.label} index={li} />
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer note ─────────────────────────────────────────────────────── */}
      <p
        style={{
          marginTop: '0.75rem',
          fontSize: '0.75rem',
          color: '#94a3b8',
          textAlign: 'right',
        }}
      >
        <i className="bi bi-info-circle me-1" />
        B.E = Bachelor of Engineering · M.E = Master of Engineering
      </p>
    </div>
  );
}

export default MatlabView;
