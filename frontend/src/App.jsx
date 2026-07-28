import React, { useState } from 'react';
import YearsList from './components/YearsList';
import Statistics from './components/Statistics';
import SemesterYearList from './components/SemesterYearList';
import SectionDetail from './components/SectionDetail';
import FacultyCertYearList from './components/FacultyCertYearList';
import FacultyCertDetail from './components/FacultyCertDetail';
import CaseStudyDetail from './components/CaseStudyDetail';
import './App.css';

// ── Menu structure ────────────────────────────────────────────────────────────
const MENU_STRUCTURE = [
  {
    id: '2.1', label: '2.1', children: [
      { id: 'ict',        label: 'ICT Tools' },
      { id: 'innovative', label: 'Innovative Teaching' },
    ],
  },
  { id: '2.2', label: '2.2', children: [] },
  { id: '2.3', label: '2.3', children: [] },
  {
    id: '2.4', label: '2.4', children: [
      { id: 'case-study', label: 'Case Study' },
    ],
  },
  { id: '2.5', label: '2.5', children: [] },
  {
    id: '2.6', label: '2.6', children: [
      {
        id: 'nptel', label: 'NPTEL', children: [
          { id: 'student-nptel', label: 'Student NPTEL' },
          { id: 'faculty-cert',  label: 'Faculty Certification' },
        ],
      },
      { id: 'non-formal', label: 'Non Formal' },
    ],
  },
  { id: '2.7', label: '2.7', children: [] },
  { id: '2.8', label: '2.8', children: [] },
];

// ── View labels ───────────────────────────────────────────────────────────────
const VIEW_LABELS = {
  'ict':           'ICT Tools',
  'innovative':    'Innovative Teaching Activity',
  'case-study':    'Case Study',
  'student-nptel': 'Student NPTEL',
  'faculty-cert':  'Faculty Certification',
  'non-formal':    'Non Formal Education',
};

// ── Recursive sidebar menu item ───────────────────────────────────────────────
function SidebarItem({ item, activeView, openGroups, toggleGroup, onSelect, depth = 0 }) {
  const hasChildren = item.children && item.children.length > 0;
  const isOpen = openGroups.has(item.id);

  const isDescendantActive = (children) => {
    if (!children) return false;
    return children.some(c => c.id === activeView || isDescendantActive(c.children));
  };

  const isGroupActive = isDescendantActive(item.children);
  const isLeafActive  = item.id === activeView;

  if (!hasChildren) {
    // Leaf node
    return (
      <button
        className={`sidebar-leaf ${isLeafActive ? 'sidebar-leaf-active' : ''}`}
        style={{ paddingLeft: `${1.1 + depth * 0.85}rem` }}
        onClick={() => onSelect(item.id)}
      >
        <span className="sidebar-leaf-dot" />
        {item.label}
      </button>
    );
  }

  // Group node
  return (
    <div className="sidebar-group">
      <button
        className={`sidebar-group-btn ${isGroupActive || isOpen ? 'sidebar-group-btn-open' : ''}`}
        style={{ paddingLeft: `${1.1 + depth * 0.85}rem` }}
        onClick={() => toggleGroup(item.id)}
      >
        <span className="sidebar-chevron">{isOpen ? '▾' : '▸'}</span>
        {item.label}
        {/* Gray pill when no children content yet */}
        {item.children.length === 0 && (
          <span className="sidebar-soon-pill">soon</span>
        )}
      </button>

      {isOpen && item.children.length > 0 && (
        <div className="sidebar-children">
          {item.children.map(child => (
            <SidebarItem
              key={child.id}
              item={child}
              activeView={activeView}
              openGroups={openGroups}
              toggleGroup={toggleGroup}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [activeView, setActiveView] = useState(null);
  // Set of group IDs that are expanded
  const [openGroups, setOpenGroups] = useState(new Set());

  // ── Student NPTEL state ───────────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState(null);
  const [showStats,    setShowStats]    = useState(false);

  // ── ICT Tools state ───────────────────────────────────────────────────────
  const [selectedIctDoc, setSelectedIctDoc] = useState(null);

  // ── Innovative Teaching state ─────────────────────────────────────────────
  const [selectedInnoDoc, setSelectedInnoDoc] = useState(null);

  // ── Faculty Certification state ───────────────────────────────────────────
  const [selectedFacultyYear, setSelectedFacultyYear] = useState(null);

  const toggleGroup = (id) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const switchView = (viewId) => {
    setActiveView(viewId);
    // Reset all sub-navigations
    setShowStats(false);    setSelectedYear(null);
    setSelectedIctDoc(null);
    setSelectedInnoDoc(null);
    setSelectedFacultyYear(null);
  };

  const currentLabel = activeView ? VIEW_LABELS[activeView] : null;

  return (
    <div className="app-wrapper">
      {/* ── Site Header ─────────────────────────────────────────────────── */}
      <header className="site-header">
        <div className="site-header-inner">
          <a href="https://kongu.ac.in" target="_blank" rel="noreferrer" className="header-logo-link">
            <img
              src="https://kongu.ac.in/static/media/kec11.8c78d444060b4f77a60d.webp"
              alt="Kongu Engineering College"
              className="header-logo"
            />
          </a>
          <div className="header-title-block">
            <h1 className="header-title">COMPUTER SCIENCE AND ENGINEERING</h1>
          </div>
        </div>
      </header>

      {/* ── Main layout: sidebar + content ──────────────────────────────── */}
      <div className="main-layout">

        {/* ── Left Sidebar ─────────────────────────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-inner">
            <p className="sidebar-section-label">MENU</p>
            <nav className="sidebar-nav">
              {MENU_STRUCTURE.map(item => (
                item.children.length === 0 ? (
                  /* Disabled placeholder */
                  <button key={item.id} className="sidebar-group-btn sidebar-group-btn-disabled" disabled>
                    <span className="sidebar-chevron" style={{ opacity: 0.3 }}>▸</span>
                    {item.label}
                    <span className="sidebar-soon-pill">soon</span>
                  </button>
                ) : (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    activeView={activeView}
                    openGroups={openGroups}
                    toggleGroup={toggleGroup}
                    onSelect={switchView}
                    depth={0}
                  />
                )
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Content Area ─────────────────────────────────────────────── */}
        <main className="content-area">

          {/* Section heading at top-centre */}
          {currentLabel && (
            <div className="content-heading-bar">
              <h2 className="content-heading">{currentLabel}</h2>
              <div className="content-heading-underline" />
            </div>
          )}

          {/* No view selected */}
          {!activeView && (
            <div className="welcome-banner">
              <p className="welcome-text">Select a menu item on the left to get started.</p>
            </div>
          )}

          {/* ─── ICT Tools ─── */}
          {activeView === 'ict' && (
            <>
              {!selectedIctDoc ? (
                <SemesterYearList docType="ictTools" onSelect={setSelectedIctDoc} />
              ) : (
                <SectionDetail
                  docId={selectedIctDoc._id}
                  docType="ictTools"
                  onBack={() => setSelectedIctDoc(null)}
                  menuLabel="ICT Tools"
                />
              )}
            </>
          )}

          {/* ─── Innovative Teaching ─── */}
          {activeView === 'innovative' && (
            <>
              {!selectedInnoDoc ? (
                <SemesterYearList docType="innovativeTeaching" onSelect={setSelectedInnoDoc} />
              ) : (
                <SectionDetail
                  docId={selectedInnoDoc._id}
                  docType="innovativeTeaching"
                  onBack={() => setSelectedInnoDoc(null)}
                  menuLabel="Innovative Teaching Activity"
                />
              )}
            </>
          )}

          {/* ─── Student NPTEL ─── */}
          {activeView === 'student-nptel' && (
            <>
              {!showStats ? (
                <YearsList onYearSelect={(y) => { setSelectedYear(y); setShowStats(true); }} />
              ) : (
                <Statistics
                  year={selectedYear}
                  onBack={() => { setShowStats(false); setSelectedYear(null); }}
                />
              )}
            </>
          )}

          {/* ─── Faculty Certification ─── */}
          {activeView === 'faculty-cert' && (
            <>
              {!selectedFacultyYear ? (
                <FacultyCertYearList onSelect={setSelectedFacultyYear} />
              ) : (
                <FacultyCertDetail
                  docId={selectedFacultyYear._id}
                  yearLabel={selectedFacultyYear.yearLabel}
                  onBack={() => setSelectedFacultyYear(null)}
                />
              )}
            </>
          )}

          {/* ─── Case Study ─── */}
          {activeView === 'case-study' && (
            <CaseStudyDetail />
          )}

          {/* ─── Non-Formal placeholder ─── */}
          {activeView === 'non-formal' && (
            <div className="coming-soon-banner">
              <span className="coming-soon-icon">🚧</span>
              <h2 className="coming-soon-title">Non Formal Education</h2>
              <p className="coming-soon-text">Content coming soon.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;
