import React, { useState, useEffect } from 'react';
import { client } from '../lib/sanityClient';

const sanitize = (str) => {
  if (!str) return '';
  return str
    .replace(/^[\uFEFF\u200B\u200C\u200D\u00A0\u202F\u2060]+/, '')
    .replace(/^[^\u0020-\u007E\u00A1-\u024F\u0900-\u097F]+/, '')
    .trim();
};

// Status badge colour map
const STATUS_COLORS = {
  granted:   { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  published: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  applied:   { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  filed:     { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
};

function statusBadgeStyle(raw) {
  const key = (raw || '').toLowerCase().trim();
  const found = Object.entries(STATUS_COLORS).find(([k]) => key.includes(k));
  const colors = found
    ? found[1]
    : { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  return {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 12,
    background: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: '0.78rem',
    whiteSpace: 'nowrap',
  };
}

/**
 * Nba623PatentDetail — fetches ALL nba623PatentData records and displays them
 * in a single table (no year selection — same pattern as NbaIctDetail).
 * Columns: S.No | Dept | Title of Invention | Patent Application Number | Status | Inventors | Link
 */
function Nba623PatentDetail() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [sortBy, setSortBy]   = useState('none');
  const [search, setSearch]   = useState('');

  useEffect(() => { fetchRows(); }, []);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const query = `*[_type == "nba623PatentData"] | order(sNo asc) {
        _id,
        sNo,
        dept,
        titleOfInvention,
        patentApplicationNumber,
        status,
        inventors,
        link
      }`;
      const data = await client.fetch(query);
      setRows(data);
      setError(null);
    } catch (err) {
      setError('Failed to load Patent data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayedRows = () => {
    let filtered = [...rows];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.titleOfInvention || '').toLowerCase().includes(q) ||
          (r.dept || '').toLowerCase().includes(q) ||
          (r.inventors || '').toLowerCase().includes(q) ||
          (r.patentApplicationNumber || '').toLowerCase().includes(q) ||
          (r.status || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'sNo')    filtered.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
    else if (sortBy === 'dept')   filtered.sort((a, b) => (a.dept || '').localeCompare(b.dept || ''));
    else if (sortBy === 'title')  filtered.sort((a, b) => (a.titleOfInvention || '').localeCompare(b.titleOfInvention || ''));
    else if (sortBy === 'status') filtered.sort((a, b) => (a.status || '').localeCompare(b.status || ''));

    return filtered;
  };

  if (loading) return <div className="alert alert-info">Loading Patent data...</div>;

  const displayedRows = getDisplayedRows();

  return (
    <div>
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
        {/* Record count */}
        <span className="section-meta-count">
          {displayedRows.length}{displayedRows.length !== rows.length ? ` / ${rows.length}` : ''} record{rows.length !== 1 ? 's' : ''}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <i
              className="bi bi-search"
              style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}
            />
            <input
              type="text"
              placeholder="Search patents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: 28, paddingRight: 8, paddingTop: 5, paddingBottom: 5,
                border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: '0.82rem', outline: 'none', width: 180,
              }}
            />
          </div>

          {/* Sort */}
          <label className="modal-sort-label" htmlFor="patent-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="patent-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">No Sort</option>
            <option value="sNo">S.No</option>
            <option value="dept">Dept</option>
            <option value="title">Title of Invention</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {rows.length === 0 ? (
        <div className="alert alert-info mt-3">
          No data found. Please import a CSV via Sanity Studio under{' '}
          <em>6.2.3 Faculty Dev. — Patent</em>.
        </div>
      ) : displayedRows.length === 0 ? (
        <div className="alert alert-warning mt-3">No records match your search.</div>
      ) : (
        <div className="table-container section-table-wrap">
          <table className="table table-bordered table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th style={{ width: 55 }}>S.No</th>
                <th style={{ width: 80 }}>Dept</th>
                <th className="text-start" style={{ minWidth: 220 }}>Title of Invention</th>
                <th style={{ minWidth: 160 }}>Patent Application Number</th>
                <th style={{ width: 110 }}>Status</th>
                <th className="text-start" style={{ minWidth: 200 }}>
                  Name of Inventors / Dept (KEC Alone)
                </th>
                <th style={{ width: 80 }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{row.sNo ?? idx + 1}</td>
                  <td>
                    {sanitize(row.dept) ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px', borderRadius: 8,
                        background: '#ede9fe', color: '#5b21b6',
                        fontWeight: 700, fontSize: '0.78rem',
                      }}>
                        {sanitize(row.dept)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="text-start">
                    <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                      {sanitize(row.titleOfInvention) || '—'}
                    </strong>
                  </td>
                  <td style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#0369a1' }}>
                    {sanitize(row.patentApplicationNumber) || '—'}
                  </td>
                  <td>
                    {sanitize(row.status) ? (
                      <span style={statusBadgeStyle(row.status)}>
                        {sanitize(row.status)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="text-start" style={{ fontSize: '0.82rem', color: '#475569' }}>
                    {sanitize(row.inventors) || '—'}
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

export default Nba623PatentDetail;
