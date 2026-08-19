import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

/**
 * CaseStudyYearList — lists all Case Study year documents.
 * Each card shows yearLabel and record count.
 * Props:
 *   onSelect — callback(doc) when a card is clicked
 */
function CaseStudyYearList({ onSelect }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const query = `*[_type == "caseStudy"] | order(yearLabel desc) {
        _id,
        yearLabel,
        startYear,
        endYear,
        description,
        dataCount
      }`;
      const data = await client.fetch(query);
      setDocs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load case study years. Please try again later.');
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
                    <i className="bi bi-journal-bookmark me-1"></i>
                    <h5 className="card-title mb-0">{doc.yearLabel}</h5>
                  </div>

                  {(doc.startYear || doc.endYear) && (
                    <p className="card-text text-muted mb-2">
                      {doc.startYear} – {doc.endYear}
                    </p>
                  )}

                  {doc.description && (
                    <p className="card-text small text-secondary mb-2">{doc.description}</p>
                  )}

                  {doc.dataCount != null && (
                    <div className="faculty-stat-pill mb-3" style={{ display: 'inline-flex' }}>
                      <span className="faculty-stat-label">Records</span>
                      <span className="faculty-stat-value">{doc.dataCount}</span>
                    </div>
                  )}

                  <button
                    className="btn btn-primary btn-sm w-100"
                    onClick={() => onSelect(doc)}
                  >
                    <i className="bi bi-list-ul me-1"></i>View Case Studies
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

export default CaseStudyYearList;
