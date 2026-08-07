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
 * NonFormalDetail — fetches nonFormalData records for a specific year document.
 * Columns: Student Name | Roll Number | Section | # Courses | Course 1 | Proof 1 | Course 2 | Proof 2
 */
function NonFormalDetail({ parentDocId, onBack, yearLabel }) {
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
      const query = `*[_type == "nonFormalData" && parent._ref == $parentDocId] | order(studentName asc) {
        _id,
        studentName,
        rollNumber,
        section,
        nonFormalCourseCount,
        courseName1,
        proof1,
        courseName2,
        proof2
      }`;
      const data = await client.fetch(query, { parentDocId });
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load non formal data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedRows = () => {
    const sorted = [...rows];
    if (sortBy === 'none') return sorted;
    if (sortBy === 'name')    sorted.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
    else if (sortBy === 'roll')    sorted.sort((a, b) => (a.rollNumber || '').localeCompare(b.rollNumber || ''));
    else if (sortBy === 'section') sorted.sort((a, b) => (a.section || '').localeCompare(b.section || ''));
    return sorted;
  };

  if (loading) {
    return <div className="alert alert-info">Loading non formal data...</div>;
  }

  const sortedRows = getSortedRows();

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-outline-secondary me-3" onClick={onBack}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
        <h4 className="mb-0">Non Formal Education — {yearLabel}</h4>
      </div>

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
          <label className="modal-sort-label" htmlFor="nf-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="nf-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">No Sort</option>
            <option value="name">Name</option>
            <option value="roll">Roll Number</option>
            <option value="section">Section</option>
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
                <th className="text-start">Student Name</th>
                <th>Roll Number</th>
                <th>Section</th>
                <th>No. of Courses</th>
                <th className="text-start">Course Name 1</th>
                <th>Proof 1</th>
                <th className="text-start">Course Name 2</th>
                <th>Proof 2</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row._id}>
                  <td className="text-start">
                    <strong>{sanitize(row.studentName) || '—'}</strong>
                  </td>
                  <td>{sanitize(row.rollNumber) || '—'}</td>
                  <td>{sanitize(row.section) || '—'}</td>
                  <td>
                    {row.nonFormalCourseCount != null
                      ? row.nonFormalCourseCount
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="text-start">{sanitize(row.courseName1) || '—'}</td>
                  <td>
                    {row.proof1 ? (
                      <a href={row.proof1} target="_blank" rel="noopener noreferrer" title="View Proof 1">
                        <i className="bi bi-box-arrow-up-right"></i>
                      </a>
                    ) : '—'}
                  </td>
                  <td className="text-start">{sanitize(row.courseName2) || '—'}</td>
                  <td>
                    {row.proof2 ? (
                      <a href={row.proof2} target="_blank" rel="noopener noreferrer" title="View Proof 2">
                        <i className="bi bi-box-arrow-up-right"></i>
                      </a>
                    ) : '—'}
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

export default NonFormalDetail;
