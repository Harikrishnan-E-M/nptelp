import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

/**
 * SemesterYearList — reusable component that lists Year+Semester documents
 * for either 'ictTools' or 'innovativeTeaching' document types.
 * Props:
 *   docType  — 'ictTools' | 'innovativeTeaching'
 *   onSelect — callback(doc) when a card is clicked
 */
function SemesterYearList({ docType, onSelect }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line
  }, [docType]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const query = `*[_type == $docType] | order(yearLabel desc, semester asc) {
        _id,
        yearLabel,
        semester,
        pageTitle
      }`;
      const data = await client.fetch(query, { docType });
      setDocs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="alert alert-info">Loading...</div>;
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
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-calendar me-1"></i>
                    <h5 className="card-title mb-0">{doc.yearLabel}</h5>
                    <span className={`semester-badge ${doc.semester === 'ODD' ? 'semester-odd' : 'semester-even'}`}>
                      {doc.semester}
                    </span>
                  </div>
                  {doc.pageTitle && (
                    <p className="card-text small text-secondary mt-1">{doc.pageTitle}</p>
                  )}
                  <button
                    className="btn btn-primary btn-sm w-100"
                    onClick={() => onSelect(doc)}
                  >
                    <i className="bi bi-grid me-1"></i>View Details
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

export default SemesterYearList;
