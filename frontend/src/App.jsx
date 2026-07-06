import React, { useState } from 'react';
import YearsList from './components/YearsList';
import Statistics from './components/Statistics';
import SemesterYearList from './components/SemesterYearList';
import SectionDetail from './components/SectionDetail';
import './App.css';

function App() {
  // ── NPTEL state (unchanged) ──────────────────────────────
  const [selectedYear, setSelectedYear] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setShowStats(true);
  };

  const handleBack = () => {
    setShowStats(false);
    setSelectedYear(null);
  };

  // ── Active menu tab ──────────────────────────────────────
  // 'nptel' | 'ict' | 'innovative'
  const [activeMenu, setActiveMenu] = useState('nptel');

  // ── ICT Tools state ──────────────────────────────────────
  const [selectedIctDoc, setSelectedIctDoc] = useState(null);

  const handleIctSelect = (doc) => setSelectedIctDoc(doc);
  const handleIctBack = () => setSelectedIctDoc(null);

  // ── Innovative Teaching state ────────────────────────────
  const [selectedInnoDoc, setSelectedInnoDoc] = useState(null);

  const handleInnoSelect = (doc) => setSelectedInnoDoc(doc);
  const handleInnoBack = () => setSelectedInnoDoc(null);

  // ── Switch menu (reset sub-navigation) ──────────────────
  const switchMenu = (tab) => {
    setActiveMenu(tab);
    // Reset NPTEL sub-navigation when leaving the tab
    if (tab !== 'nptel') {
      setShowStats(false);
      setSelectedYear(null);
    }
    // Reset ICT sub-navigation when leaving
    if (tab !== 'ict') {
      setSelectedIctDoc(null);
    }
    // Reset Innovative sub-navigation when leaving
    if (tab !== 'innovative') {
      setSelectedInnoDoc(null);
    }
  };

  return (
    <div className="app-wrapper">
      {/* ── Site Header ─────────────────────────────────────── */}
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

      {/* ── Navigation Menu Bar ─────────────────────────────── */}
      <nav className="site-navbar">
        <div className="site-navbar-inner">
          <button
            className={`nav-tab ${activeMenu === 'nptel' ? 'nav-tab-active' : ''}`}
            onClick={() => switchMenu('nptel')}
          >
            <i className="bi bi-mortarboard me-2"></i>Student NPTEL
          </button>
          <button
            className={`nav-tab ${activeMenu === 'ict' ? 'nav-tab-active' : ''}`}
            onClick={() => switchMenu('ict')}
          >
            <i className="bi bi-laptop me-2"></i>ICT Tools
          </button>
          <button
            className={`nav-tab ${activeMenu === 'innovative' ? 'nav-tab-active' : ''}`}
            onClick={() => switchMenu('innovative')}
          >
            <i className="bi bi-lightbulb me-2"></i>Innovative Teaching Activity
          </button>
        </div>
      </nav>

      {/* ── Page Content ─────────────────────────────────────── */}
      <div className="container py-4">

        {/* ─── Student NPTEL ─── */}
        {activeMenu === 'nptel' && (
          <>
            {!showStats ? (
              <YearsList onYearSelect={handleYearSelect} />
            ) : (
              <Statistics year={selectedYear} onBack={handleBack} />
            )}
          </>
        )}

        {/* ─── ICT Tools ─── */}
        {activeMenu === 'ict' && (
          <>
            {!selectedIctDoc ? (
              <>
                <SemesterYearList docType="ictTools" onSelect={handleIctSelect} />
              </>
            ) : (
              <SectionDetail
                docId={selectedIctDoc._id}
                docType="ictTools"
                onBack={handleIctBack}
                menuLabel="ICT Tools"
              />
            )}
          </>
        )}

        {/* ─── Innovative Teaching Activity ─── */}
        {activeMenu === 'innovative' && (
          <>
            {!selectedInnoDoc ? (
              <>
                <SemesterYearList docType="innovativeTeaching" onSelect={handleInnoSelect} />
              </>
            ) : (
              <SectionDetail
                docId={selectedInnoDoc._id}
                docType="innovativeTeaching"
                onBack={handleInnoBack}
                menuLabel="Innovative Teaching Activity"
              />
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default App;
