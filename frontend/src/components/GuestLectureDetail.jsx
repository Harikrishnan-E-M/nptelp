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
 * GuestLectureDetail — fetches the single Guest Lecture document
 * and displays the main data table. No year count table is shown.
 * CSV columns: Sl.No. | Date | Name of the Programme | Name of the speaker, Designation and Address details | Topic | Proof
 */
function GuestLectureDetail() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('none');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch the parent document
      const parentQuery = `*[_type == "guestLecture"][0]{
        _id
      }`;
      const parentDoc = await client.fetch(parentQuery);

      // Fetch row data linked to the parent doc
      let rowData = [];
      if (parentDoc?._id) {
        const dataQuery = `*[_type == "guestLectureData" && parent._ref == $parentId] | order(sNo asc) {
          _id,
          sNo,
          date,
          programmeName,
          speakerDetails,
          topic,
          proofLink
        }`;
        rowData = await client.fetch(dataQuery, { parentId: parentDoc._id });
      }

      setRows(rowData);
      setError(null);
    } catch (err) {
      setError('Failed to load guest lecture data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayedRows = () => {
    const sorted = [...rows];
    if (sortBy === 'none') return sorted;
    if (sortBy === 'sNo') sorted.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
    else if (sortBy === 'programme') sorted.sort((a, b) => (a.programmeName || '').localeCompare(b.programmeName || ''));
    else if (sortBy === 'speaker') sorted.sort((a, b) => (a.speakerDetails || '').localeCompare(b.speakerDetails || ''));
    else if (sortBy === 'date') sorted.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return sorted;
  };

  if (loading) {
    return <div className="cse-loader-container"><div className="cse-loader-text">CSE</div></div>;
  }

  const displayedRows = getDisplayedRows();

  return (
    <div>
      {error && <div className="alert alert-danger mt-2">{error}</div>}

      {/* ── Controls bar ── */}
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
          <label className="modal-sort-label" htmlFor="gl-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="gl-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">No Sort</option>
            <option value="sNo">Sl.No.</option>
            <option value="date">Date</option>
            <option value="programme">Programme Name</option>
            <option value="speaker">Speaker Details</option>
          </select>
        </div>
      </div>

      {/* ── Main Data Table ── */}
      {rows.length === 0 ? (
        <div className="alert alert-info mt-2">
          No data found. Please import a CSV via Sanity Studio.
        </div>
      ) : (
        <div className="table-container section-table-wrap">
          <table className="table table-bordered table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th style={{ width: 60 }}>Sl.No.</th>
                <th>Date</th>
                <th className="text-start">Name of the Programme</th>
                <th className="text-start">Name of the speaker, Designation and Address details</th>
                <th className="text-start">Topic</th>
                <th>Proof</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{row.sNo ?? idx + 1}</td>
                  <td>{sanitize(row.date) || '—'}</td>
                  <td className="text-start">
                    <strong>{sanitize(row.programmeName) || '—'}</strong>
                  </td>
                  <td className="text-start">{sanitize(row.speakerDetails) || '—'}</td>
                  <td className="text-start">{sanitize(row.topic) || '—'}</td>
                  <td>
                    {sanitize(row.proofLink) ? (
                      <a
                        href={sanitize(row.proofLink)}
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

export default GuestLectureDetail;
