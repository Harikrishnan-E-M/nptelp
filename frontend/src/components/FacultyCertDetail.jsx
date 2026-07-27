import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

/**
 * Strip BOM, invisible Unicode chars, and any garbage before the first
 * normal printable character. Handles UTF-8 BOM artifacts that may be
 * stored in Sanity from an earlier import (e.g. ＿ before "Swayam-NPTEL").
 */
const sanitize = (str) => {
  if (!str) return '';
  // Remove BOM and common invisible chars from anywhere in the string start
  return str
    .replace(/^[\uFEFF\u200B\u200C\u200D\u00A0\u202F\u2060]+/, '') // strip invisible
    .replace(/^[^\u0020-\u007E\u00A1-\u024F\u0900-\u097F]+/, '') // strip non-printable
    .trim();
};

function FacultyCertDetail({ docId, yearLabel, onBack }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line
  }, [docId]);

  const fetchRows = async () => {
    try {
      setLoading(true);

      // Fetch year-level stats
      const metaQuery = `*[_type == "facultyCertification" && _id == $docId][0]{
        totalFaculty,
        completedCount,
        yearLabel
      }`;
      const metaData = await client.fetch(metaQuery, { docId });
      setMeta(metaData);

      // Fetch all rows for this year
      const rowQuery = `*[_type == "facultyCertData" && year._ref == $docId] | order(name asc) {
        _id,
        name,
        courseName,
        agency,
        grade
      }`;
      const data = await client.fetch(rowQuery, { docId });
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load faculty certification data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedRows = () => {
    const sorted = [...rows];
    if (sortBy === 'name') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'course') {
      sorted.sort((a, b) => (a.courseName || '').localeCompare(b.courseName || ''));
    } else if (sortBy === 'mark') {
      // Numeric descending — highest mark at top; non-numeric grades go to the bottom
      sorted.sort((a, b) => {
        const aNum = parseFloat(a.grade);
        const bNum = parseFloat(b.grade);
        const aValid = !isNaN(aNum);
        const bValid = !isNaN(bNum);
        if (aValid && bValid) return bNum - aNum;   // both numeric: highest first
        if (aValid) return -1;                       // a numeric, b not: a goes up
        if (bValid) return 1;                        // b numeric, a not: b goes up
        return (a.grade || '').localeCompare(b.grade || ''); // both non-numeric: alpha
      });
    }
    return sorted;
  };

  if (loading) {
    return <div className="alert alert-info">Loading faculty data...</div>;
  }

  const sortedRows = getSortedRows();

  return (
    <div>
      {/* Top bar */}
      <div
        className="detail-top-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline-secondary" onClick={onBack}>
            <i className="bi bi-arrow-left me-2"></i>Back to Faculty Certification
          </button>
          <h2 className="detail-top-title" style={{ margin: 0 }}>
            <i className="bi bi-award me-2"></i>Faculty Certification — {meta?.yearLabel || yearLabel}
          </h2>
        </div>

        {/* Sort control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="modal-sort-label" htmlFor="faculty-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="faculty-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="course">Course</option>
            <option value="mark">Mark</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      {meta && (
        <div className="section-meta-bar" style={{ marginBottom: '1rem' }}>
          <span className="section-meta-year">
            <i className="bi bi-calendar2 me-1"></i>{meta.yearLabel || yearLabel}
          </span>
          <span className="faculty-stat-pill faculty-inline-pill">
            <i className="bi bi-people me-1"></i>
            Total Faculty: <strong className="ms-1">{meta.totalFaculty ?? '—'}</strong>
          </span>
          <span className="faculty-stat-pill faculty-inline-pill faculty-stat-pill--completed">
            <i className="bi bi-patch-check me-1"></i>
            Completed: <strong className="ms-1">{meta.completedCount ?? '—'}</strong>
          </span>
        </div>
      )}

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {rows.length === 0 ? (
        <div className="alert alert-info mt-3">
          No data found for this year. Please import a CSV via Sanity Studio.
        </div>
      ) : (
        <div className="table-container section-table-wrap">
          <table className="table table-bordered table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th className="text-center">#</th>
                <th className="text-center">Name of Faculty</th>
                <th className="text-center">Name of Course Passed</th>
                <th className="text-center">Course Offered By</th>
                <th className="text-center">Grade / Mark</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{idx + 1}</td>
                  <td className="text-start">
                    <strong>{sanitize(row.name) || '—'}</strong>
                  </td>
                  <td className="text-start">{sanitize(row.courseName) || '—'}</td>
                  <td>{sanitize(row.agency) || '—'}</td>
                  <td>
                    {sanitize(row.grade) ? sanitize(row.grade) : <span className="text-muted">—</span>}
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

export default FacultyCertDetail;
