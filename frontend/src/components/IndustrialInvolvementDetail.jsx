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
 * IndustrialInvolvementDetail — fetches the single Industrial Involvement document
 * and displays a year/count summary table above the main data table.
 * CSV columns: S.No | Date | Industry Expert | Designation | Course Name | Link
 */
function IndustrialInvolvementDetail() {
  const [rows, setRows] = useState([]);
  const [yearSummary, setYearSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('none');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch the parent document (for year summary)
      const parentQuery = `*[_type == "industrialInvolvement"][0]{
        _id,
        yearSummary
      }`;
      const parentDoc = await client.fetch(parentQuery);

      // Fetch row data linked to the parent doc
      let rowData = [];
      if (parentDoc?._id) {
        const dataQuery = `*[_type == "industrialInvolvementData" && parent._ref == $parentId] | order(sNo asc) {
          _id,
          sNo,
          date,
          industryExpert,
          designation,
          courseName,
          driveLink
        }`;
        rowData = await client.fetch(dataQuery, { parentId: parentDoc._id });
      }

      setYearSummary(parentDoc?.yearSummary || []);
      setRows(rowData);
      setError(null);
    } catch (err) {
      setError('Failed to load industrial involvement data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayedRows = () => {
    const sorted = [...rows];
    if (sortBy === 'none') return sorted;
    if (sortBy === 'sNo') sorted.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
    else if (sortBy === 'expert') sorted.sort((a, b) => (a.industryExpert || '').localeCompare(b.industryExpert || ''));
    else if (sortBy === 'course') sorted.sort((a, b) => (a.courseName || '').localeCompare(b.courseName || ''));
    else if (sortBy === 'date') sorted.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return sorted;
  };

  if (loading) {
    return <div className="alert alert-info">Loading industrial involvement data...</div>;
  }

  const displayedRows = getDisplayedRows();

  return (
    <div>
      {error && <div className="alert alert-danger mt-2">{error}</div>}

      {/* ── Year-wise Summary Table ── */}
      {yearSummary.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
          <table
            className="table table-bordered align-middle text-center"
            style={{ width: 'auto' }}
          >
            <tbody>
              {/* Year row */}
              <tr>
                <th style={{ whiteSpace: 'nowrap', backgroundColor: '#c8f5c8', color: '#000000ff' }}>Year</th>
                {yearSummary.map((entry, idx) => (
                  <td key={idx}>{entry.year || '—'}</td>
                ))}
              </tr>
              {/* Count row */}
              <tr>
                <th style={{ whiteSpace: 'nowrap', backgroundColor: '#c8f5c8', color: '#000000ff' }}>Count</th>
                {yearSummary.map((entry, idx) => (
                  <td key={idx}><strong>{entry.count ?? '—'}</strong></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

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
          <label className="modal-sort-label" htmlFor="ii-sort" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="bi bi-sort-alpha-down me-1"></i>Sort by:
          </label>
          <select
            id="ii-sort"
            className="modal-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="none">No Sort</option>
            <option value="sNo">S.No</option>
            <option value="date">Date</option>
            <option value="expert">Industry Expert</option>
            <option value="course">Course Name</option>
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
                <th style={{ width: 60 }}>S.No</th>
                <th>Date</th>
                <th className="text-start">Industry Expert</th>
                <th className="text-start">Designation</th>
                <th className="text-start">Course Name</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((row, idx) => (
                <tr key={row._id}>
                  <td>{row.sNo ?? idx + 1}</td>
                  <td>{sanitize(row.date) || '—'}</td>
                  <td className="text-start">
                    <strong>{sanitize(row.industryExpert) || '—'}</strong>
                  </td>
                  <td className="text-start">{sanitize(row.designation) || '—'}</td>
                  <td className="text-start">{sanitize(row.courseName) || '—'}</td>
                  <td>
                    {sanitize(row.driveLink) ? (
                      <a
                        href={sanitize(row.driveLink)}
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

export default IndustrialInvolvementDetail;
