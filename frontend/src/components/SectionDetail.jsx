import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

/**
 * SectionDetail — shows full detail for one ICT Tools or Innovative Teaching document.
 * All sections appear in one continuous table with a merged "Year" column (rowSpan).
 * A single sort bar at the top lets the user sort by Name, Course Code, Course Name, or Year.
 * Props:
 *   docId        — Sanity _id of the document to fetch in full
 *   docType      — 'ictTools' | 'innovativeTeaching'
 *   onBack       — callback to go back to the list
 *   menuLabel    — display name for the back button
 */
function SectionDetail({ docId, docType, onBack, menuLabel }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('none');

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
            proofs[] { label, url }
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

  /**
   * Flattens all sections into a single list of rows, then sorts globally.
   * Every row carries { sectionTitle, ...item } so sorting works across the whole table.
   */
  const getFlatRows = (sections) => {
    if (!sections) return [];

    // Flatten
    let flat = [];
    sections.forEach((section) => {
      const items = section.items || [];
      if (items.length === 0) {
        flat.push({ sectionTitle: section.sectionTitle || '', item: null });
      } else {
        items.forEach((item) => {
          flat.push({ sectionTitle: section.sectionTitle || '', item });
        });
      }
    });

    // Global sort
    if (sortBy === 'name') {
      flat = flat.filter(r => r.item).sort((a, b) =>
        (a.item.name || '').localeCompare(b.item.name || '')
      );
    } else if (sortBy === 'courseCode') {
      flat = flat.filter(r => r.item).sort((a, b) =>
        (a.item.courseCode || '').localeCompare(b.item.courseCode || '', undefined, {
          numeric: true, sensitivity: 'base',
        })
      );
    } else if (sortBy === 'courseName') {
      flat = flat.filter(r => r.item).sort((a, b) =>
        (a.item.courseName || '').localeCompare(b.item.courseName || '')
      );
    } else if (sortBy === 'year') {
      flat = flat.filter(r => r.item).sort((a, b) =>
        (a.sectionTitle || '').localeCompare(b.sectionTitle || '')
      );
    }

    return flat;
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

  const rawSections = doc.sections || [];
  const rows = getFlatRows(rawSections);

  return (
    <div>
      {/* Top bar — back button, title, and sort control on the right */}
      <div className="detail-top-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline-secondary" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>Back to {menuLabel}
          </button>
          <h2 className="detail-top-title" style={{ margin: 0 }}>
            {doc.pageTitle || `${doc.yearLabel} — ${doc.semester} Semester`}
          </h2>
        </div>
        {/* Sort control — top right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="modal-sort-label" htmlFor="global-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="global-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">None</option>
            <option value="name">Name</option>
            <option value="courseCode">Course Code</option>
            <option value="courseName">Course Name</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      {/* Meta bar */}
      <div className="section-meta-bar" style={{ marginBottom: '1rem' }}>
        <span className="section-meta-year">
          <i className="bi bi-calendar2 me-1"></i>{doc.yearLabel}
        </span>
        <span className={`semester-badge ${doc.semester === 'ODD' ? 'semester-odd' : 'semester-even'}`}>
          {doc.semester} Semester
        </span>
        <span className="section-meta-count">
          {rawSections.length} Section{rawSections.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {rawSections.length === 0 ? (
        <div className="alert alert-info mt-3">
          No sections have been added yet. Please add sections via Sanity Studio.
        </div>
      ) : (
        <>
          {/* Single unified table */}
          <div className="table-container section-table-wrap">
            <table className="table table-bordered table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th className="text-center">#</th>
                  <th className="text-center">Name</th>
                  <th className="text-center" style={{ minWidth: '120px' }}>Year</th>
                  <th className="text-center">Course Code</th>
                  <th className="text-center">Course Name</th>
                  <th className="text-center">{typeColumnHeader}</th>
                  <th className="text-center">Proof</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.item === null ? (
                      /* Empty section */
                      <>
                        <td>—</td>
                        <td className="text-muted fst-italic">No entries</td>
                        <td>{row.sectionTitle || '—'}</td>
                        <td colSpan={4} className="text-muted fst-italic text-center">No entries in this section.</td>
                      </>
                    ) : (
                      <>
                        <td>{rIdx + 1}</td>
                        <td className="text-start"><strong>{row.item.name || '—'}</strong></td>
                        <td>{row.sectionTitle || '—'}</td>
                        <td>{row.item.courseCode || '—'}</td>
                        <td className="text-start">{row.item.courseName || '—'}</td>
                        <td>{row.item[typeFieldName] || '—'}</td>
                        <td>
                          {row.item.proofs && row.item.proofs.length > 0 ? (
                            <div className="proof-links-cell">
                              {row.item.proofs.map((p, pIdx) => (
                                <a
                                  key={pIdx}
                                  href={p.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="cert-link-badge proof-btn"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  🔗 {p.label || `View Proof ${pIdx + 1}`}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default SectionDetail;
