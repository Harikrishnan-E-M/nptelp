import React from 'react';

// ── Data ──────────────────────────────────────────────────────────────────────

const CO_CURRICULAR_ITEMS = [
  {
    sNo: 1,
    activity: 'Project Based Learning',
    icon: 'bi-lightbulb',
    color: '#6366f1',
    description: 'Students learn by actively engaging in real-world and personally meaningful projects.',
    driveLink: 'https://drive.google.com/drive/folders/1BVu4WLntpWEZa33jsEq1Zu7_7aSfmsJg',
  },
  {
    sNo: 2,
    activity: 'Problem Based Learning',
    icon: 'bi-puzzle',
    color: '#0ea5e9',
    description: 'An educational method where students learn through structured problem solving.',
    driveLink: 'https://drive.google.com/drive/folders/1xThdelslPgpYUbM-RX01oylvCszF_u4l',
  },
  {
    sNo: 3,
    activity: 'Mini Project',
    icon: 'bi-kanban',
    color: '#10b981',
    description: 'Focused short-duration projects that demonstrate specific engineering concepts.',
    driveLink: 'https://drive.google.com/drive/folders/1h3kC0t2M36iZbMO0dKxc-iXfl2vMYhLW',
  },
  {
    sNo: 4,
    activity: 'Integrated Design Projects',
    icon: 'bi-layers',
    color: '#f59e0b',
    description: 'Cross-disciplinary projects integrating multiple engineering domains into a unified design.',
    driveLink: 'https://drive.google.com/drive/folders/1KcBQ7W0XqgfZgEOWR4OyqhhqcEbOUad-',
  },
  {
    sNo: 5,
    activity: 'Capstone Projects',
    icon: 'bi-mortarboard',
    color: '#ef4444',
    description: "Final-year culminating projects showcasing students' comprehensive engineering skills.",
    driveLink: 'https://drive.google.com/drive/folders/16OLbD5F0ughUBVMKZLL5piFhV5MDdsY-',
  },
  {
    sNo: 6,
    activity: 'Activities (Case Study, Seminar)',
    icon: 'bi-journal-text',
    color: '#8b5cf6',
    description: 'Structured co-curricular activities including case study analyses and seminar presentations.',
    driveLink: 'https://drive.google.com/drive/folders/1txTbvlkKYBE6XbgAviOohGS8bikrEiXQ',
  },
];

const EXTRA_CURRICULAR_ITEMS = [
  {
    sNo: 1,
    activity: 'Hackathons',
    icon: 'bi-code-slash',
    color: '#f97316',
    description: 'Competitive programming and innovation events fostering creative problem-solving under time constraints.',
    driveLink: 'https://drive.google.com/drive/folders/1dIdsDeosGXlWdxZ9WtQ8I0fSFlhrBPKd',
  },
  {
    sNo: 2,
    activity: 'Coding Contests',
    icon: 'bi-trophy',
    color: '#eab308',
    description: 'Competitive coding challenges to sharpen algorithmic thinking and programming proficiency.',
    driveLink: 'https://drive.google.com/drive/folders/1Zc3pD1cru03o3d8lJ-28akA0iIAlVX9k',
  },
  {
    sNo: 3,
    activity: 'Technical Workshops',
    icon: 'bi-tools',
    color: '#14b8a6',
    description: 'Hands-on workshops covering emerging technologies, tools, and industry-relevant skills.',
    driveLink: 'https://drive.google.com/drive/folders/1gVobHCtRRW9BZo4DaIUiEkzTRNmbrhVy',
  },
  {
    sNo: 4,
    activity: 'Industry Internships',
    icon: 'bi-building',
    color: '#3b82f6',
    description: 'Real-world industry exposure through structured internship programs with corporate partners.',
    driveLink: 'https://drive.google.com/drive/folders/1hNRseoYBsbH5YWfnTcnHjp6VDFN4wlV_',
  },
];

// ── Sub-component: Activity Table ─────────────────────────────────────────────

function ActivityTable({ items }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table table-bordered table-hover align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th style={{ width: 60 }}>S.No</th>
            <th className="text-start" style={{ minWidth: 220 }}>Activity</th>
            <th className="text-start">Description</th>
            <th style={{ width: 160 }}>Evidence</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.sNo}>
              <td>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: item.color + '22',
                    color: item.color,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  {item.sNo}
                </span>
              </td>
              <td className="text-start">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: item.color + '18',
                      color: item.color,
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    <i className={`bi ${item.icon}`} />
                  </span>
                  <strong style={{ color: '#1e293b', fontSize: '0.88rem' }}>
                    {item.activity}
                  </strong>
                </div>
              </td>
              <td className="text-start">
                <span style={{ color: '#475569', fontSize: '0.84rem', lineHeight: 1.5 }}>
                  {item.description}
                </span>
              </td>
              <td>
                <a
                  href={item.driveLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '5px 12px',
                    borderRadius: 20,
                    background: item.color + '18',
                    color: item.color,
                    border: `1px solid ${item.color}44`,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    transition: 'all 0.18s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = item.color;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = item.color + '18';
                    e.currentTarget.style.color = item.color;
                  }}
                >
                  <i className="bi bi-folder2-open" />
                  View Folder
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Sub-component: Card Grid ──────────────────────────────────────────────────

function ActivityCardGrid({ items, columns = 3 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '1rem',
        padding: '0.5rem 0',
      }}
    >
      {items.map((item) => (
        <a
          key={item.sNo}
          href={item.driveLink}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '1.1rem 1.1rem 1rem',
            borderRadius: 12,
            border: `1px solid ${item.color}33`,
            background: '#fff',
            textDecoration: 'none',
            boxShadow: `0 2px 8px ${item.color}12`,
            transition: 'transform 0.18s, box-shadow 0.18s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 8px 20px ${item.color}28`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 2px 8px ${item.color}12`;
          }}
        >
          {/* Title */}
          <strong style={{ color: '#1e293b', fontSize: '0.92rem', lineHeight: 1.4 }}>
            {item.activity}
          </strong>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              color: item.color,
              fontWeight: 600,
              paddingTop: '0.6rem',
              borderTop: `1px solid ${item.color}22`,
            }}
          >
            <i className="bi bi-folder2-open" />
            Open Drive Folder
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Section Panel ─────────────────────────────────────────────────────────────

function SectionPanel({ title, subtitle, icon, accentColor, gradientFrom, gradientTo, items, columns }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${accentColor}33`,
        overflow: 'hidden',
        boxShadow: `0 4px 16px ${accentColor}14`,
        background: '#fff',
        marginBottom: '0.5rem',
      }}
    >
      {/* Coloured header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.18)',
            color: '#fff',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}
        >
          <i className={`bi ${icon}`} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontWeight: 800, fontSize: '1rem', lineHeight: 1.3, textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}>
            {title}
          </h3>
          <p style={{ margin: '0.25rem 0 0', color: '#fde68a', fontSize: '0.82rem', fontWeight: 500 }}>
            {subtitle}
          </p>
        </div>

        <span
          style={{
            background: 'rgba(255,255,255,0.22)',
            color: '#fff',
            padding: '4px 14px',
            borderRadius: 20,
            fontWeight: 700,
            fontSize: '0.82rem',
            flexShrink: 0,
          }}
        >
          {items.length} activit{items.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Body — cards only */}
      <div style={{ padding: '1.25rem 1.25rem 1rem' }}>
        <ActivityCardGrid items={items} columns={columns} />
      </div>
    </div>
  );
}




// ── Main Component ─────────────────────────────────────────────────────────────

function ComplexEngineeringActivities({ view }) {
  if (view === 'co-curricular') {
    return (
      <SectionPanel
        title="Complex Engineering Activities — Co-Curricular with SDG Mapping"
        subtitle="Curriculum-embedded engineering activities aligned with Sustainable Development Goals"
        icon="bi-book-half"
        accentColor="#6366f1"
        gradientFrom="#4f46e5"
        gradientTo="#7c3aed"
        items={CO_CURRICULAR_ITEMS}
      />
    );
  }

  if (view === 'extra-curricular') {
    return (
      <SectionPanel
        title="Complex Engineering Activities — Extra-Curricular Programs"
        subtitle="Industry-oriented programs promoting professional and technical development"
        icon="bi-trophy"
        accentColor="#f97316"
        gradientFrom="#ea580c"
        gradientTo="#d97706"
        items={EXTRA_CURRICULAR_ITEMS}
        columns={2}
      />
    );
  }

  return null;
}

export default ComplexEngineeringActivities;

