import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

/**
 * GenericYearList — lists year documents for a specific docType (e.g., caseStudy, miniProject, nonFormal).
 * Props:
 *   docType: string (sanity document type)
 *   iconClass: string (e.g. 'bi-journal-text')
 *   onSelect: callback(doc) when a card is clicked
 */
function GenericYearList({ docType, iconClass, onSelect }) {
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
      const query = `*[_type == $docType] | order(yearLabel desc) {
        _id,
        yearLabel,
        dataCount
      }`;
      const data = await client.fetch(query, { docType });
      setDocs(data);
      setError(null);
    } catch (err) {
      setError(`Failed to load years for ${docType}. Please try again later.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="alert alert-info">Loading years...</div>;
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
              <div className="card year-card h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className={`bi ${iconClass} me-1 fs-5`}></i>
                    <h5 className="card-title mb-0">{doc.yearLabel || 'Unnamed Year'}</h5>
                  </div>

                  <div className="d-flex gap-3 mb-3 mt-auto">
                    <div className="faculty-stat-pill">
                      <span className="faculty-stat-label">Total Records</span>
                      <span className="faculty-stat-value">
                        {doc.dataCount != null ? doc.dataCount : '0'}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm w-100"
                    onClick={() => onSelect(doc)}
                  >
                    <i className="bi bi-list-ul me-1"></i>View Details
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

export default GenericYearList;
