import React, { useState, useEffect } from 'react';
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
    <div className="container py-4">
      {!showStats ? (
        <YearsList onYearSelect={handleYearSelect} />
      ) : (
        <Statistics year={selectedYear} onBack={handleBack} />
      )}
    </div>
  );
}

export default App;
