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
 * ScopusDetail — fetches scopusData records for a specific year document.
 * Columns: SI.No | Title | Conference/Venue | Intl/National | Date | Authors | Indexed | Publisher | Link
 */
function ScopusDetail({ parentDocId, onBack, yearLabel }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('none');

  useEffect(() => {
    if (parentDocId) fetchRows();
  }, [parentDocId]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const query = `*[_type == "scopusData" && parent._ref == $parentDocId] | order(sNo asc) {
        _id,
        sNo,
        paperTitle,
        conferenceName,
        intlNational,
        date,
        authors,
        indexed,
        publisher,
        webLink
      }`;
      const data = await client.fetch(query, { parentDocId });
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load Scopus data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedRows = () => {
    const sorted = [...rows];
    if (sortBy === 'none') return sorted;
    if (sortBy === 'sNo')    sorted.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
    else if (sortBy === 'title')   sorted.sort((a, b) => (a.paperTitle || '').localeCompare(b.paperTitle || ''));
    else if (sortBy === 'date')    sorted.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    else if (sortBy === 'indexed') sorted.sort((a, b) => (a.indexed || '').localeCompare(b.indexed || ''));
    return sorted;
  };

  if (loading) {
    return <div className="alert alert-info">Loading Scopus data...</div>;
  }

  const sortedRows = getSortedRows();

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex align-items-center mb-2">
        <button className="btn btn-outline-secondary me-3" onClick={onBack}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
        <h4 className="mb-0">Scopus / Conference — {yearLabel}</h4>
      </div>

      {/* Controls bar — records count + sort in one row */}
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
          <label className="modal-sort-label" htmlFor="scopus-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="scopus-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">No Sort</option>
            <option value="sNo">SI.No</option>
            <option value="title">Title</option>
            <option value="date">Date</option>
            <option value="indexed">Indexed</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-2">{error}</div>}

      {rows.length === 0 ? (
        <div className="alert alert-info mt-2">
          No data found. Please import a CSV via Sanity Studio.
        </div>
      ) : (
        <div className="table-container section-table-wrap">
          <table className="table table-bordered table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th style={{ width: 55 }}>SI.No</th>
                <th className="text-start">Title of the Paper</th>
                <th className="text-start">Conference / Venue</th>
                <th>Intl / National</th>
                <th>Date</th>
                <th className="text-start">Authors</th>
                <th>Indexed</th>
                <th className="text-start">Publisher</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{row.sNo ?? idx + 1}</td>
                  <td className="text-start">
                    <strong>{sanitize(row.paperTitle) || '—'}</strong>
                  </td>
                  <td className="text-start">{sanitize(row.conferenceName) || '—'}</td>
                  <td>
                    {sanitize(row.intlNational) ? (
                      <span className={`badge ${sanitize(row.intlNational).toLowerCase().startsWith('inter') ? 'bg-primary' : 'bg-success'}`}>
                        {sanitize(row.intlNational)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{sanitize(row.date) || '—'}</td>
                  <td className="text-start" style={{ fontSize: '0.82rem' }}>{sanitize(row.authors) || '—'}</td>
                  <td>
                    {sanitize(row.indexed) ? (
                      <span className="badge bg-secondary">{sanitize(row.indexed)}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-start" style={{ fontSize: '0.82rem' }}>{sanitize(row.publisher) || '—'}</td>
                  <td>
                    {sanitize(row.webLink) ? (
                      <a
                        href={sanitize(row.webLink)}
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

export default ScopusDetail;
