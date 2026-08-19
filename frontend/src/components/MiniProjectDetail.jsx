import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

const sanitize = (str) => {
  if (!str) return '';
  return str
    .replace(/^[\uFEFF\u200B\u200C\u200D\u00A0\u202F\u2060]+/, '')
    .replace(/^[^\u0020-\u007E\u00A1-\u024F\u0900-\u097F]+/, '')
    .trim();
};

/**
 * MiniProjectDetail — fetches miniProjectData records for a specific year document.
 */
function MiniProjectDetail({ parentDocId, onBack, yearLabel }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('none');

  useEffect(() => {
    if (parentDocId) {
      fetchRows();
    }
  }, [parentDocId]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const query = `*[_type == "miniProjectData" && year._ref == $parentDocId] | order(sNo asc) {
        _id,
        sNo,
        name,
        course,
        miniProjectLink
      }`;
      const data = await client.fetch(query, { parentDocId });
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load mini project data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayedRows = () => {
    const sorted = [...rows];
    if (sortBy === 'none') return sorted;
    if (sortBy === 'sNo')    sorted.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
    else if (sortBy === 'name')   sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'course') sorted.sort((a, b) => (a.course || '').localeCompare(b.course || ''));
    return sorted;
  };

  if (loading) {
    return <div className="cse-loader-container"><div className="cse-loader-text">CSE</div></div>;
  }

  const displayedRows = getDisplayedRows();

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex align-items-center mb-4">
        <button className="btn btn-outline-secondary me-3" onClick={onBack}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
        <h4 className="mb-0">Mini Project — {yearLabel}</h4>
      </div>

      {/* Controls bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label className="modal-sort-label" htmlFor="mp-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="mp-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">No Sort</option>
            <option value="sNo">S.No</option>
            <option value="name">Name</option>
            <option value="course">Course</option>
          </select>
        </div>
      </div>

      {/* Record count */}
      <div className="section-meta-bar" style={{ marginBottom: '1rem' }}>
        <span className="section-meta-count">
          {rows.length} record{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {rows.length === 0 ? (
        <div className="alert alert-info mt-3">
          No data found. Please import a CSV via Sanity Studio.
        </div>
      ) : (
        <div className="table-container section-table-wrap">
          <table className="table table-bordered table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th style={{ width: 60 }}>S.No</th>
                <th className="text-start">Name</th>
                <th className="text-start">Course</th>
                <th>Mini Project Link</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{row.sNo ?? idx + 1}</td>
                  <td className="text-start">
                    <strong>{sanitize(row.name) || '—'}</strong>
                  </td>
                  <td className="text-start">{sanitize(row.course) || '—'}</td>
                  <td>
                    {sanitize(row.miniProjectLink) ? (
                      <a
                        href={sanitize(row.miniProjectLink)}
                        target="_blank"
                        rel="noreferrer"
                        className="cert-link-badge"
                      >
                        <i className="bi bi-box-arrow-up-right me-1"></i>View
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MiniProjectDetail;
