import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../lib/sanityClient';

const sanitize = (str) => {
  if (!str) return '';
  return str
    .replace(/^[\uFEFF\u200B\u200C\u200D\u00A0\u202F\u2060]+/, '')
    .trim();
};

/**
 * InfospringDetail
 * Props:
 *   yearId    — _id of the infospringYear document
 *   yearLabel — display label for the year
 *   onBack    — callback to go back to year list
 *
 * Shows one big card per coordinator document linked to the year.
 * Clicking a card opens a modal showing the student list table.
 */
function InfospringDetail({ yearId, yearLabel, onBack }) {
  const [coords, setCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [modalCoord, setModalCoord] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('none');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all coordinator documents for this year
  const fetchCoords = useCallback(async () => {
    try {
      setLoading(true);
      const query = `*[_type == "infospringCoord" && year._ref == $yearId] | order(coordinatorName asc) {
        _id,
        courseCode,
        courseNameCurriculum,
        courseTitleSpringboard,
        courseDuration,
        coordinatorName,
        coordinatorEmail,
        coordinatorPhone,
        dataCount,
        csvImportedAt
      }`;
      const data = await client.fetch(query, { yearId });
      setCoords(data);
      setError(null);
    } catch (err) {
      setError('Failed to load coordinator data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [yearId]);

  useEffect(() => {
    fetchCoords();
  }, [fetchCoords]);

  // When a card is clicked, fetch its student rows
  const openModal = async (coord) => {
    setModalCoord(coord);
    setStudents([]);
    setSortBy('none');
    setSearchTerm('');
    setStudentsLoading(true);
    try {
      const query = `*[_type == "infospringData" && coordinator._ref == $coordId] | order(sNo asc) {
        _id,
        sNo,
        registerNumber,
        name,
        certDriveLink
      }`;
      const data = await client.fetch(query, { coordId: coord._id });
      setStudents(data);
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const closeModal = () => setModalCoord(null);

  // Escape key closes modal
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const getSortedFiltered = () => {
    let rows = [...students];
    if (searchTerm.trim()) {
      const s = searchTerm.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(s) ||
          (r.registerNumber || '').toLowerCase().includes(s)
      );
    }
    if (sortBy === 'name') rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'reg') rows.sort((a, b) => (a.registerNumber || '').localeCompare(b.registerNumber || ''));
    return rows;
  };

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" role="status" />
        <span>Loading coordinator data...</span>
      </div>
    );
  }

  const BRAND_COLOR = '#0f4c81';
  const BRAND_GRADIENT = ['#0f4c81', '#1a73e8'];
  const BRAND_LIGHT = '#e8f0fe';

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Back button + heading ─────────────────────────────────── */}
      <div className="d-flex align-items-center mb-4" style={{ gap: '1rem' }}>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={onBack}
          style={{ borderRadius: 8 }}
        >
          <i className="bi bi-arrow-left me-1" />Back
        </button>
        <div>
          <h4 style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>
            <i className="bi bi-award-fill me-2" style={{ color: BRAND_COLOR }} />
            Infosys Springboard Certification — {yearLabel}
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            {coords.length} course coordinator{coords.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {coords.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2" />
          No coordinator documents found for this year. In Sanity Studio, create an{' '}
          <strong>Infosys Springboard — Course Coordinator</strong> document and set its year to{' '}
          <strong>{yearLabel}</strong>.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {coords.map((coord) => (
            <CoordCard
              key={coord._id}
              coord={coord}
              brandColor={BRAND_COLOR}
              brandGradient={BRAND_GRADIENT}
              brandLight={BRAND_LIGHT}
              onClick={() => openModal(coord)}
            />
          ))}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────── */}
      {modalCoord && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              animation: 'infospringModalIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                background: `linear-gradient(135deg, ${BRAND_GRADIENT[0]}, ${BRAND_GRADIENT[1]})`,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    width: 38, height: 38,
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="bi bi-person-workspace" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
                    {sanitize(modalCoord.coordinatorName)}
                  </h4>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.2rem' }}>
                    {sanitize(modalCoord.courseCode)} · {sanitize(modalCoord.courseNameCurriculum)}
                  </div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.75, marginTop: '0.1rem' }}>
                    {students.length} student record{students.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
              {studentsLoading ? (
                <div className="alert alert-info d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" role="status" />
                  <span>Loading student records...</span>
                </div>
              ) : students.length === 0 ? (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2" />
                  No student records found. Upload a CSV in Sanity Studio and publish this coordinator document.
                </div>
              ) : (
                <>
                  {/* Controls */}
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
                      {getSortedFiltered().length} / {students.length} record{students.length !== 1 ? 's' : ''}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Search */}
                      <div style={{ position: 'relative' }}>
                        <i
                          className="bi bi-search"
                          style={{
                            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                            color: '#94a3b8', fontSize: '0.8rem',
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Search name or reg no..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            paddingLeft: 28, paddingRight: 10, paddingTop: 5, paddingBottom: 5,
                            border: '1px solid #e2e8f0', borderRadius: 8,
                            fontSize: '0.8rem', outline: 'none', width: 190,
                          }}
                        />
                      </div>
                      {/* Sort */}
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="modal-sort-select"
                      >
                        <option value="none">No Sort</option>
                        <option value="name">Sort by Name</option>
                        <option value="reg">Sort by Reg No</option>
                      </select>
                    </div>
                  </div>

                  <StudentTable rows={getSortedFiltered()} brandColor={BRAND_COLOR} />
                </>
              )}
            </div>
          </div>

          <style>{`
            @keyframes infospringModalIn {
              from { opacity: 0; transform: scale(0.97) translateY(12px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

/* ── Coordinator Card ──────────────────────────────────────────────────────── */
function CoordCard({ coord, brandColor, brandGradient, brandLight, onClick }) {
  const [hovered, setHovered] = useState(false);

  const InfoRow = ({ icon, label, value }) =>
    value ? (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.3rem' }}>
        <i
          className={`bi ${icon}`}
          style={{ color: brandColor, fontSize: '0.85rem', marginTop: 2, flexShrink: 0 }}
        />
        <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
          <span style={{ color: '#94a3b8', marginRight: '0.25rem' }}>{label}:</span>
          <strong style={{ color: '#1e293b' }}>{value}</strong>
        </div>
      </div>
    ) : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? brandColor + '55' : '#e2e8f0'}`,
        borderLeft: `5px solid ${brandColor}`,
        borderRadius: 14,
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: hovered
          ? `0 8px 28px rgba(15,76,129,0.14)`
          : '0 2px 10px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left: avatar icon */}
        <div
          style={{
            width: 56, height: 56,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${brandGradient[0]}, ${brandGradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '1.5rem', flexShrink: 0,
          }}
        >
          <i className="bi bi-person-workspace" />
        </div>

        {/* Right: details */}
        <div style={{ flex: 1, minWidth: 260 }}>
          {/* Coordinator name + student count badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
            <h5 style={{ margin: 0, color: '#1e293b', fontWeight: 700, fontSize: '1.05rem' }}>
              {sanitize(coord.coordinatorName) || '—'}
            </h5>
            <span
              style={{
                background: brandLight,
                color: brandColor,
                padding: '2px 10px',
                borderRadius: 12,
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              <i className="bi bi-people-fill me-1" />
              {coord.dataCount ?? 0} student{coord.dataCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Course info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0 2rem' }}>
            <InfoRow icon="bi-hash"          label="Course Code"       value={sanitize(coord.courseCode)} />
            <InfoRow icon="bi-book"          label="Course (Curriculum)" value={sanitize(coord.courseNameCurriculum)} />
            <InfoRow icon="bi-mortarboard"   label="Springboard Title"  value={sanitize(coord.courseTitleSpringboard)} />
            <InfoRow icon="bi-clock"         label="Duration"           value={sanitize(coord.courseDuration)} />
            <InfoRow icon="bi-envelope"      label="Email"              value={sanitize(coord.coordinatorEmail)} />
            <InfoRow icon="bi-telephone"     label="Phone"              value={sanitize(coord.coordinatorPhone)} />
          </div>
        </div>

        {/* Arrow indicator */}
        <div style={{ color: brandColor, fontSize: '1.4rem', opacity: hovered ? 0.9 : 0.4, transition: 'opacity 0.2s', alignSelf: 'center' }}>
          <i className="bi bi-chevron-right" />
        </div>
      </div>
    </div>
  );
}

/* ── Student Table ─────────────────────────────────────────────────────────── */
function StudentTable({ rows, brandColor }) {
  if (rows.length === 0) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-search me-2" />
        No matching students found.
      </div>
    );
  }

  return (
    <div className="table-container section-table-wrap">
      <table className="table table-bordered table-hover align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th style={{ width: 60 }}>S.No</th>
            <th style={{ minWidth: 130 }}>Register Number</th>
            <th className="text-start" style={{ minWidth: 200 }}>Student Name</th>
            <th style={{ width: 90 }}>Certificate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row._id || idx}>
              {/* S.No */}
              <td>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '50%',
                    background: brandColor + '20', color: brandColor,
                    fontWeight: 700, fontSize: '0.78rem',
                  }}
                >
                  {row.sNo ?? idx + 1}
                </span>
              </td>

              {/* Register Number */}
              <td>
                <code style={{ fontSize: '0.82rem', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                  {sanitize(row.registerNumber) || '—'}
                </code>
              </td>

              {/* Name */}
              <td className="text-start">
                <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                  {sanitize(row.name) || '—'}
                </strong>
              </td>

              {/* Certificate link */}
              <td>
                {row.certDriveLink ? (
                  <a
                    href={sanitize(row.certDriveLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cert-link-badge"
                    onClick={(e) => e.stopPropagation()}
                    title="View Certificate"
                  >
                    <i className="bi bi-box-arrow-up-right me-1" />
                    View
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
  );
}

export default InfospringDetail;
