import React, { useState } from 'react';
import YearsList from './components/YearsList';
import Statistics from './components/Statistics';
import './App.css';

function App() {
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

  return (
    <div className="app-wrapper">
      {/* Site Header with Kongu Logo */}
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
            <h1 className="header-title">NPTEL DETAILS - COMPUTER SCIENCE AND ENGINEERING</h1>
          </div>
        </div>
      </header>

      <div className="container py-4">
        {!showStats ? (
          <YearsList onYearSelect={handleYearSelect} />
        ) : (
          <Statistics year={selectedYear} onBack={handleBack} />
        )}
      </div>
    </div>
  );
}

export default App;
