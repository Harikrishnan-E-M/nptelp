import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

// Static total counts for Student NPTEL — override dynamic Sanity count
const STATIC_YEAR_TOTALS = {
  '2025-2026': 623,
  '2024-2025': 573,
  '2023-2024': 528,
  '2022-2023': 159,
  '2021-2022': 107,
};

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
      const query = `*[_type == "academicYear"] | order(yearLabel desc) {
        _id,
        yearLabel,
        startYear,
        endYear,
        description,
        _createdAt,
        "totalStudents": count(*[_type == "nptelData" && references(^._id)])
      }`;
      const data = await client.fetch(query);
      setYears(data);
      setError(null);
    } catch (err) {
      setError('Failed to load academic years');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="cse-loader-container"><div className="cse-loader-text">CSE</div></div>;
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
              <div className="card year-card h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-calendar me-1 fs-5"></i>
                    <h5 className="card-title mb-0">{year.yearLabel}</h5>
                  </div>
                  {year.description && (
                    <p className="card-text small text-secondary mb-2">{year.description}</p>
                  )}

                  <div className="d-flex gap-3 mb-3 mt-auto">
                    <div className="faculty-stat-pill">
                       <span className="faculty-stat-label">Total Students</span>
                       <span className="faculty-stat-value">
                         {STATIC_YEAR_TOTALS[year.yearLabel] ?? (year.totalStudents != null ? year.totalStudents : '0')}
                       </span>
                     </div>
                  </div>

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
