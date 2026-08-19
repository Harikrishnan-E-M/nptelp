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
 * CoCurricularSdgDetail
 * Fetches ALL coCurricularSdgData records and displays them in one table.
 * No year grouping — all rows shown together.
 *
 * Controls:
 *   - Sort by: S.No | Course Code & Title | Type of Learning/Activity
 *   - Show Only: dropdown populated from distinct "typeOfLearning" values in data
 */
function CoCurricularSdgDetail() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [sortBy, setSortBy]   = useState('none');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchRows();
  }, []);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const query = `*[_type == "coCurricularSdgData"] | order(sNo asc) {
        _id,
        sNo,
        courseCodeTitle,
        typeOfLearning,
        relevanceToComplex,
        sdg,
        problemStatement,
        link
      }`;
      const data = await client.fetch(query);
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load co-curricular SDG data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Collect unique "Type of Learning / Activity" values for the filter dropdown
  const uniqueTypes = Array.from(
    new Set(
      rows
        .map((r) => sanitize(r.typeOfLearning))
        .filter(Boolean)
    )
  ).sort();

  const getDisplayedRows = () => {
    let result = [...rows];

    // ── Filter ──────────────────────────────────────────────────────────────
    if (filterType !== 'all') {
      result = result.filter(
        (r) => sanitize(r.typeOfLearning) === filterType
      );
    }

    // ── Sort ────────────────────────────────────────────────────────────────
    if (sortBy === 'sNo') {
      result.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
    } else if (sortBy === 'courseCode') {
      result.sort((a, b) =>
        (a.courseCodeTitle || '').localeCompare(b.courseCodeTitle || '', undefined, {
          numeric: true, sensitivity: 'base',
        })
      );
    } else if (sortBy === 'typeOfLearning') {
      result.sort((a, b) =>
        (a.typeOfLearning || '').localeCompare(b.typeOfLearning || '')
      );
    }

    return result;
  };

  if (loading) {
    return <div className="cse-loader-container"><div className="cse-loader-text">CSE</div></div>;
  }

  const displayedRows = getDisplayedRows();

  return (
    <div>
      {/* ── Controls bar: Show Only + Sort + Record count ── */}
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
          {displayedRows.length} record{displayedRows.length !== 1 ? 's' : ''}
          {filterType !== 'all' && (
            <span style={{ marginLeft: '0.4rem', fontWeight: 400, fontSize: '0.82rem', color: '#64748b' }}>
              (filtered from {rows.length} total)
            </span>
          )}
        </span>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>

          {/* ── Show Only ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label
              className="modal-sort-label"
              htmlFor="cosdg-filter"
              style={{ margin: 0, whiteSpace: 'nowrap' }}
            >
              <i className="bi bi-funnel me-1"></i>Show only:
            </label>
            <select
              id="cosdg-filter"
              className="modal-sort-select"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); }}
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* ── Sort ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label
              className="modal-sort-label"
              htmlFor="cosdg-sort"
              style={{ margin: 0, whiteSpace: 'nowrap' }}
            >
              <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
            </label>
            <select
              id="cosdg-sort"
              className="modal-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="none">No Sort</option>
              <option value="sNo">S.No</option>
              <option value="courseCode">Course Code &amp; Title</option>
              <option value="typeOfLearning">Type of Learning / Activity</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {rows.length === 0 ? (
        <div className="alert alert-info mt-3">
          No data found. Please add records via Sanity Studio (Co-Curricular SDG Data).
        </div>
      ) : displayedRows.length === 0 ? (
        <div className="alert alert-warning mt-3">
          No records match the selected filter. Try a different type.
        </div>
      ) : (
        <div className="table-container section-table-wrap">
          <table className="table table-bordered table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th style={{ width: 55 }}>S.No</th>
                <th className="text-start" style={{ minWidth: 180 }}>Course Code &amp; Title</th>
                <th className="text-start" style={{ minWidth: 160 }}>Type of Learning / Activity</th>
                <th className="text-start" style={{ minWidth: 140 }}>Relevance to Complex Engineering Problems</th>
                <th className="text-start" style={{ minWidth: 120 }}>Sustainable Development Goals</th>
                <th className="text-start" style={{ minWidth: 320 }}>Problem Statement</th>
                <th style={{ width: 100 }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{row.sNo ?? idx + 1}</td>
                  <td className="text-start">
                    <strong>{sanitize(row.courseCodeTitle) || '—'}</strong>
                  </td>
                  <td className="text-start">
                    {sanitize(row.typeOfLearning) ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: 12,
                          background: '#6366f122',
                          color: '#4f46e5',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                        }}
                      >
                        {sanitize(row.typeOfLearning)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-start" style={{ fontSize: '0.85rem' }}>
                    {sanitize(row.relevanceToComplex) || '—'}
                  </td>
                  <td className="text-start" style={{ fontSize: '0.85rem' }}>
                    {sanitize(row.sdg) || '—'}
                  </td>
                  <td className="text-start" style={{ fontSize: '0.85rem' }}>
                    {sanitize(row.problemStatement) || '—'}
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

export default CoCurricularSdgDetail;
