import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

/**
 * FacultyCertYearList — lists all Faculty Certification year documents.
 * Each card shows yearLabel, totalFaculty (unique names), completedCount.
 * Props:
 *   onSelect — callback(doc) when a card is clicked
 */
function FacultyCertYearList({ onSelect }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const query = `*[_type == "facultyCertification"] | order(yearLabel desc) {
        _id,
        yearLabel,
        totalFaculty,
        completedCount
      }`;
      const data = await client.fetch(query);
      setDocs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load faculty certification years. Please try again later.');
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
      {docs.length === 0 ? (
        <div className="alert alert-info">
          No records found. Please add entries via the Sanity Studio.
        </div>
      ) : (
        <div className="row g-3">
          {docs.map((doc) => (
            <div key={doc._id} className="col-md-6 col-lg-4">
              <div className="card year-card">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-award me-1"></i>
                    <h5 className="card-title mb-0">{doc.yearLabel}</h5>
                  </div>

                  {/* Faculty stats */}
                  <div className="d-flex gap-3 mb-3">
                    <div className="faculty-stat-pill">
                      <span className="faculty-stat-label">Total Faculty</span>
                      <span className="faculty-stat-value">
                        {doc.totalFaculty != null ? doc.totalFaculty : '—'}
                      </span>
                    </div>
                    <div className="faculty-stat-pill faculty-stat-pill--completed">
                      <span className="faculty-stat-label">Completed</span>
                      <span className="faculty-stat-value">
                        {doc.completedCount != null ? doc.completedCount : '—'}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm w-100"
                    onClick={() => onSelect(doc)}
                  >
                    <i className="bi bi-list-ul me-1"></i>View List
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

export default FacultyCertYearList;
