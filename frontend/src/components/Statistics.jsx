import React, { useState } from 'react';
import axios from 'axios';

function Statistics({ year, onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, elite-gold, elite-silver, elite, successfully-completed
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);

  React.useEffect(() => {
    fetchStatistics();
  }, [year._id]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/statistics/${year._id}`);
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load statistics');
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
    const eliteGold = data.filter(item => item.score >= 90).length;
    
    // Elite + Silver: Score >= 75 and < 90
    const eliteSilver = data.filter(item => item.score >= 75 && item.score < 90).length;
    
    // Elite: Score >= 60 and < 75
    const elite = data.filter(item => item.score >= 60 && item.score < 75).length;
    
    // Successfully Completed: Score >= 40 and < 60
    const successfullyCompleted = data.filter(item => item.score >= 40 && item.score < 60).length;
    
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
    if (type === 'elite-gold') return data.filter(item => item.score >= 90);
    if (type === 'elite-silver') return data.filter(item => item.score >= 75 && item.score < 90);
    if (type === 'elite') return data.filter(item => item.score >= 60 && item.score < 75);
    if (type === 'successfully-completed') return data.filter(item => item.score >= 40 && item.score < 60);
    return data;
  };

  const getFilteredData = () => {
    if (!stats || !stats.data) return [];
    return filterByCategory(stats.data, filterType);
  };

  const openModal = (title, data) => {
    setModalTitle(title);
    setModalData(data);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleCardClick = (type) => {
    setFilterType(type);
    if (stats && stats.data) {
      openModal(`${getCategoryLabel(type)} - ${year.yearLabel}`, filterByCategory(stats.data, type));
    }
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
      if (item.score >= 90) acc[batchKey].eliteGold += 1;
      else if (item.score >= 75) acc[batchKey].eliteSilver += 1;
      else if (item.score >= 60) acc[batchKey].elite += 1;
      else if (item.score >= 40) acc[batchKey].successfullyCompleted += 1;

      return acc;
    }, {});

    return Object.values(grouped);
  };

  const renderBatchBar = (label, value, colorClass, onClick) => (
    <div className="batch-bar-row" onClick={onClick}>
      <div className="batch-bar-label">{label}</div>
      <div className="batch-bar-track">
        <div
          className={`batch-bar-fill ${colorClass}`}
          style={{ width: `${(value / maxBatchTotal) * 100}%` }}
        >
          <span className="batch-bar-value">{value}</span>
        </div>
      </div>
    </div>
  );

  const handleBatchBarClick = (batch, type) => {
    if (!stats || !stats.data) return;
    const batchData = stats.data.filter(item => (item.batch || 'Unknown') === batch);
    const filtered = filterByCategory(batchData, type);
    openModal(`${batch} - ${getCategoryLabel(type)} (${year.yearLabel})`, filtered);
  };

  const filteredData = getFilteredData();
  const calculatedStats = calculateStats();
  const batchStats = calculateBatchStats();
  const maxBatchTotal = Math.max(...batchStats.map(item => item.total), 1);
  
  const getStatusClass = (status) => {
    if (status === 'Accepted') return 'status-success';
    if (status === 'Rejected') return 'status-rejected';
    if (status === 'Pending') return 'status-pending';
    return 'status-na';
  };

  if (loading) {
    return <div className="alert alert-info">Loading statistics...</div>;
  }

  return (
    <div>
      <button className="btn btn-outline-secondary mb-3" onClick={onBack}>
        <i className="bi bi-arrow-left me-2"></i>Back to Years
      </button>

      <h2 className="page-title mb-4">
        <i className="bi bi-bar-chart-fill me-2"></i>NPTEL Statistics ~ {year.yearLabel}
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Statistics Cards */}
      {calculatedStats && (
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div 
              className={`stat-card ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => handleCardClick('all')}
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
      {/* Academic Year Statistics Chart */}
      {calculatedStats && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="mb-4">Academic Year Statistics</h5>
            <div className="chart-container">
              <div 
                className={`chart-bar ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => handleCardClick('all')}
                style={{ cursor: 'pointer' }}
              >
                <div className="chart-label">Total Students : {calculatedStats.total}</div>
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar-fill bg-primary" 
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
              
              <div 
                className={`chart-bar ${filterType === 'elite-gold' ? 'active' : ''}`}
                onClick={() => handleCardClick('elite-gold')}
                style={{ cursor: 'pointer' }}
              >
                <div className="chart-label">Elite + Gold : {calculatedStats.eliteGold}</div>
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar-fill bg-warning" 
                    style={{ width: `${(calculatedStats.eliteGold / calculatedStats.total * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div 
                className={`chart-bar ${filterType === 'elite-silver' ? 'active' : ''}`}
                onClick={() => handleCardClick('elite-silver')}
                style={{ cursor: 'pointer' }}
              >
                <div className="chart-label">Elite + Silver : {calculatedStats.eliteSilver}</div>
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar-fill bg-secondary" 
                    style={{ width: `${(calculatedStats.eliteSilver / calculatedStats.total * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div 
                className={`chart-bar ${filterType === 'elite' ? 'active' : ''}`}
                onClick={() => handleCardClick('elite')}
                style={{ cursor: 'pointer' }}
              >
                <div className="chart-label">Elite : {calculatedStats.elite}</div>
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar-fill bg-success" 
                    style={{ width: `${(calculatedStats.elite / calculatedStats.total * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div 
                className={`chart-bar ${filterType === 'successfully-completed' ? 'active' : ''}`}
                onClick={() => handleCardClick('successfully-completed')}
                style={{ cursor: 'pointer' }}
              >
                <div className="chart-label">Successfully Completed : {calculatedStats.successfullyCompleted}</div>
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar-fill bg-info" 
                    style={{ width: `${(calculatedStats.successfullyCompleted / calculatedStats.total * 100)}%` }}
                  ></div>
                </div>
              </div>
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

            <div className="batch-legend">
              <span><span className="legend-dot bg-primary"></span> Total Students Benefitted</span>
              <span><span className="legend-dot bg-warning"></span> Elite + Gold</span>
              <span><span className="legend-dot bg-secondary"></span> Elite + Silver</span>
              <span><span className="legend-dot bg-success"></span> Elite</span>
              <span><span className="legend-dot bg-info"></span> Successfully Completed</span>
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
      {/* Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              Student Details 
              {filterType !== 'all' && (
                <span className="badge bg-primary ms-2">
                  {filterType === 'elite-gold' && 'Elite + Gold'}
                  {filterType === 'elite-silver' && 'Elite + Silver'}
                  {filterType === 'elite' && 'Elite'}
                  {filterType === 'successfully-completed' && 'Successfully Completed'}
                </span>
              )}
            </h5>
            {filterType !== 'all' && (
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => handleCardClick('all')}
              >
                Show All
              </button>
            )}
          </div>
          <div className="table-container">
            <table className="table table-bordered table-striped align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Batch</th>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Sem</th>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Credit</th>
                  <th>Score</th>
                  <th>Exam</th>
                  <th>Cert ID</th>
                  <th>Proof</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item._id}>
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
                        <a href={item.proofUrl} target="_blank" rel="noreferrer">View</a>
                      ) : (
                        'NA'
                      )}
                    </td>
                    <td>
                      <span className={`badge-status ${getStatusClass(item.status)}`}>
                        {item.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="p-4 text-center text-muted">
                No records found for this filter.
              </div>
            )}
          </div>
        </div>
      </div>

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
                <span className="modal-hint">Click outside to close</span>
              </div>
              <div className="table-container modal-table">
                <table className="table table-bordered table-striped align-middle">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Batch</th>
                      <th>Reg No</th>
                      <th>Name</th>
                      <th>Sem</th>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Credit</th>
                      <th>Score</th>
                      <th>Exam</th>
                      <th>Cert ID</th>
                      <th>Proof</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((item, index) => (
                      <tr key={item._id}>
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
                            <a href={item.proofUrl} target="_blank" rel="noreferrer">View</a>
                          ) : (
                            'NA'
                          )}
                        </td>
                        <td>
                          <span className={`badge-status ${getStatusClass(item.status)}`}>
                            {item.status || 'N/A'}
                          </span>
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
