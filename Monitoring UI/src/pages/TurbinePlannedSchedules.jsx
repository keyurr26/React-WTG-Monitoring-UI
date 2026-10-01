import React, { useState } from 'react';
import { Box, Paper, Grid, FormControl, InputLabel, Select, MenuItem, Typography, Button, TextField, IconButton } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import '../styles/TurbinePlannedSchedules.css';

import { weeksData } from '../data/mockData';

const rawData = weeksData[0];

const TurbinePlannedSchedules = () => {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expandedTurbines, setExpandedTurbines] = useState({});
  const [showAllData, setShowAllData] = useState(false);

  const toggleTurbine = (turbine) => {
    setExpandedTurbines(prev => ({ ...prev, [turbine]: !prev[turbine] }));
  };

  return (
    <div className="turbine-page">
      <div className="turbine-card">

        <Box sx={{ mb: 3 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ flex: 1, minWidth: 140 }}>
                <InputLabel>Project</InputLabel>
                <Select label="Project" defaultValue="Envision TN">
                  <MenuItem value="Envision TN">Envision TN</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1, minWidth: 180 }}>
                <InputLabel>Windfarm</InputLabel>
                <Select label="Windfarm" defaultValue="Udangudi Wind Park">
                  <MenuItem value="Udangudi Wind Park">Udangudi Wind Park</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
                <InputLabel>Cluster</InputLabel>
                <Select label="Cluster" defaultValue="Udangudi North Cluster">
                  <MenuItem value="Udangudi North Cluster">Udangudi North Cluster</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1, minWidth: 220 }}>
                <InputLabel>Category Scope</InputLabel>
                <Select
                  label="Category Scope"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="FOUNDATION">FOUNDATION</MenuItem>
                  <MenuItem value="WTG">WTG</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" color="error" sx={{ height: '40px', minWidth: 120 }}>Clear Filters</Button>
            </Box>
          </Paper>


        </Box>

        <div className="turbine-table-container">
          <table className="turbine-table">
            <thead>
              <tr>
                <th style={{ width: '5%', color: 'white', backgroundColor: '#0b499e' }}></th>
                <th style={{ width: '15%', color: 'white', backgroundColor: '#0b499e' }}>Turbine Sr No</th>
                <th style={{ width: '20%', color: 'white', backgroundColor: '#0b499e' }}>Category</th>
                <th style={{ width: '20%', color: 'white', backgroundColor: '#0b499e' }}>Planned Start Date</th>
                <th style={{ width: '20%', color: 'white', backgroundColor: '#0b499e' }}>Planned End Date</th>
                <th style={{ width: '20%', color: 'white', backgroundColor: '#0b499e' }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredTurbines = rawData.turbines.filter(t => 
                  t.activities.some(a => categoryFilter === '' || a.category === categoryFilter)
                );
                const displayTurbines = showAllData ? filteredTurbines : filteredTurbines.slice(0, 5);
                
                return (
                  <>
                    {displayTurbines.map((t) => {
                      const filteredActivities = t.activities.filter(a => categoryFilter === '' || a.category === categoryFilter);

                      const isExpanded = expandedTurbines[t.turbine];
                const firstAct = filteredActivities[0];
                const lastAct = filteredActivities[filteredActivities.length - 1];

                const mainDuration = Math.round((new Date(lastAct.act_planned_end_date) - new Date(firstAct.act_planned_start_date)) / (1000 * 60 * 60 * 24)) + 1;

                return (
                  <React.Fragment key={t.turbine}>
                    <tr
                      className="turbine-row"
                      onClick={() => toggleTurbine(t.turbine)}
                      style={{ backgroundColor: '#eaf2f8', cursor: 'pointer' }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <IconButton size="small" sx={{ padding: '2px', backgroundColor: '#ffffff', border: '1px solid #ccc' }}>
                          {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                        </IconButton>
                      </td>
                      <td style={{ fontWeight: '600' }}>{t.turbine}</td>
                      <td>{firstAct.category}</td>
                      <td style={{ color: '#2e7d32', fontWeight: '500' }}>{firstAct.act_planned_start_date.split('-').reverse().join('-')}</td>
                      <td style={{ color: '#d32f2f', fontWeight: '500' }}>{lastAct.act_planned_end_date.split('-').reverse().join('-')}</td>
                      <td style={{ fontWeight: '500' }}>{mainDuration} Days</td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan="6" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
                          <div style={{ border: '1px dashed #0b499e', borderRadius: '4px', padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', color: '#0b499e', fontWeight: '600', fontSize: '15px' }}>
                              Activity Schedule for Location Block: {t.turbine}
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#eaf2f8' }}>
                                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#0b499e', borderBottom: 'none' }}>Seq</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#0b499e', borderBottom: 'none' }}>Activity</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#0b499e', borderBottom: 'none' }}>Planned Start Date</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#0b499e', borderBottom: 'none' }}>Planned Completion Date</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#0b499e', borderBottom: 'none' }}>Duration</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#0b499e', borderBottom: 'none' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredActivities.map((a, aIndex) => {
                                  const actDuration = Math.round((new Date(a.act_planned_end_date) - new Date(a.act_planned_start_date)) / (1000 * 60 * 60 * 24)) + 1;
                                  const statusClass = a.status === 'Pending' ? 'turbine-status-pending' : (a.status === 'Completed' ? 'turbine-status-completed' : 'turbine-status-other');
                                  return (
                                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>{aIndex + 1}</td>
                                      <td style={{ padding: '12px 16px' }}>{a.activity_name.split(' (')[0]}</td>
                                      <td style={{ padding: '12px 16px', color: '#2e7d32', fontWeight: '600' }}>{a.act_planned_start_date.split('-').reverse().join('-')}</td>
                                      <td style={{ padding: '12px 16px', color: '#d32f2f', fontWeight: '600' }}>{a.act_planned_end_date.split('-').reverse().join('-')}</td>
                                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>{actDuration} Days</td>
                                      <td style={{ padding: '12px 16px' }}>
                                        <span className={`turbine-status-badge ${statusClass}`}>
                                          <span className="turbine-status-dot"></span>
                                          {a.status}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredTurbines.length > 5 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f8fafc', borderTop: '1px dashed #cbd5e1' }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => setShowAllData(!showAllData)}
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                    >
                      {showAllData ? 'Show Less Turbines' : `View All ${filteredTurbines.length} Turbines`}
                    </Button>
                  </td>
                </tr>
              )}
            </>
          );
        })()}
        </tbody>
      </table>
    </div>
  </div>
</div>
  );
};

export default TurbinePlannedSchedules;
