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
 * Nba623FacultyDevDetail
 * Fetches nba623FacultyDevData rows for a given year document.
 * Columns: S.No | Faculty Name | Year/Sem | Subject Code | Subject Name | Description | Link
 */
function Nba623FacultyDevDetail({ parentDocId, yearLabel, onBack }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [sortBy, setSortBy]   = useState('none');

  useEffect(() => {
    if (parentDocId) fetchRows();
  }, [parentDocId]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const query = `*[_type == "nba623FacultyDevData" && parent._ref == $parentDocId] | order(sNo asc) {
        _id,
        sNo,
        facultyName,
        yearSem,
        subjectCode,
        subjectName,
        description,
        link
      }`;
      const data = await client.fetch(query, { parentDocId });
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load 6.2.3 Faculty Developmental Activities data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedRows = () => {
    const sorted = [...rows];
    if (sortBy === 'none')         return sorted;
    if (sortBy === 'sNo')          sorted.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
    else if (sortBy === 'faculty') sorted.sort((a, b) => (a.facultyName || '').localeCompare(b.facultyName || ''));
    else if (sortBy === 'subject') sorted.sort((a, b) => (a.subjectName || '').localeCompare(b.subjectName || ''));
    return sorted;
  };

  if (loading) return <div className="alert alert-info">Loading 6.2.3 Faculty Developmental Activities data...</div>;

  const sortedRows = getSortedRows();

  return (
    <div>
      {/* Back + Title */}
      <div className="d-flex align-items-center mb-2">
        <button className="btn btn-outline-secondary me-3" onClick={onBack}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
        <h4 className="mb-0">6.2.3 Faculty Developmental Activities — {yearLabel}</h4>
      </div>

      {/* Controls bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <span className="section-meta-count">
          {rows.length} record{rows.length !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label className="modal-sort-label" htmlFor="nba623-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="nba623-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">No Sort</option>
            <option value="sNo">S.No</option>
            <option value="faculty">Faculty Name</option>
            <option value="subject">Subject Name</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-2">{error}</div>}

      {rows.length === 0 ? (
        <div className="alert alert-info mt-2">
          No data found. Please import a CSV via Sanity Studio under{' '}
          <em>6.2.3 Faculty Dev. Activities</em>.
        </div>
      ) : (
        <div className="table-container section-table-wrap">
          <table className="table table-bordered table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th style={{ width: 55 }}>S.No</th>
                <th className="text-start" style={{ minWidth: 160 }}>Faculty Name</th>
                <th style={{ width: 90 }}>Year / Sem</th>
                <th style={{ width: 120 }}>Subject Code</th>
                <th className="text-start" style={{ minWidth: 160 }}>Subject Name</th>
                <th className="text-start" style={{ minWidth: 280 }}>
                  Working Models &amp; Prototypes Developed (Description)
                </th>
                <th style={{ width: 80 }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{row.sNo ?? idx + 1}</td>
                  <td className="text-start">
                    <strong>{sanitize(row.facultyName) || '—'}</strong>
                  </td>
                  <td>{sanitize(row.yearSem) || '—'}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 12,
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                    >
                      {sanitize(row.subjectCode) || '—'}
                    </span>
                  </td>
                  <td className="text-start" style={{ fontSize: '0.88rem' }}>
                    {sanitize(row.subjectName) || '—'}
                  </td>
                  <td className="text-start" style={{ fontSize: '0.84rem', color: '#475569' }}>
                    {sanitize(row.description) || '—'}
                  </td>
                  <td>
                    {sanitize(row.link) ? (
                      <a
                        href={sanitize(row.link)}
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

export default Nba623FacultyDevDetail;
