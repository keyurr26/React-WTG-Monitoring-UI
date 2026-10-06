import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import '../styles/WeeklyActivityDashboard.css';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar, Target, Settings, Clock, Activity } from 'lucide-react';
import { Box, Paper, FormControl, InputLabel, Select, MenuItem, Typography, Button, IconButton } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DownloadIcon from '@mui/icons-material/Download';

import { weeksData } from '../data/mockData';

// Date helpers
const parseDateStr = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return new Date(y, m - 1, d);
};

const formatDate = (dateStr) => {
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  const d = parseDateStr(dateStr);
  return d.toLocaleDateString('en-GB', options);
};

const getLocalISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getDaysDiff = (start, end) => {
  const s = parseDateStr(start);
  const e = parseDateStr(end);
  const diffTime = Math.abs(e - s);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const getDatesInRange = (start, end) => {
  const dates = [];
  let curr = new Date(start);
  curr.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (curr <= last) {
    dates.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

const activityColorMap = {
  // FOUNDATION
  'SOIL': '#6366f1',
  'EXC': '#22c55e',
  'PCC': '#f59e0b',
  'CONDUIT': '#3b82f6',
  'PCC & CONDUIT': '#f59e0b',
  'ANCHOR': '#ef4444',
  'REINFORCEMENT': '#a855f7',
  'FOUNDATION': '#06b6d4',
  'POURING': '#f97316',
  'CUBE RESULT': '#4f46e5',
  'BACKFILLING': '#65a30d',

  // WTG
  'T1 Installation': '#6366f1',
  'Tower Installation': '#22c55e',
  'Nacelle Installation': '#f59e0b',
  'Rotor Hub Installation': '#3b82f6',
  'Blade Installation': '#a855f7',
};

const activityColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'
];

const Accordion = ({ title, defaultOpen = true, headerColor = '#f8fafc', titleStyle = {}, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="accordion-wrapper">
      <button
        className="accordion-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: headerColor,
          borderBottom: isOpen ? '1px solid #e2e8f0' : 'none'
        }}
      >
        <div style={titleStyle}>{title}</div>
        {isOpen ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
      </button>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );
};

const WeeklyActivityDashboard = () => {
  const [selectedWeekId, setSelectedWeekId] = useState(weeksData[0].week_id);
  const [colWidth, setColWidth] = useState(120);
  const dragRef = useRef({ isDragging: false, startX: 0, startWidth: 0 });

  const handleMouseDown = useCallback((e) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startWidth: colWidth
    };
    document.body.style.cursor = 'col-resize';
  }, [colWidth]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragRef.current.isDragging) return;
      const delta = e.clientX - dragRef.current.startX;
      const newWidth = Math.max(60, dragRef.current.startWidth + delta);
      setColWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        document.body.style.cursor = 'default';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Pinch-to-zoom on trackpad or Ctrl+Scroll wheel triggers ctrlKey
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.5;
        setColWidth(prev => Math.min(400, Math.max(40, prev + delta)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);


  const rawData = useMemo(() => {
    if (selectedWeekId === 'All') {
      const allTurbinesMap = {};
      let minStart = null;
      let maxEnd = null;

      weeksData.forEach(w => {
        if (!minStart || new Date(w.week_start) < new Date(minStart)) minStart = w.week_start;
        if (!maxEnd || new Date(w.week_end) > new Date(maxEnd)) maxEnd = w.week_end;

        w.turbines.forEach(t => {
          if (!allTurbinesMap[t.turbine]) {
            allTurbinesMap[t.turbine] = { ...t, activities: [...t.activities] };
          } else {
            allTurbinesMap[t.turbine].activities.push(...t.activities);
            allTurbinesMap[t.turbine].total_week_activities += t.total_week_activities;
          }
        });
      });

      return {
        week_id: "All",
        week_start: minStart,
        week_end: maxEnd,
        turbines: Object.values(allTurbinesMap)
      };
    }
    return weeksData.find(w => w.week_id === selectedWeekId) || weeksData[0];
  }, [selectedWeekId]);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAllData, setShowAllData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  const { categories, availableCategories, stats, timelineDates, computedStartStr, computedEndStr, filteredTurbines } = useMemo(() => {
    let totalActivities = 0;
    let pendingCount = 0;
    const catMap = {};
    let minDate = parseDateStr(rawData.week_start);
    let maxDate = parseDateStr(rawData.week_end);

    const allCategories = new Set();
    rawData.turbines.forEach(t => t.activities.forEach(a => allCategories.add(a.category)));

    const filteredTurbinesList = [];

    rawData.turbines.forEach(t => {
      const tActs = t.activities.filter(a => categoryFilter === '' || a.category === categoryFilter);
      if (tActs.length === 0) return;

      const newT = { ...t, activities: [] };

      tActs.forEach(a => {
        totalActivities++;
        if (a.status === 'Pending') pendingCount++;

        const sd = new Date(a.act_planned_start_date);
        const ed = new Date(a.act_planned_end_date);
        if (sd < minDate) minDate = sd;
        if (ed > maxDate) maxDate = ed;

        if (!catMap[a.category]) catMap[a.category] = { count: 0, turbines: {} };
        catMap[a.category].count++;

        if (!catMap[a.category].turbines[newT.turbine]) {
          catMap[a.category].turbines[newT.turbine] = [];
        }

        const duration = getDaysDiff(a.act_planned_start_date, a.act_planned_end_date);
        const newA = { ...a, duration };
        catMap[a.category].turbines[newT.turbine].push(newA);
        newT.activities.push(newA);
      });

      filteredTurbinesList.push(newT);
    });

    const finalStart = minDate;
    const finalEnd = maxDate;

    const activeDateStrings = new Set();
    filteredTurbinesList.forEach(t => {
      t.activities.forEach(a => {
        let d = new Date(a.act_planned_start_date);
        const e = new Date(a.act_planned_end_date);
        while (d <= e) {
          activeDateStrings.add(getLocalISODate(d));
          d.setDate(d.getDate() + 1);
        }
      });
    });

    const activeDatesArray = Array.from(activeDateStrings).sort();
    const timelineDatesList = activeDatesArray.map(dateStr => parseDateStr(dateStr));


    return {
      categories: catMap,
      availableCategories: Array.from(allCategories),
      stats: {
        totalTurbines: filteredTurbinesList.length,
        totalActivities,
        foundationActivities: catMap['FOUNDATION']?.count || 0,
        pendingCount
      },
      timelineDates: timelineDatesList,
      computedStartStr: minDate.toISOString().split('T')[0],
      computedEndStr: maxDate.toISOString().split('T')[0],
      filteredTurbines: filteredTurbinesList
    };
  }, [categoryFilter, rawData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, selectedWeekId, showAllData]);

  const totalRecords = filteredTurbines.length;
  const currentRecordsPerPage = showAllData ? Math.max(totalRecords, 1) : recordsPerPage;
  const totalPages = Math.ceil(totalRecords / currentRecordsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * currentRecordsPerPage;
  const currentRecords = filteredTurbines.slice(startIndex, startIndex + currentRecordsPerPage);

  const handleDownloadReport = () => {
    // 1. Setup CSV headers
    let csvContent = "Turbine,Category,Activity,Status,Planned Start,Planned End,Duration (Days)\n";
    
    // 2. Loop through the currently filtered data
    filteredTurbines.forEach(t => {
      t.activities.forEach(a => {
        // Enclose text in quotes to avoid issues with commas in activity names
        const formattedStart = a.act_planned_start_date.split('T')[0].split('-').reverse().join('-');
        const formattedEnd = a.act_planned_end_date.split('T')[0].split('-').reverse().join('-');
        // Prefix with a tab character to force Excel to treat it as pure text without visible formula syntax
        csvContent += `${t.turbine},${a.category},"${a.activity_name}",${a.status},"\t${formattedStart}","\t${formattedEnd}",${a.duration}\n`;
      });
    });

    // 3. Create a downloadable Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Dashboard_Report_${selectedWeekId}.csv`);
    
    // 4. Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        <Box sx={{ mb: 3 }}>
          <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>

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
                  <MenuItem value="Udangudi South Cluster">Udangudi South Cluster</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                color="error"
                onClick={() => setCategoryFilter('')}
                sx={{ height: 40 }}
              >
                Clear Filters
              </Button>
            </Box>
          </Paper>
        </Box>


        <div className="dashboard-card timeline-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="timeline-title" style={{ margin: 0 }}>
              <Calendar size={20} style={{ marginRight: '8px', color: '#3b82f6' }} />
              Weekly Timeline Overview
            </h2>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Category Scope</InputLabel>
                <Select
                  label="Category Scope"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {availableCategories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 250 }}>
                <InputLabel>Select Week</InputLabel>
                <Select
                  label="Select Week"
                  value={selectedWeekId}
                  onChange={(e) => setSelectedWeekId(e.target.value)}
                >
                  <MenuItem value="All">All Data (All Weeks)</MenuItem>
                  {weeksData.map(w => (
                    <MenuItem key={w.week_id} value={w.week_id}>{w.week_id}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {filteredTurbines.length > recordsPerPage && (
                <Button 
                  variant="outlined" 
                  onClick={() => setShowAllData(!showAllData)}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', height: '40px' }}
                >
                  {showAllData ? 'Hide Turbines' : `Show Turbines (${filteredTurbines.length})`}
                </Button>
              )}
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleDownloadReport}
                startIcon={<DownloadIcon />}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', height: '40px' }}
              >
                Download Report
              </Button>
            </div>
          </div>

          <div className="timeline-scroll-container" ref={scrollContainerRef} style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
            <div className="timeline-wrapper">
              <div className="timeline-header" style={{ display: 'grid', gridTemplateColumns: `120px repeat(${timelineDates.length}, minmax(${colWidth}px, 1fr))` }}>
                <div className="timeline-turbine-label">Turbine</div>
                {timelineDates.map((d, i) => (
                  <div key={i} className="timeline-date" style={{ position: 'relative' }}>
                    <div
                      style={{ position: 'absolute', left: -5, top: 0, bottom: 0, width: 10, cursor: 'col-resize', zIndex: 20 }}
                      onMouseDown={handleMouseDown}
                    ></div>
                    <div className="timeline-date-day">{d.getDate()}</div>
                    <div>{d.toLocaleString('en-US', { month: 'short' })} {d.getFullYear()}</div>
                  </div>
                ))}
              </div>

              {currentRecords.map(t => {
                const sortedActs = [...t.activities].sort((a, b) => new Date(a.act_planned_start_date) - new Date(b.act_planned_start_date));
                
                const pccActs = sortedActs.filter(a => a.activity_name.split(' (')[0].toUpperCase() === 'PCC');
                const conduitActs = sortedActs.filter(a => a.activity_name.split(' (')[0].toUpperCase() === 'CONDUIT');
                const otherActs = sortedActs.filter(a => {
                  const name = a.activity_name.split(' (')[0].toUpperCase();
                  return name !== 'PCC' && name !== 'CONDUIT';
                });

                let mergedActs = [...otherActs];

                if (pccActs.length > 0 || conduitActs.length > 0) {
                  const combined = [...pccActs, ...conduitActs];
                  const startDates = combined.map(a => a.act_planned_start_date).sort();
                  const endDates = combined.map(a => a.act_planned_end_date).sort();
                  const minStart = startDates[0];
                  const maxEnd = endDates[endDates.length - 1];

                  let newName = '';
                  if (pccActs.length > 0 && conduitActs.length > 0) newName = 'PCC_AND_CONDUIT';
                  else if (pccActs.length > 0) newName = 'PCC';
                  else newName = 'CONDUIT';

                  mergedActs.push({
                    ...combined[0],
                    id: combined.map(a => a.id).join('-'),
                    activity_name: newName,
                    original_pcc: pccActs[0],
                    original_conduit: conduitActs[0],
                    act_planned_start_date: minStart,
                    act_planned_end_date: maxEnd
                  });
                }

                mergedActs.sort((a, b) => new Date(a.act_planned_start_date) - new Date(b.act_planned_start_date));

                const tracks = [];
                const activitiesWithTracks = mergedActs.map(a => {
                  const sDate = parseDateStr(a.act_planned_start_date);
                  const eDate = parseDateStr(a.act_planned_end_date);
                  let trackIdx = 0;
                  while (tracks[trackIdx] && tracks[trackIdx] >= sDate) {
                    trackIdx++;
                  }
                  tracks[trackIdx] = eDate;
                  return { ...a, trackIdx, sDate, eDate };
                });

                const maxTrack = activitiesWithTracks.length > 0 ? Math.max(...activitiesWithTracks.map(a => a.trackIdx)) : 0;
                const rowMinHeight = Math.max(60, (maxTrack + 1) * 42 + 24);

                return (
                <div key={t.turbine} className="timeline-row" style={{ display: 'grid', gridTemplateColumns: `120px repeat(${timelineDates.length}, minmax(${colWidth}px, 1fr))`, minHeight: `${rowMinHeight}px` }}>
                  <div className="timeline-row-label">{t.turbine}</div>
                  {/* Background grid lines drawn directly into the parent grid cells */}
                  {timelineDates.map((_, i) => (
                    <div key={`bg-${i}`} className="timeline-grid-line" style={{ gridColumn: `${i + 2}`, gridRow: 1 }}></div>
                  ))}

                  <div className="timeline-bars-container" style={{ gridColumn: `2 / span ${timelineDates.length}`, gridRow: 1 }}>
                    {activitiesWithTracks.map((a, i) => {
                      const totalDays = timelineDates.length;
                      const sDateStr = getLocalISODate(a.sDate);
                      const eDateStr = getLocalISODate(a.eDate);
                      
                      let startIndex = timelineDates.findIndex(d => getLocalISODate(d) === sDateStr);
                      let endIndex = timelineDates.findIndex(d => getLocalISODate(d) === eDateStr);
                      
                      if (startIndex === -1) startIndex = 0;
                      if (endIndex === -1) endIndex = timelineDates.length - 1;

                      // Introduce a physical gap between blocks so they don't visually touch
                      const renderOffsetDays = startIndex + 0.05;
                      const renderDurationDays = Math.max(0.1, (endIndex - startIndex + 1) - 0.1);

                      const leftPct = (renderOffsetDays / totalDays) * 100;
                      const widthPct = (renderDurationDays / totalDays) * 100;

                      const durationDays = Math.round((a.eDate - a.sDate) / (1000 * 60 * 60 * 24)) + 1;
                      const baseName = a.activity_name.split(' (')[0];
                      const color = activityColorMap[baseName] || activityColorMap[baseName.toUpperCase()] || activityColors[i % activityColors.length];

                      if (baseName === 'PCC_AND_CONDUIT') {
                        const pcc = a.original_pcc;
                        const cond = a.original_conduit;
                        const pccDur = pcc ? Math.round((new Date(pcc.act_planned_end_date) - new Date(pcc.act_planned_start_date)) / (1000 * 60 * 60 * 24)) + 1 : 0;
                        const condDur = cond ? Math.round((new Date(cond.act_planned_end_date) - new Date(cond.act_planned_start_date)) / (1000 * 60 * 60 * 24)) + 1 : 0;
                        
                        const outerTotalDays = endIndex - startIndex + 1;
                        
                        let pccLeft = 0, pccWidth = 0;
                        if (pcc) {
                          let pccStartIdx = timelineDates.findIndex(d => getLocalISODate(d) === pcc.act_planned_start_date.split('T')[0]);
                          let pccEndIdx = timelineDates.findIndex(d => getLocalISODate(d) === pcc.act_planned_end_date.split('T')[0]);
                          if (pccStartIdx === -1) pccStartIdx = 0;
                          if (pccEndIdx === -1) pccEndIdx = timelineDates.length - 1;
                          pccLeft = ((pccStartIdx - startIndex) / outerTotalDays) * 100;
                          pccWidth = ((pccEndIdx - pccStartIdx + 1) / outerTotalDays) * 100;
                        }
                        
                        let condLeft = 0, condWidth = 0;
                        if (cond) {
                          let condStartIdx = timelineDates.findIndex(d => getLocalISODate(d) === cond.act_planned_start_date.split('T')[0]);
                          let condEndIdx = timelineDates.findIndex(d => getLocalISODate(d) === cond.act_planned_end_date.split('T')[0]);
                          if (condStartIdx === -1) condStartIdx = 0;
                          if (condEndIdx === -1) condEndIdx = timelineDates.length - 1;
                          condLeft = ((condStartIdx - startIndex) / outerTotalDays) * 100;
                          condWidth = ((condEndIdx - condStartIdx + 1) / outerTotalDays) * 100;
                        }
                        
                        return (
                          <div
                            key={a.id}
                            className="timeline-bar"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              backgroundColor: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              top: `${a.trackIdx * 42 + 12}px`,
                              transform: 'none',
                              padding: 0,
                              overflow: 'hidden',
                              borderRadius: '12px',
                              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                            }}
                            title={`PCC (${pccDur} days) & CONDUIT (${condDur} days)`}
                          >
                            {pcc && (
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: `${pccLeft}%`,
                                width: `${pccWidth}%`,
                                height: '50%',
                                backgroundColor: '#f59e0b',
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: '8px',
                                fontSize: '11px',
                                color: '#fff',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                PCC ({pccDur} {pccDur === 1 ? 'day' : 'days'})
                              </div>
                            )}
                            {cond && (
                              <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: `${condLeft}%`,
                                width: `${condWidth}%`,
                                height: '50%',
                                backgroundColor: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: '8px',
                                fontSize: '11px',
                                color: '#fff',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                CONDUIT ({condDur} {condDur === 1 ? 'day' : 'days'})
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={a.id}
                          className="timeline-bar"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: color,
                            top: `${a.trackIdx * 42 + 12}px`,
                            transform: 'none'
                          }}
                          title={`${baseName} (${durationDays} days)`}
                        >
                          {baseName} ({durationDays} {durationDays === 1 ? 'day' : 'days'})
                        </div>
                      );
                    })}
                  </div>
                </div>
              )})}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e2e8f0', borderTop: 'none', backgroundColor: '#f9fafb', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '13px' }}>
              Showing {currentRecords.length} records
            </Typography>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '13px' }}>
                Page {safeCurrentPage} of {totalPages}
              </Typography>
              <div style={{ display: 'flex', gap: '4px' }}>
                <IconButton 
                  size="small" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  sx={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px', backgroundColor: '#fff', '&:disabled': { backgroundColor: '#f1f5f9' } }}
                >
                  <ChevronLeft size={16} />
                </IconButton>
                <IconButton 
                  size="small"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  sx={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px', backgroundColor: '#fff', '&:disabled': { backgroundColor: '#f1f5f9' } }}
                >
                  <ChevronRight size={16} />
                </IconButton>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WeeklyActivityDashboard;
