import React, { useState, useEffect } from 'react';
import axios from 'axios';

function YearsList({ onYearSelect }) {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/years');
      setYears(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load academic years');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="alert alert-info">Loading academic years...</div>;
  }

  return (
    <div>

      {error && <div className="alert alert-danger">{error}</div>}


      {years.length === 0 ? (
        <div className="alert alert-info">No academic years found. Please contact the admin</div>
      ) : (
        <div className="row g-3">
          {years.map((year) => (
            <div key={year._id} className="col-md-6 col-lg-4">
              <div className="card year-card">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-calendar me-2"></i>{year.yearLabel}
                  </h5>
                  <p className="card-text text-muted">
                    {year.startYear} - {year.endYear}
                  </p>
                  {year.description && (
                    <p className="card-text small text-secondary">{year.description}</p>
                  )}
                  <button
                    className="btn btn-primary btn-sm w-100"
                    onClick={() => onYearSelect(year)}
                  >
                    <i className="bi bi-bar-chart me-1"></i>View Statistics
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

export default YearsList;
