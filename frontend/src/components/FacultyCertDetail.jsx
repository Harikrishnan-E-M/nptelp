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
  const [sortBy, setSortBy] = useState('none');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);
  const [modalSort, setModalSort] = useState('name');

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
      const rowQuery = `*[_type == "facultyCertData" && year._ref == $docId] | order(sNo asc) {
        _id,
        sNo,
        name,
        courseName,
        agency,
        grade,
        certificateLink,
        category
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
    if (sortBy === 'none') {
      return sorted; // Already sorted by sNo asc in GROQ query
    }
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

  const getStats = () => {
    let eliteGold = 0;
    let eliteSilver = 0;
    let elite = 0;
    let successfullyCompleted = 0;

    rows.forEach(row => {
      const cat = (row.category || '').toLowerCase().trim();
      if (cat.includes('elite+gold') || cat.includes('elite + gold')) {
        eliteGold++;
      } else if (cat.includes('elite+silver') || cat.includes('elite + silver')) {
        eliteSilver++;
      } else if (cat === 'elite') {
        elite++;
      } else if (cat.includes('successfully completed')) {
        successfullyCompleted++;
      }
    });

    return { eliteGold, eliteSilver, elite, successfullyCompleted };
  };

  const handleCardClick = (type, title) => {
    let filtered = [...rows];
    if (type !== 'all') {
      filtered = rows.filter(row => {
        const cat = (row.category || '').toLowerCase().trim();
        if (type === 'elite-gold') return cat.includes('elite+gold') || cat.includes('elite + gold');
        if (type === 'elite-silver') return cat.includes('elite+silver') || cat.includes('elite + silver');
        if (type === 'elite') return cat === 'elite';
        if (type === 'successfully-completed') return cat.includes('successfully completed');
        return true;
      });
    }
    
    setModalTitle(title);
    setModalData(filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    setModalSort('name');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const getSortedModalData = () => {
    const data = [...modalData];
    if (modalSort === 'none') {
      return data.sort((a, b) => (a.sNo || 0) - (b.sNo || 0));
    }
    if (modalSort === 'name') {
      return data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    if (modalSort === 'course') {
      return data.sort((a, b) => (a.courseName || '').localeCompare(b.courseName || ''));
    }
    if (modalSort === 'mark') {
      data.sort((a, b) => {
        const aNum = parseFloat(a.grade);
        const bNum = parseFloat(b.grade);
        const aValid = !isNaN(aNum);
        const bValid = !isNaN(bNum);
        if (aValid && bValid) return bNum - aNum;
        if (aValid) return -1;
        if (bValid) return 1;
        return (a.grade || '').localeCompare(b.grade || '');
      });
    }
    return data;
  };

  if (loading) {
    return <div className="cse-loader-container"><div className="cse-loader-text">CSE</div></div>;
  }

  const sortedRows = getSortedRows();
  const stats = getStats();

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
            <i className="bi bi-arrow-left me-2"></i>Back to Faculty NPTEL Certification
          </button>
          <h2 className="detail-top-title" style={{ margin: 0 }}>
            <i className="bi bi-calendar2-week me-2"></i>{meta?.yearLabel || yearLabel}
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
            <option value="none">No Sort</option>
            <option value="name">Name</option>
            <option value="course">Course</option>
            <option value="mark">Mark</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {meta && (
        <div className="stats-cards-row mb-4 mt-4">
          <div
            className="stat-card"
            onClick={() => handleCardClick('all', `Total - ${meta?.yearLabel || yearLabel}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-title">Total</div>
            <div className="stat-value text-primary">{rows.length}</div>
            <div className="stat-subtitle">All Entries</div>
          </div>
          <div
            className="stat-card"
            onClick={() => handleCardClick('elite-gold', `Elite + Gold - ${meta?.yearLabel || yearLabel}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-title">Elite + Gold</div>
            <div className="stat-value text-warning">{stats.eliteGold}</div>
            <div className="stat-subtitle">Highest Achievers</div>
          </div>
          <div
            className="stat-card"
            onClick={() => handleCardClick('elite-silver', `Elite + Silver - ${meta?.yearLabel || yearLabel}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-title">Elite + Silver</div>
            <div className="stat-value text-info">{stats.eliteSilver}</div>
            <div className="stat-subtitle">Silver Medalists</div>
          </div>
          <div
            className="stat-card"
            onClick={() => handleCardClick('elite', `Elite - ${meta?.yearLabel || yearLabel}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-title">Elite</div>
            <div className="stat-value text-success">{stats.elite}</div>
            <div className="stat-subtitle">Elite Achievers</div>
          </div>
          <div
            className="stat-card"
            onClick={() => handleCardClick('successfully-completed', `Successfully Completed - ${meta?.yearLabel || yearLabel}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-title">Successfully Completed</div>
            <div className="stat-value text-secondary">{stats.successfullyCompleted}</div>
            <div className="stat-subtitle">Score 40–59</div>
          </div>
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
                <th className="text-center">Category</th>
                <th className="text-center">Certificate</th>
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
                  <td>
                    {sanitize(row.category) ? (
                      <span className="badge bg-light text-dark border">{sanitize(row.category)}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {row.certificateLink ? (
                      <a
                        href={row.certificateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="bi bi-link-45deg"></i> Link
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

      {/* Modal matching Student NPTEL layout */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-block">
                <h5 className="mb-0">{modalTitle}</h5>
                <span className="modal-subtitle">{modalData.length} entries</span>
              </div>
              <button className="btn-close" onClick={closeModal} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="modal-toolbar">
                <span className="modal-chip">Showing {modalData.length} records</span>
                <div className="modal-sort-control">
                  <label htmlFor="modal-sort-select" className="modal-sort-label">Sort by:</label>
                  <select
                    id="modal-sort-select"
                    className="modal-sort-select"
                    value={modalSort}
                    onChange={(e) => setModalSort(e.target.value)}
                  >
                    <option value="none">No Sort</option>
                    <option value="name">Name</option>
                    <option value="course">Course</option>
                    <option value="mark">Mark</option>
                  </select>
                </div>
              </div>
              <div className="table-container modal-table">
                <table className="table table-bordered table-striped align-middle text-center">
                  <thead>
                    <tr>
                      <th className="text-center">#</th>
                      <th className="text-center">Name of Faculty</th>
                      <th className="text-center">Name of Course Passed</th>
                      <th className="text-center">Course Offered By</th>
                      <th className="text-center">Grade / Mark</th>
                      <th className="text-center">Category</th>
                      <th className="text-center">Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedModalData().map((item, index) => (
                      <tr
                        key={item._id}
                        onClick={() => item.certificateLink && window.open(item.certificateLink, '_blank', 'noreferrer')}
                        style={{ cursor: item.certificateLink ? 'pointer' : 'default' }}
                        title={item.certificateLink ? 'Click to view certificate' : 'No certificate available'}
                      >
                        <td>{index + 1}</td>
                        <td className="text-start">
                          <strong>{sanitize(item.name) || '—'}</strong>
                        </td>
                        <td className="text-start">{sanitize(item.courseName) || '—'}</td>
                        <td>{sanitize(item.agency) || '—'}</td>
                        <td>
                          {sanitize(item.grade) ? sanitize(item.grade) : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          {sanitize(item.category) ? (
                            <span className="badge bg-light text-dark border">{sanitize(item.category)}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {item.certificateLink ? (
                            <span className="cert-link-badge">🔗 View</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {modalData.length === 0 && (
                  <div className="p-4 text-center text-muted">
                    No records found for this selection.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyCertDetail;
