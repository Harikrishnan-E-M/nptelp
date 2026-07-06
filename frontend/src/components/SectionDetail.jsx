import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

/**
 * SectionDetail — shows full detail for one ICT Tools or Innovative Teaching document.
 * Displays each section one-by-one as a styled panel with a sort control.
 * Props:
 *   docId        — Sanity _id of the document to fetch in full
 *   docType      — 'ictTools' | 'innovativeTeaching'
 *   onBack       — callback to go back to the list
 *   menuLabel    — display name for "type" column header
 */
function SectionDetail({ docId, docType, onBack, menuLabel }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Per-section sort state: { [sectionIndex]: 'name' | 'courseCode' }
  const [sectionSorts, setSectionSorts] = useState({});

  const typeFieldName = docType === 'ictTools' ? 'typeOfIctTool' : 'typeOfActivity';
  const typeColumnHeader = docType === 'ictTools' ? 'Type of ICT Tool' : 'Type of Activity';

  useEffect(() => {
    fetchDoc();
    // eslint-disable-next-line
  }, [docId]);

  const fetchDoc = async () => {
    try {
      setLoading(true);
      const query = `*[_type == $docType && _id == $docId][0] {
        _id,
        yearLabel,
        semester,
        pageTitle,
        sections[] {
          sectionTitle,
          items[] {
            name,
            courseCode,
            courseName,
            ${typeFieldName},
            proof
          }
        }
      }`;
      const data = await client.fetch(query, { docType, docId });
      setDoc(data);
      setError(null);
    } catch (err) {
      setError('Failed to load section details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedItems = (items, sectionIndex) => {
    if (!items) return [];
    const sortBy = sectionSorts[sectionIndex] || 'none';
    const arr = [...items];
    if (sortBy === 'name') {
      return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    if (sortBy === 'courseCode') {
      return arr.sort((a, b) =>
        (a.courseCode || '').localeCompare(b.courseCode || '', undefined, { numeric: true, sensitivity: 'base' })
      );
    }
    return arr;
  };

  const handleSortChange = (sectionIndex, value) => {
    setSectionSorts((prev) => ({ ...prev, [sectionIndex]: value }));
  };

  if (loading) {
    return <div className="alert alert-info">Loading details...</div>;
  }

  if (!doc) {
    return (
      <div>
        <button className="btn btn-outline-secondary mb-3" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
        <div className="alert alert-warning">Document not found.</div>
      </div>
    );
  }

  const sections = doc.sections || [];

  return (
    <div>
      <div className="detail-top-bar">
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>Back to {menuLabel}
        </button>
        <h2 className="detail-top-title">
          {doc.pageTitle || `${doc.yearLabel} — ${doc.semester} Semester`}
        </h2>
      </div>

      <div className="section-meta-bar" style={{ marginBottom: '1rem' }}>
        <span className="section-meta-year">
          <i className="bi bi-calendar2 me-1"></i>{doc.yearLabel}
        </span>
        <span className={`semester-badge ${doc.semester === 'ODD' ? 'semester-odd' : 'semester-even'}`}>
          {doc.semester} Semester
        </span>
        <span className="section-meta-count">
          {sections.length} Section{sections.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {sections.length === 0 ? (
        <div className="alert alert-info mt-3">
          No sections have been added yet. Please add sections via Sanity Studio.
        </div>
      ) : (
        <div className="sections-list">
          {sections.map((section, sIdx) => {
            const items = getSortedItems(section.items, sIdx);
            return (
              <div key={sIdx} className="section-panel">
                {/* Section Header */}
                <div className="section-panel-header">
                  <div className="section-panel-title">
                    <span className="section-number-badge">{sIdx + 1}</span>
                    <span className="section-title-text">{section.sectionTitle || `Section ${sIdx + 1}`}</span>
                    <span className="section-count-chip">{(section.items || []).length} entries</span>
                  </div>
                  {/* Sort control */}
                  <div className="section-sort-control">
                    <label className="modal-sort-label" htmlFor={`sort-section-${sIdx}`}>Sort by:</label>
                    <select
                      id={`sort-section-${sIdx}`}
                      className="modal-sort-select"
                      value={sectionSorts[sIdx] || 'none'}
                      onChange={(e) => handleSortChange(sIdx, e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="name">Name</option>
                      <option value="courseCode">Course Code</option>
                    </select>
                  </div>
                </div>

                {/* Section Table */}
                <div className="table-container section-table-wrap">
                  {items.length === 0 ? (
                    <div className="p-3 text-muted text-center">No entries in this section.</div>
                  ) : (
                    <table className="table table-bordered table-hover align-middle text-center">
                      <thead className="table-dark">
                        <tr>
                          <th className="text-center">#</th>
                          <th className="text-center">Name</th>
                          <th className="text-center">Course Code</th>
                          <th className="text-center">Course Name</th>
                          <th className="text-center">{typeColumnHeader}</th>
                          <th className="text-center">Proof</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, iIdx) => (
                          <tr
                            key={iIdx}
                            onClick={() => item.proof && window.open(item.proof, '_blank', 'noreferrer')}
                            style={{ cursor: item.proof ? 'pointer' : 'default' }}
                            title={item.proof ? 'Click to view proof' : 'No proof link available'}
                          >
                            <td>{iIdx + 1}</td>
                            <td><strong>{item.name || '—'}</strong></td>
                            <td>{item.courseCode || '—'}</td>
                            <td>{item.courseName || '—'}</td>
                            <td>{item[typeFieldName] || '—'}</td>
                            <td>
                              {item.proof ? (
                                <span className="cert-link-badge">🔗 View</span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SectionDetail;
