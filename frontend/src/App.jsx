import React, { useState } from 'react';
import YearsList from './components/YearsList';
import Statistics from './components/Statistics';
import SemesterYearList from './components/SemesterYearList';
import SectionDetail from './components/SectionDetail';
import FacultyCertYearList from './components/FacultyCertYearList';
import FacultyCertDetail from './components/FacultyCertDetail';
import CaseStudyDetail from './components/CaseStudyDetail';
import SeminarDetail from './components/SeminarDetail';
import MiniProjectDetail from './components/MiniProjectDetail';
import NonFormalDetail from './components/NonFormalDetail';
import GenericYearList from './components/GenericYearList';
import JournalDetail from './components/JournalDetail';
import NbaIctDetail from './components/NbaIctDetail';
import ScopusDetail from './components/ScopusDetail';
import FreelancingInternshipDetail from './components/FreelancingInternshipDetail';
import PlacementInternshipDetail from './components/PlacementInternshipDetail';
import InnovativeTeachingView from './components/InnovativeTeachingView';
import IndustrialInvolvementDetail from './components/IndustrialInvolvementDetail';
import GuestLectureDetail from './components/GuestLectureDetail';
import StrategiesCepView from './components/StrategiesCepView';
import CoCurricularSdgDetail from './components/CoCurricularSdgDetail';
import Nba62JournalDetail from './components/Nba62JournalDetail';
import Nba62ConferenceDetail from './components/Nba62ConferenceDetail';
import Nba62BookDetail from './components/Nba62BookDetail';
import Nba623FacultyDevDetail from './components/Nba623FacultyDevDetail';
import Nba623PatentDetail from './components/Nba623PatentDetail';
import InfospringYearList from './components/InfospringYearList';
import InfospringDetail from './components/InfospringDetail';
import './App.css';

// ── Menu structure ────────────────────────────────────────────────────────────
const MENU_STRUCTURE = [
  {
    id: '2.1', label: '2.1', children: [
      { id: 'innovative', label: 'Innovative Teaching' },
    ],
  },
  {
    id: '2.2', label: '2.2', children: [
      { id: 'journal', label: 'Journal' },
      { id: 'scopus',  label: 'Scopus / Conference' },
    ],
  },
  {
    id: '2.3', label: '2.3', children: [
      { id: 'freelancing-internship', label: 'Freelancing Internship' },
      { id: 'placement-internship',   label: 'Placement Internship' },
    ],
  },
  {
    id: '2.4', label: '2.4', children: [
      { id: 'case-study', label: 'Case Study' },
      { id: 'seminar',    label: 'Seminar' },
    ],
  },
  {
    id: '2.5', label: '2.5', children: [
      { id: 'mini-project', label: 'Mini Project' },
    ],
  },
  {
    id: '2.6', label: '2.6', children: [
      {
        id: 'nptel', label: 'NPTEL', children: [
          { id: 'student-nptel', label: 'Student NPTEL Certification' },
          { id: 'faculty-cert',  label: 'Faculty NPTEL Certification' },
        ],
      },
      { id: 'non-formal', label: 'Non Formal' },
      { id: 'infosys-springboard', label: 'Infosys Springboard Certification' },
    ],
  },
  {
    id: '2.7', label: '2.7', children: [
      { id: 'cea-strategies', label: 'Strategies Employed to Solve Complex Engineering Problems' },
      { id: 'csea', label: 'Initiatives by the department achieving the Sustainable Development Goals (SDGs)', url: 'https://csea-website-d5dv.vercel.app/' },
    ],
  },
  {
    id: '2.8', label: '2.8', children: [
      { id: 'industrial-involvement', label: 'A) Industrial involvement' },
      { id: 'guest-lecture', label: 'B) Guest Lecture' },
    ],
  },
  {
    id: '6.1', label: '6.1', children: [
      {
        id: '6.1.3', label: '6.1.3', children: [
          { id: 'ict', label: 'ICT Tools' },
        ],
      },
    ],
  },
  {
    id: '6.2', label: '6.2', children: [
      {
        id: '6.2.1', label: '6.2.1', children: [
          { id: 'nba62-journal',    label: 'Journal' },
          { id: 'nba62-conference', label: 'Conference' },
          { id: 'nba62-book',       label: 'Book' },
        ],
      },
      {
        id: '6.2.3', label: '6.2.3', children: [
          { id: 'nba623-faculty-dev', label: 'Working Models & Prototypes Developed' },
          { id: 'nba623-patent',      label: 'Patent' },
        ],
      },
    ],
  },
];

// ── View labels ───────────────────────────────────────────────────────────────
const VIEW_LABELS = {
  'ict':           'ICT Tools',
  'innovative':    'Innovative Teaching Activity',
  'journal':       'Journal',
  'scopus':                    'Scopus / Conference Papers',
  'freelancing-internship':    'Freelancing Internship',
  'placement-internship':      'Placement Internship',
  'case-study':    'Case Study',
  'seminar':        'Seminar',
  'mini-project':  'Mini Project',
  'student-nptel': 'Student NPTEL Certification',
  'faculty-cert':  'Faculty NPTEL Certification',
  'non-formal':    'Non Formal Education',
  'cea-strategies': 'Strategies Employed to Solve Complex Engineering Problems',
  'industrial-involvement': 'Industrial involvement in partial delivery of regular courses',
  'guest-lecture': 'Guest Lecture',
  'nba62-journal':    '6.2 Journal Publications',
  'nba62-conference': '6.2 Conference Publications',
  'nba62-book':       '6.2 Book / Book Chapter Publications',
  'nba623-faculty-dev': '6.2.3 Faculty Developmental Activities (Working Models & Prototypes Developed)',
  'nba623-patent':      '6.2.3 Faculty Developmental Activities (Patent)',
  'infosys-springboard': 'Infosys Springboard Certification',
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
    // Leaf node — external link
    if (item.url) {
      return (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-leaf"
          style={{ paddingLeft: `${1.1 + depth * 0.85}rem`, textDecoration: 'none' }}
        >
          <span className="sidebar-leaf-dot" />
          {item.label}
        </a>
      );
    }
    // Leaf node — internal navigation
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
  // (handled internally by InnovativeTeachingView)

  // ── Faculty Certification state ───────────────────────────────────────────
  const [selectedFacultyYear, setSelectedFacultyYear] = useState(null);

  // ── Case Study state ──────────────────────────────────────────────────────
  const [selectedCaseStudyDoc, setSelectedCaseStudyDoc] = useState(null);

  // ── Mini Project state ────────────────────────────────────────────────────
  const [selectedMiniProjectDoc, setSelectedMiniProjectDoc] = useState(null);

  // ── Non Formal state ──────────────────────────────────────────────────────
  const [selectedNonFormalDoc, setSelectedNonFormalDoc] = useState(null);

  // ── Scopus state ──────────────────────────────────────────────────────────
  const [selectedScopusDoc, setSelectedScopusDoc] = useState(null);

  // ── Freelancing Internship state ───────────────────────────────────────
  const [selectedFreelancingDoc, setSelectedFreelancingDoc] = useState(null);

  // ── Placement Internship state ─────────────────────────────────────────
  const [selectedPlacementDoc, setSelectedPlacementDoc] = useState(null);

  // ── Seminar state ─────────────────────────────────────────────────────
  const [selectedSeminarDoc, setSelectedSeminarDoc] = useState(null);

  // ── 6.2 state ─────────────────────────────────────────────────
  const [selectedNba62JournalDoc, setSelectedNba62JournalDoc]       = useState(null);
  const [selectedNba62ConferenceDoc, setSelectedNba62ConferenceDoc] = useState(null);
  const [selectedNba62BookDoc, setSelectedNba62BookDoc]             = useState(null);
  // ── 6.2.3 state ──────────────────────────────
  const [selectedNba623FacultyDevDoc, setSelectedNba623FacultyDevDoc] = useState(null);

  // ── Infosys Springboard state ──────────────────────────────────
  const [selectedInfospringYear, setSelectedInfospringYear] = useState(null);

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
    setSelectedYear(null);
    setShowStats(false);
    setSelectedIctDoc(null);
    setSelectedFacultyYear(null);
    setSelectedCaseStudyDoc(null);
    setSelectedMiniProjectDoc(null);
    setSelectedNonFormalDoc(null);
    setSelectedScopusDoc(null);
    setSelectedFreelancingDoc(null);
    setSelectedPlacementDoc(null);
    setSelectedSeminarDoc(null);
    setSelectedNba62JournalDoc(null);
    setSelectedNba62ConferenceDoc(null);
    setSelectedNba62BookDoc(null);
    setSelectedNba623FacultyDevDoc(null);
    setSelectedInfospringYear(null);
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
          <div className="header-divider" />
          <div className="header-title-block">
            <h1 className="header-title">COMPUTER SCIENCE AND ENGINEERING</h1>
            <p className="header-subtitle">Kongu Engineering College · Perundurai</p>
          </div>

        </div>
      </header>

      {/* ── Main layout: sidebar + content ──────────────────────────────── */}
      <div className="main-layout">

        {/* ── Left Sidebar ─────────────────────────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-inner">
            <p className="sidebar-section-label">NAVIGATION</p>
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
              <i className="bi bi-mortarboard" style={{ fontSize: '2.5rem', color: '#1E3A8A', marginBottom: '0.75rem', display: 'block' }}></i>
              <p className="welcome-text" style={{ color: '#374151', fontWeight: 600, fontSize: '1rem', marginBottom: '0.4rem' }}>Department of Computer Science and Engineering</p>
              <p className="welcome-text">Select a section from the navigation panel to view accreditation data.</p>
            </div>
          )}

          {/* ─── ICT Tools ─── */}
          {activeView === 'ict' && (
            <NbaIctDetail />
          )}

          {/* ─── Innovative Teaching ─── */}
          {activeView === 'innovative' && (
            <InnovativeTeachingView menuLabel="Innovative Teaching Activity" />
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

          {/* ─── Journal ─── */}
          {activeView === 'journal' && (
            <JournalDetail />
          )}

          {/* ─── Scopus / Conference ─── */}
          {activeView === 'scopus' && (
            selectedScopusDoc ? (
              <ScopusDetail
                parentDocId={selectedScopusDoc._id.replace(/^drafts\./, '')}
                yearLabel={selectedScopusDoc.yearLabel}
                onBack={() => setSelectedScopusDoc(null)}
              />
            ) : (
              <GenericYearList
                docType="scopus"
                iconClass="bi-journals"
                onSelect={(doc) => setSelectedScopusDoc(doc)}
              />
            )
          )}

          {/* ─── Case Study ─── */}
          {activeView === 'case-study' && (
            selectedCaseStudyDoc ? (
              <CaseStudyDetail 
                parentDocId={selectedCaseStudyDoc._id.replace(/^drafts\./, '')}
                yearLabel={selectedCaseStudyDoc.yearLabel}
                onBack={() => setSelectedCaseStudyDoc(null)}
              />
            ) : (
              <GenericYearList 
                docType="caseStudy"
                iconClass="bi-briefcase"
                onSelect={(doc) => setSelectedCaseStudyDoc(doc)}
              />
            )
          )}

          {/* ─── Mini Project ─── */}
          {activeView === 'mini-project' && (
            selectedMiniProjectDoc ? (
              <MiniProjectDetail 
                parentDocId={selectedMiniProjectDoc._id.replace(/^drafts\./, '')}
                yearLabel={selectedMiniProjectDoc.yearLabel}
                onBack={() => setSelectedMiniProjectDoc(null)}
              />
            ) : (
              <GenericYearList 
                docType="miniProject"
                iconClass="bi-kanban"
                onSelect={(doc) => setSelectedMiniProjectDoc(doc)}
              />
            )
          )}

          {/* ─── Non-Formal ─── */}
          {activeView === 'non-formal' && (
            selectedNonFormalDoc ? (
              <NonFormalDetail 
                parentDocId={selectedNonFormalDoc._id.replace(/^drafts\./, '')}
                yearLabel={selectedNonFormalDoc.yearLabel}
                onBack={() => setSelectedNonFormalDoc(null)}
              />
            ) : (
              <GenericYearList 
                docType="nonFormal"
                iconClass="bi-award"
                onSelect={(doc) => setSelectedNonFormalDoc(doc)}
              />
            )
          )}

          {/* ─── Freelancing Internship ─── */}
          {activeView === 'freelancing-internship' && (
            selectedFreelancingDoc ? (
              <FreelancingInternshipDetail
                parentDocId={selectedFreelancingDoc._id.replace(/^drafts\./, '')}
                yearLabel={selectedFreelancingDoc.yearLabel}
                onBack={() => setSelectedFreelancingDoc(null)}
              />
            ) : (
              <GenericYearList
                docType="freelancingInternship"
                iconClass="bi-laptop"
                onSelect={(doc) => setSelectedFreelancingDoc(doc)}
              />
            )
          )}

          {/* ─── Placement Internship ─── */}
          {activeView === 'placement-internship' && (
            selectedPlacementDoc ? (
              <PlacementInternshipDetail
                parentDocId={selectedPlacementDoc._id.replace(/^drafts\./, '')}
                yearLabel={selectedPlacementDoc.yearLabel}
                onBack={() => setSelectedPlacementDoc(null)}
              />
            ) : (
              <GenericYearList
                docType="placementInternship"
                iconClass="bi-building"
                onSelect={(doc) => setSelectedPlacementDoc(doc)}
              />
            )
          )}

          {/* ─── Seminar ─── */}
          {activeView === 'seminar' && (
            selectedSeminarDoc ? (
              <SeminarDetail
                parentDocId={selectedSeminarDoc._id.replace(/^drafts\./, '')}
                yearLabel={selectedSeminarDoc.yearLabel}
                onBack={() => setSelectedSeminarDoc(null)}
              />
            ) : (
              <GenericYearList
                docType="seminar"
                iconClass="bi-mic"
                onSelect={(doc) => setSelectedSeminarDoc(doc)}
              />
            )
          )}

          {/* ─── CEA — Strategies Employed to Solve Complex Engineering Problems ─── */}
          {activeView === 'cea-strategies' && (
            <StrategiesCepView />
          )}

          {/* ─── Industrial Involvement ─── */}
          {activeView === 'industrial-involvement' && (
            <IndustrialInvolvementDetail />
          )}

          {/* ─── Guest Lecture ─── */}
          {activeView === 'guest-lecture' && (
            <GuestLectureDetail />
          )}

          {/* ─── 6.2 Journal ─── */}
          {activeView === 'nba62-journal' && (
            selectedNba62JournalDoc ? (
              <Nba62JournalDetail
                parentDocId={selectedNba62JournalDoc._id.replace(/^drafts\./, '')}
                yearLabel={selectedNba62JournalDoc.yearLabel}
                onBack={() => setSelectedNba62JournalDoc(null)}
              />
            ) : (
              <GenericYearList
                docType="nba62Journal"
                iconClass="bi-journal-text"
                onSelect={(doc) => setSelectedNba62JournalDoc(doc)}
              />
            )
          )}

          {/* ─── 6.2 Conference ─── */}
          {activeView === 'nba62-conference' && (
            selectedNba62ConferenceDoc ? (
              <Nba62ConferenceDetail
                parentDocId={selectedNba62ConferenceDoc._id.replace(/^drafts\./, '')}
                yearLabel={selectedNba62ConferenceDoc.yearLabel}
                onBack={() => setSelectedNba62ConferenceDoc(null)}
              />
            ) : (
              <GenericYearList
                docType="nba62Conference"
                iconClass="bi-mic"
                onSelect={(doc) => setSelectedNba62ConferenceDoc(doc)}
              />
            )
          )}

          {/* ─── 6.2 Book ─── */}
          {activeView === 'nba62-book' && (
            selectedNba62BookDoc ? (
              <Nba62BookDetail
                parentDocId={selectedNba62BookDoc._id.replace(/^drafts\./, '')}
                yearLabel={selectedNba62BookDoc.yearLabel}
                onBack={() => setSelectedNba62BookDoc(null)}
              />
            ) : (
              <GenericYearList
                docType="nba62Book"
                iconClass="bi-book"
                onSelect={(doc) => setSelectedNba62BookDoc(doc)}
              />
            )
          )}

          {/* ─── 6.2.3 Faculty Developmental Activities ─── */}
          {activeView === 'nba623-faculty-dev' && (
            selectedNba623FacultyDevDoc ? (
              <Nba623FacultyDevDetail
                parentDocId={selectedNba623FacultyDevDoc._id.replace(/^drafts\./, '')}
                yearLabel={selectedNba623FacultyDevDoc.yearLabel}
                onBack={() => setSelectedNba623FacultyDevDoc(null)}
              />
            ) : (
              <GenericYearList
                docType="nba623FacultyDev"
                iconClass="bi-tools"
                onSelect={(doc) => setSelectedNba623FacultyDevDoc(doc)}
              />
            )
          )}

          {/* ─── 6.2.3 Patent ─── */}
          {activeView === 'nba623-patent' && (
            <Nba623PatentDetail />
          )}

          {/* ─── Infosys Springboard Certification ─── */}
          {activeView === 'infosys-springboard' && (
            <>
              {!selectedInfospringYear ? (
                <InfospringYearList onSelect={setSelectedInfospringYear} />
              ) : (
                <InfospringDetail
                  yearId={selectedInfospringYear._id.replace(/^drafts\./, '')}
                  yearLabel={selectedInfospringYear.yearLabel}
                  onBack={() => setSelectedInfospringYear(null)}
                />
              )}
            </>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;
