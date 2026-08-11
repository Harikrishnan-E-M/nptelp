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
 * Nba62JournalDetail — fetches nba62JournalData records for a specific year document.
 * Columns: S.No | Faculty Name | Co-Authors | Paper Title | Journal Name
 *          | Type (SCI/SCIE/SCOPUS) | Published | Volume | Issue | Page | DOI | Quartile
 */
function Nba62JournalDetail({ parentDocId, yearLabel, onBack }) {
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
      const query = `*[_type == "nba62JournalData" && parent._ref == $parentDocId] | order(sNo asc) {
        _id,
        sNo,
        facultyName,
        coAuthors,
        paperTitle,
        journalName,
        typeOfJournal,
        publishedMonthYear,
        volumeNumber,
        issueNumber,
        pageNumber,
        doiLink,
        quartileRank
      }`;
      const data = await client.fetch(query, { parentDocId });
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load 6.2 Journal data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedRows = () => {
    const sorted = [...rows];
    if (sortBy === 'none')    return sorted;
    if (sortBy === 'sNo')     sorted.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
    else if (sortBy === 'faculty') sorted.sort((a, b) => (a.facultyName || '').localeCompare(b.facultyName || ''));
    else if (sortBy === 'type')    sorted.sort((a, b) => (a.typeOfJournal || '').localeCompare(b.typeOfJournal || ''));
    else if (sortBy === 'quartile') sorted.sort((a, b) => (a.quartileRank || '').localeCompare(b.quartileRank || ''));
    return sorted;
  };

  if (loading) return <div className="alert alert-info">Loading 6.2 Journal data...</div>;

  const sortedRows = getSortedRows();

  return (
    <div>
      {/* Back + Title */}
      <div className="d-flex align-items-center mb-2">
        <button className="btn btn-outline-secondary me-3" onClick={onBack}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
        <h4 className="mb-0">6.2 Journal — {yearLabel}</h4>
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
          <label className="modal-sort-label" htmlFor="nba62journal-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="nba62journal-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">No Sort</option>
            <option value="sNo">S.No</option>
            <option value="faculty">Faculty Name</option>
            <option value="type">Type (SCI/SCIE/SCOPUS)</option>
            <option value="quartile">Quartile Rank</option>
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
                <th style={{ width: 55 }}>S.No</th>
                <th className="text-start">Faculty Name</th>
                <th className="text-start">Co-Authors</th>
                <th className="text-start">Paper Title</th>
                <th className="text-start">Journal Name</th>
                <th>Type</th>
                <th>Published</th>
                <th>Vol</th>
                <th>Issue</th>
                <th>Page</th>
                <th>DOI</th>
                <th>Quartile</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{row.sNo ?? idx + 1}</td>
                  <td className="text-start">
                    <strong>{sanitize(row.facultyName) || '—'}</strong>
                  </td>
                  <td className="text-start" style={{ fontSize: '0.82rem' }}>
                    {sanitize(row.coAuthors) || '—'}
                  </td>
                  <td className="text-start">{sanitize(row.paperTitle) || '—'}</td>
                  <td className="text-start">{sanitize(row.journalName) || '—'}</td>
                  <td>
                    {sanitize(row.typeOfJournal) ? (
                      <span className="badge bg-primary">{sanitize(row.typeOfJournal)}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{sanitize(row.publishedMonthYear) || '—'}</td>
                  <td>{sanitize(row.volumeNumber) || '—'}</td>
                  <td>{sanitize(row.issueNumber) || '—'}</td>
                  <td>{sanitize(row.pageNumber) || '—'}</td>
                  <td>
                    {sanitize(row.doiLink) ? (
                      <a
                        href={sanitize(row.doiLink)}
                        target="_blank"
                        rel="noreferrer"
                        className="cert-link-badge"
                      >
                        <i className="bi bi-box-arrow-up-right me-1"></i>DOI
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {sanitize(row.quartileRank) ? (
                      <span className="badge bg-success">{sanitize(row.quartileRank)}</span>
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

export default Nba62JournalDetail;
