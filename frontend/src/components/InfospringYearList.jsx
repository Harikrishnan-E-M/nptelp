import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

/**
 * InfospringYearList — lists infospringYear documents (one card per academic year).
 * Clicking a card calls onSelect(yearDoc).
 */
function InfospringYearList({ onSelect }) {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      setLoading(true);
      // For each year, also count how many coordinator documents reference it
      const query = `*[_type == "infospringYear"] | order(yearLabel desc) {
        _id,
        yearLabel,
        description,
        "coordCount": count(*[_type == "infospringCoord" && year._ref == ^._id])
      }`;
      const data = await client.fetch(query);
      setYears(data);
      setError(null);
    } catch (err) {
      setError('Failed to load Infosys Springboard years. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" role="status" />
        <span>Loading years...</span>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}

      {years.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2" />
          No years found. Please add a{' '}
          <strong>Infosys Springboard — Year</strong> document in Sanity Studio.
        </div>
      ) : (
        <div className="row g-3">
          {years.map((year) => (
            <div key={year._id} className="col-md-6 col-lg-4">
              <div
                className="card h-100"
                style={{
                  border: '1px solid #e0e7ef',
                  borderLeft: '4px solid #0f4c81',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  background: '#fff',
                }}
                onClick={() => onSelect(year)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,76,129,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
                }}
              >
                <div className="card-body d-flex flex-column">
                  {/* Icon + Year */}
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #0f4c81, #1a73e8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      <i className="bi bi-award-fill" />
                    </div>
                    <h5 className="card-title mb-0" style={{ color: '#1e293b', fontWeight: 700 }}>
                      {year.yearLabel || 'Unnamed Year'}
                    </h5>
                  </div>

                  {year.description && (
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      {year.description}
                    </p>
                  )}

                  <button
                    className="btn btn-sm w-100 mt-auto"
                    style={{
                      background: 'linear-gradient(135deg, #0f4c81, #1a73e8)',
                      color: '#fff',
                      borderRadius: 8,
                      fontWeight: 600,
                      border: 'none',
                    }}
                    onClick={(e) => { e.stopPropagation(); onSelect(year); }}
                  >
                    <i className="bi bi-list-ul me-1" />
                    View Details
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

export default InfospringYearList;
