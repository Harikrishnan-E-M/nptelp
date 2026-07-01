import React, { useState } from 'react';
import { client } from '../lib/sanityClient';

function Statistics({ year, onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, elite-gold, elite-silver, elite, successfully-completed
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);
  const [modalSort, setModalSort] = useState('rollno');

  React.useEffect(() => {
    fetchStatistics();
  }, [year._id]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const query = `*[_type == "nptelData" && year._ref == $yearId] {
        _id,
        batch,
        regNo,
        name,
        semester,
        courseCode,
        courseTitle,
        credit,
        score,
        examMonth,
        examYear,
        certId,
        proofUrl,
        status
      }`;
      const data = await client.fetch(query, { yearId: year._id });
      setStats({ data });
      setError(null);
    } catch (err) {
      setError('Failed to load data from Sanity.');
      console.error(err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };


  const calculateStats = () => {
    if (!stats || !stats.data) return null;
    
    const data = stats.data;
    const total = data.length;
    
    // Elite + Gold: Score >= 90
    const eliteGold = data.filter(item => parseFloat(item.score) >= 90).length;
    
    // Elite + Silver: Score >= 75 and < 90
    const eliteSilver = data.filter(item => parseFloat(item.score) >= 75 && parseFloat(item.score) < 90).length;
    
    // Elite: Score >= 60 and < 75
    const elite = data.filter(item => parseFloat(item.score) >= 60 && parseFloat(item.score) < 75).length;
    
    // Successfully Completed: Score >= 40 and < 60
    const successfullyCompleted = data.filter(item => parseFloat(item.score) >= 40 && parseFloat(item.score) < 60).length;
    
    return {
      total,
      eliteGold,
      eliteSilver,
      elite,
      successfullyCompleted
    };
  };

  const getCategoryLabel = (type) => {
    if (type === 'elite-gold') return 'Elite + Gold';
    if (type === 'elite-silver') return 'Elite + Silver';
    if (type === 'elite') return 'Elite';
    if (type === 'successfully-completed') return 'Successfully Completed';
    return 'Total Students';
  };

  const filterByCategory = (data, type) => {
    if (type === 'all') return data;
    if (type === 'elite-gold') return data.filter(item => parseFloat(item.score) >= 90);
    if (type === 'elite-silver') return data.filter(item => parseFloat(item.score) >= 75 && parseFloat(item.score) < 90);
    if (type === 'elite') return data.filter(item => parseFloat(item.score) >= 60 && parseFloat(item.score) < 75);
    if (type === 'successfully-completed') return data.filter(item => parseFloat(item.score) >= 40 && parseFloat(item.score) < 60);
    return data;
  };

  const getFilteredData = () => {
    if (!stats || !stats.data) return [];
    return filterByCategory(stats.data, filterType);
  };

  const openModal = (title, data) => {
    setModalTitle(title);
    setModalData([...data].sort((a, b) => (a.regNo || '').localeCompare(b.regNo || '', undefined, { numeric: true, sensitivity: 'base' })));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFilterType('all'); // Reset to 'all' when closing modal
    setModalSort('rollno'); // Reset sort when closing modal
  };

  const getSortedModalData = () => {
    const data = [...modalData];
    if (modalSort === 'none') return data;
    if (modalSort === 'name') {
      return data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    if (modalSort === 'rollno') {
      return data.sort((a, b) => (a.regNo || '').localeCompare(b.regNo || '', undefined, { numeric: true, sensitivity: 'base' }));
    }
    if (modalSort === 'marks') {
      return data.sort((a, b) => parseFloat(b.score || 0) - parseFloat(a.score || 0));
    }
    if (modalSort === 'coursecode') {
      return data.sort((a, b) => {
        const codeCompare = (a.courseCode || '').localeCompare(b.courseCode || '', undefined, { numeric: true, sensitivity: 'base' });
        if (codeCompare !== 0) return codeCompare;
        return parseFloat(b.score || 0) - parseFloat(a.score || 0);
      });
    }
    return data;
  };

  const handleCardClick = (type) => {
    setFilterType(type);
    if (stats && stats.data) {
      openModal(`${getCategoryLabel(type)} - ${year.yearLabel}`, filterByCategory(stats.data, type));
    }
  };

  const calculateCourseStats = () => {
    if (!stats || !stats.data) return [];

    const grouped = stats.data.reduce((acc, item) => {
      const key = item.courseCode || 'Unknown';
      if (!acc[key]) {
        acc[key] = {
          courseCode: item.courseCode || 'Unknown',
          courseTitle: item.courseTitle || '-',
          credit: item.credit || '-',
          examPeriod: item.examMonth && item.examYear ? `${item.examMonth} ${item.examYear}` : '-',
          total: 0,
        };
      }
      acc[key].total += 1;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) =>
      (a.courseCode || '').localeCompare(b.courseCode || '', undefined, { numeric: true, sensitivity: 'base' })
    );
  };

  const handleCourseRowClick = (courseCode) => {
    if (!stats || !stats.data) return;
    const courseData = stats.data.filter(item => (item.courseCode || 'Unknown') === courseCode);
    openModal(`Course: ${courseCode} — ${year.yearLabel}`, courseData);
  };

  const calculateBatchStats = () => {
    if (!stats || !stats.data) return [];

    const grouped = stats.data.reduce((acc, item) => {
      const batchKey = item.batch || 'Unknown';
      if (!acc[batchKey]) {
        acc[batchKey] = {
          batch: batchKey,
          total: 0,
          eliteGold: 0,
          eliteSilver: 0,
          elite: 0,
          successfullyCompleted: 0,
        };
      }

      acc[batchKey].total += 1;
      const scoreNum = parseFloat(item.score);
      if (scoreNum >= 90) acc[batchKey].eliteGold += 1;
      else if (scoreNum >= 75) acc[batchKey].eliteSilver += 1;
      else if (scoreNum >= 60) acc[batchKey].elite += 1;
      else if (scoreNum >= 40) acc[batchKey].successfullyCompleted += 1;

      return acc;
    }, {});

    return Object.values(grouped);
  };

  const renderBatchBar = (label, value, colorClass, onClick) => {
    const widthPercent = (value / maxBatchTotal) * 100;
    
    // Smart width calculation: 
    // 0 stays 0%, small values get minimum visibility (3%), others show proportionally
    let displayWidth = widthPercent;
    if (value > 0 && widthPercent < 3) {
      displayWidth = 3; // Minimum 3% for non-zero values
    } else if (value === 0) {
      displayWidth = 0; // Zero stays zero
    }
    
    return (
      <div 
        className="batch-bar-row" 
        onClick={onClick}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
      >
        <div className="batch-bar-label">{label}</div>
        <div className="batch-bar-wrapper">
          <div className="batch-bar-value-badge">{value}</div>
          <div className="batch-bar-track">
            <div
              className={`batch-bar-fill ${colorClass}`}
              style={{ width: `${displayWidth}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const handleBatchBarClick = (batch, type) => {
    if (!stats || !stats.data) return;
    const batchData = stats.data.filter(item => (item.batch || 'Unknown') === batch);
    const filtered = filterByCategory(batchData, type);
    openModal(`${batch} - ${getCategoryLabel(type)} (${year.yearLabel})`, filtered);
  };

  const filteredData = getFilteredData();
  const calculatedStats = calculateStats();
  const courseStats = calculateCourseStats();
  const batchStats = calculateBatchStats();
  const maxBatchTotal = batchStats.length > 0 ? Math.max(...batchStats.map(item => item.total), 1) : 1;
  
  const getStatusClass = (status) => {
    if (status === 'Accepted') return 'status-success';
    if (status === 'Rejected') return 'status-rejected';
    if (status === 'Pending') return 'status-pending';
    return 'status-na';
  };

  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty('--mouse-x', '50%');
    card.style.setProperty('--mouse-y', '50%');
  };

  if (loading) {
    return <div className="alert alert-info">Loading statistics...</div>;
  }

  return (
    <div>
      <button className="btn btn-outline-secondary mb-3" onClick={onBack}>
        <i className="bi bi-arrow-left me-2"></i>Back to Years
      </button>

      <h2 className="year-heading-center">{year.yearLabel}</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* No data message */}
      {stats && stats.data && stats.data.length === 0 && (
        <div className="alert alert-info mt-3">
          <strong>No data found for {year.yearLabel}.</strong><br />
          Please go to <a href="/sanity" target="_blank" rel="noreferrer"><strong>Sanity Studio → Academic Year</strong></a>, open this year's document, and click <strong>"📥 Import CSV Data"</strong> to load the CSV.
        </div>
      )}

      {/* Statistics Cards */}
      {calculatedStats && (

        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div 
              className={`stat-card ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => handleCardClick('all')}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-title">Total Students</div>
              <div className="stat-value text-primary">{calculatedStats.total}</div>
              <div className="stat-subtitle">All Batches</div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6 mb-3">
            <div 
              className={`stat-card ${filterType === 'elite-gold' ? 'active' : ''}`}
              onClick={() => handleCardClick('elite-gold')}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-title">Elite + Gold</div>
              <div className="stat-value text-warning">{calculatedStats.eliteGold}</div>
              <div className="stat-subtitle">Highest Achievers</div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6 mb-3">
            <div 
              className={`stat-card ${filterType === 'elite-silver' ? 'active' : ''}`}
              onClick={() => handleCardClick('elite-silver')}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-title">Elite + Silver</div>
              <div className="stat-value text-info">{calculatedStats.eliteSilver}</div>
              <div className="stat-subtitle">Silver Medalists</div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6 mb-3">
            <div 
              className={`stat-card ${filterType === 'elite' ? 'active' : ''}`}
              onClick={() => handleCardClick('elite')}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-title">Elite</div>
              <div className="stat-value text-success">{calculatedStats.elite}</div>
              <div className="stat-subtitle">Elite Achievers</div>
            </div>
          </div>
        </div>
      )}
<br></br>

      {/* Course-wise Summary Table */}
      {courseStats.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="mb-3">Course-wise Summary</h5>
            <div className="table-container">
              <table className="table table-bordered table-hover align-middle text-center" style={{ cursor: 'pointer' }}>
                <thead className="table-dark">
                  <tr>
                    <th className="text-center">#</th>
                    <th className="text-center">Course Code</th>
                    <th className="text-center">Course Name</th>
                    <th className="text-center">Credits</th>
                    <th className="text-center">Exam Period</th>
                    <th className="text-center">Total Students</th>
                  </tr>
                </thead>
                <tbody>
                  {courseStats.map((course, index) => (
                    <tr
                      key={course.courseCode}
                      onClick={() => handleCourseRowClick(course.courseCode)}
                      title={`Click to view all students in ${course.courseCode}`}
                    >
                      <td>{index + 1}</td>
                      <td><strong>{course.courseCode}</strong></td>
                      <td>{course.courseTitle}</td>
                      <td>{course.credit}</td>
                      <td>{course.examPeriod}</td>
                      <td>
                        <span className="badge bg-primary rounded-pill">{course.total}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

<br></br>
      {/* Batch-wise Statistics Chart */}
      {calculatedStats && batchStats.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="mb-3">Batch-wise Statistics (with Total Benefitted)</h5>
            <div className="batch-summary">
              Total Students Benefitted: <strong>{calculatedStats.total}</strong> across <strong>{batchStats.length}</strong> batches
            </div>



            <div className="batch-chart">
              {batchStats.map((batch) => (
                <div key={batch.batch} className="batch-row">
                  <div className="batch-label">{batch.batch}</div>
                  <div className="batch-bars">
                    {renderBatchBar('Total Students Benefitted', batch.total, 'bg-primary', () => handleBatchBarClick(batch.batch, 'all'))}
                    {renderBatchBar('Elite + Gold', batch.eliteGold, 'bg-warning', () => handleBatchBarClick(batch.batch, 'elite-gold'))}
                    {renderBatchBar('Elite + Silver', batch.eliteSilver, 'bg-secondary', () => handleBatchBarClick(batch.batch, 'elite-silver'))}
                    {renderBatchBar('Elite', batch.elite, 'bg-success', () => handleBatchBarClick(batch.batch, 'elite'))}
                    {renderBatchBar('Successfully Completed', batch.successfullyCompleted, 'bg-info', () => handleBatchBarClick(batch.batch, 'successfully-completed'))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
<br></br>
      

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-block">
                <h5 className="mb-0">{modalTitle}</h5>
                <span className="modal-subtitle">{modalData.length} students</span>
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
                    <option value="none">None</option>
                    <option value="name">Name</option>
                    <option value="rollno">Roll No</option>
                    <option value="marks">Marks</option>
                    <option value="coursecode">Course Code</option>
                  </select>
                </div>
              </div>
              <div className="table-container modal-table">
                <table className="table table-bordered table-striped align-middle text-center">
                  <thead>
                    <tr>
                      <th className="text-center">#</th>
                      <th className="text-center">Batch</th>
                      <th className="text-center">Reg No</th>
                      <th className="text-center">Name</th>
                      <th className="text-center">Sem</th>
                      <th className="text-center">Course Code</th>
                      <th className="text-center">Course Title</th>
                      <th className="text-center">Credit</th>
                      <th className="text-center">Score</th>
                      <th className="text-center">Exam</th>
                      <th className="text-center">Cert ID</th>
                      <th className="text-center">Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedModalData().map((item, index) => (
                      <tr
                        key={item._id}
                        onClick={() => item.proofUrl && window.open(item.proofUrl, '_blank', 'noreferrer')}
                        style={{ cursor: item.proofUrl ? 'pointer' : 'default' }}
                        title={item.proofUrl ? 'Click to view certificate' : 'No certificate available'}
                      >
                        <td>{index + 1}</td>
                        <td>{item.batch}</td>
                        <td>{item.regNo}</td>
                        <td>{item.name}</td>
                        <td>{item.semester}</td>
                        <td>{item.courseCode}</td>
                        <td>{item.courseTitle}</td>
                        <td>{item.credit}</td>
                        <td>{item.score}</td>
                        <td>{item.examMonth} {item.examYear}</td>
                        <td>{item.certId}</td>
                        <td>
                          {item.proofUrl ? (
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

export default Statistics;
