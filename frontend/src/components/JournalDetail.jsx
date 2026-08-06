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
 * JournalDetail — fetches ALL journalData records and displays them in a single table.
 * No year selection is needed for this section.
 */
function JournalDetail() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('none');

  useEffect(() => {
    fetchRows();
  }, []);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const query = `*[_type == "journalData"] | order(sNo asc) {
        _id,
        sNo,
        studentName,
        paperTitle,
        journalDetails,
        scopusSci,
        webLink,
        year
      }`;
      const data = await client.fetch(query);
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load journal data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayedRows = () => {
    const sorted = [...rows];
    if (sortBy === 'none') return sorted;
    if (sortBy === 'sNo') sorted.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
    else if (sortBy === 'name') sorted.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
    else if (sortBy === 'year') sorted.sort((a, b) => (a.year || '').localeCompare(b.year || ''));
    return sorted;
  };

  if (loading) {
    return <div className="alert alert-info">Loading journal data...</div>;
  }

  const displayedRows = getDisplayedRows();

  return (
    <div>
      {/* Controls bar — Sort + Record count in one row */}
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
        {/* Record count */}
        <span className="section-meta-count">
          {rows.length} record{rows.length !== 1 ? 's' : ''}
        </span>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label className="modal-sort-label" htmlFor="journal-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="journal-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">No Sort</option>
            <option value="sNo">S.No</option>
            <option value="name">Student Name</option>
            <option value="year">Year</option>
          </select>
        </div>
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
                <th className="text-start">Name of the student</th>
                <th className="text-start">Title of the paper</th>
                <th className="text-start">Journal/Conference details</th>
                <th>Scopus/SCI</th>
                <th>Web link of the paper</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{row.sNo ?? idx + 1}</td>
                  <td className="text-start">
                    <strong>{sanitize(row.studentName) || '—'}</strong>
                  </td>
                  <td className="text-start">{sanitize(row.paperTitle) || '—'}</td>
                  <td className="text-start">{sanitize(row.journalDetails) || '—'}</td>
                  <td>
                    {sanitize(row.scopusSci) ? (
                      <span className="badge bg-secondary">{sanitize(row.scopusSci)}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {sanitize(row.webLink) ? (
                      <a
                        href={sanitize(row.webLink)}
                        target="_blank"
                        rel="noreferrer"
                        className="cert-link-badge"
                      >
                        <i className="bi bi-box-arrow-up-right me-1"></i>Link
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{sanitize(row.year) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default JournalDetail;
