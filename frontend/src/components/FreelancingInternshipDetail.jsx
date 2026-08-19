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
 * FreelancingInternshipDetail — fetches records for a specific year document.
 * Columns: S.No | Roll No. | Name | Year | Section | Start Date | End Date |
 *          Total Duration | Company Detail | Offer Letter | Completion
 */
function FreelancingInternshipDetail({ parentDocId, onBack, yearLabel }) {
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
      const query = `*[_type == "freelancingInternshipData" && parent._ref == $parentDocId] | order(sNo asc) {
        _id,
        sNo,
        rollNo,
        studentName,
        year,
        section,
        startDate,
        endDate,
        totalDuration,
        companyDetail,
        offerLetterLink,
        completionLink
      }`;
      const data = await client.fetch(query, { parentDocId });
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load freelancing internship data.');
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
    else if (sortBy === 'roll')    sorted.sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || ''));
    else if (sortBy === 'section') sorted.sort((a, b) => (a.section || '').localeCompare(b.section || ''));
    else if (sortBy === 'company') sorted.sort((a, b) => (a.companyDetail || '').localeCompare(b.companyDetail || ''));
    return sorted;
  };

  if (loading) {
    return <div className="cse-loader-container"><div className="cse-loader-text">CSE</div></div>;
  }

  const sortedRows = getSortedRows();

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex align-items-center mb-2">
        <button className="btn btn-outline-secondary me-3" onClick={onBack}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
        <h4 className="mb-0">Freelancing Internship — {yearLabel}</h4>
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
          <label className="modal-sort-label" htmlFor="fi-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="fi-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">No Sort</option>
            <option value="name">Name</option>
            <option value="sNo">S.No</option>
            <option value="roll">Roll No.</option>
            <option value="section">Section</option>
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
                <th>Roll No.</th>
                <th className="text-start">Name</th>
                <th>Year</th>
                <th>Section</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration</th>
                <th className="text-start">Company</th>
                <th>Offer Letter</th>
                <th>Completion</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{row.sNo ?? idx + 1}</td>
                  <td>{sanitize(row.rollNo) || '—'}</td>
                  <td className="text-start">
                    <strong>{sanitize(row.studentName) || '—'}</strong>
                  </td>
                  <td>{sanitize(row.year) || '—'}</td>
                  <td>{sanitize(row.section) || '—'}</td>
                  <td>{sanitize(row.startDate) || '—'}</td>
                  <td>{sanitize(row.endDate) || '—'}</td>
                  <td>
                    {sanitize(row.totalDuration) ? (
                      <span className="badge bg-secondary">{sanitize(row.totalDuration)}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-start">{sanitize(row.companyDetail) || '—'}</td>
                  <td>
                    {sanitize(row.offerLetterLink) ? (
                      <a
                        href={sanitize(row.offerLetterLink)}
                        target="_blank"
                        rel="noreferrer"
                        className="cert-link-badge"
                      >
                        <i className="bi bi-file-earmark-text me-1"></i>View
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {sanitize(row.completionLink) ? (
                      <a
                        href={sanitize(row.completionLink)}
                        target="_blank"
                        rel="noreferrer"
                        className="cert-link-badge"
                      >
                        <i className="bi bi-patch-check me-1"></i>View
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

export default FreelancingInternshipDetail;
