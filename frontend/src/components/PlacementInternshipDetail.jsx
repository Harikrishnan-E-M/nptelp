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
 * PlacementInternshipDetail — fetches records for a specific year document.
 * Columns: S.No | Roll Number | Student Name | Company & Location | From Date | To Date |
 *          Duration / No. of Days | Stipend | Internship Type
 */
function PlacementInternshipDetail({ parentDocId, onBack, yearLabel }) {
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
      const query = `*[_type == "placementInternshipData" && parent._ref == $parentDocId] | order(sNo asc) {
        _id,
        sNo,
        rollNumber,
        studentName,
        companyAndLocation,
        fromDate,
        toDate,
        duration,
        stipend,
        internshipType
      }`;
      const data = await client.fetch(query, { parentDocId });
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load placement internship data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedRows = () => {
    const sorted = [...rows];
    if (sortBy === 'none') return sorted;
    if (sortBy === 'name')    sorted.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
    else if (sortBy === 'sNo')     sorted.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
    else if (sortBy === 'roll')    sorted.sort((a, b) => (a.rollNumber || '').localeCompare(b.rollNumber || ''));
    else if (sortBy === 'company') sorted.sort((a, b) => (a.companyAndLocation || '').localeCompare(b.companyAndLocation || ''));
    return sorted;
  };

  if (loading) {
    return <div className="alert alert-info">Loading placement internship data...</div>;
  }

  const sortedRows = getSortedRows();

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex align-items-center mb-2">
        <button className="btn btn-outline-secondary me-3" onClick={onBack}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
        <h4 className="mb-0">Placement Internship — {yearLabel}</h4>
      </div>

      {/* Controls bar — count + sort in one row */}
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
          <label className="modal-sort-label" htmlFor="pi-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="pi-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">No Sort</option>
            <option value="name">Name</option>
            <option value="sNo">S.No</option>
            <option value="roll">Roll Number</option>
            <option value="company">Company</option>
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
                <th>Roll Number</th>
                <th className="text-start">Student Name</th>
                <th className="text-start">Company & Location</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Duration (Months)</th>
                <th>Stipend</th>
                <th className="text-start">Internship Type</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{row.sNo ?? idx + 1}</td>
                  <td>{sanitize(row.rollNumber) || '—'}</td>
                  <td className="text-start">
                    <strong>{sanitize(row.studentName) || '—'}</strong>
                  </td>
                  <td className="text-start">{sanitize(row.companyAndLocation) || '—'}</td>
                  <td>{sanitize(row.fromDate) || '—'}</td>
                  <td>{sanitize(row.toDate) || '—'}</td>
                  <td>
                    {sanitize(row.duration) ? (
                      <span className="badge bg-secondary">{sanitize(row.duration)}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{sanitize(row.stipend) || '—'}</td>
                  <td className="text-start">{sanitize(row.internshipType) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PlacementInternshipDetail;
