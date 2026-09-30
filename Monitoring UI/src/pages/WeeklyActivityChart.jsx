import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  Label,
} from 'recharts';
import { weeksData } from '../data/mockData';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Button } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import DownloadIcon from '@mui/icons-material/Download';
import '../styles/WeeklyActivityChart.css';

const activityColors = {
  SOIL: '#8b5cf6',
  EXC: '#22c55e',
  PCC: '#f59e0b',
  CONDUIT: '#3b82f6',
  ANCHOR: '#ef4444',
  'T1 INSTALLATION': '#6366f1',
  'TOWER INSTALLATION': '#10b981',
  'NACELLE INSTALLATION': '#f59e0b',
  'ROTOR HUB INSTALLATION': '#3b82f6',
  'BLADE INSTALLATION': '#a855f7',
};

const parseDateStr = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return new Date(y, m - 1, d);
};

const WeeklyActivityChart = () => {
  const [selectedWeekId, setSelectedWeekId] = useState(weeksData[0].week_id);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [chartWidth, setChartWidth] = useState(1000);
  const [displayLimit, setDisplayLimit] = useState(7);
  const scrollContainerRef = useRef(null);
  const chartTopRef = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY * -1.5;
        setChartWidth(prev => Math.min(4000, Math.max(600, prev + delta)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const rawData = useMemo(() => {
    return weeksData.find(w => w.week_id === selectedWeekId) || weeksData[0];
  }, [selectedWeekId]);

  const availableCategories = useMemo(() => {
    const cats = new Set();
    rawData.turbines.forEach(t => t.activities.forEach(a => cats.add(a.category)));
    return Array.from(cats);
  }, [rawData]);

  const { chartData, totalItems, maxActs, weekStart, totalDays } = useMemo(() => {
    const weekStartObj = parseDateStr(rawData.week_start);
    let maxActivities = 0;
    let maxDate = weekStartObj;

    const formattedData = [];

    rawData.turbines.forEach(t => {
      const tActs = categoryFilter ? t.activities.filter(a => a.category === categoryFilter) : t.activities;

      // Only include turbines that have activities matching the filter
      if (tActs.length > 0) {
        let currentEnd = weekStartObj;
        const obj = { name: t.turbine };

        maxActivities = Math.max(maxActivities, tActs.length);

        tActs.forEach((act, i) => {
          const start = parseDateStr(act.act_planned_start_date);
          const end = parseDateStr(act.act_planned_end_date);

          if (end > maxDate) maxDate = end;

          // Calculate transparent gap from previous activity's end
          const originalGap = Math.max(0, (start - currentEnd) / 86400000);
          const originalDuration = Math.round((end - start) / 86400000) + 1;

          // Introduce a physical gap between blocks so they don't visually touch when transparent
          // Subtract 0.1 days from duration to make the block slightly smaller
          // Add 0.05 to the first gap, and 0.1 to all subsequent gaps to align them properly
          const renderGap = i === 0 ? originalGap + 0.05 : originalGap + 0.1;
          const renderDuration = Math.max(0.1, originalDuration - 0.1);

          const baseName = act.activity_name.split(' (')[0];
          const color = activityColors[baseName.toUpperCase()] || '#cbd5e1';

          const displayLabel = `${baseName} (${originalDuration} day${originalDuration !== 1 ? 's' : ''})`;

          obj[`gap_${i}`] = renderGap;
          obj[`act_${i}_duration`] = renderDuration;
          obj[`act_${i}_name`] = displayLabel;
          obj[`act_${i}_color`] = color;
          obj[`act_${i}_full`] = displayLabel;

          currentEnd = new Date(end.getTime() + 86400000); // end of that day
        });
        formattedData.push(obj);
      }
    });

    // Make sure we always show at least the standard 7 days, +2 for the end boundary column
    const computedDays = Math.max(7, Math.round((maxDate - weekStartObj) / 86400000) + 2);
    
    const finalData = formattedData.slice(0, displayLimit);

    return { chartData: finalData, totalItems: formattedData.length, maxActs: maxActivities, weekStart: weekStartObj, totalDays: computedDays };
  }, [rawData, categoryFilter, displayLimit]);

  const CustomBarLabel = (props) => {
    const { x, y, width, height, value } = props;
    if (width < 30) return null;

    return (
      <foreignObject x={x} y={y} width={width} height={height}>
        <div className="gantt-bar-label-container">
          <span className="gantt-bar-label-text">
            {value}
          </span>
        </div>
      </foreignObject>
    );
  };

  const CustomXAxisTick = ({ x, y, payload }) => {
    const val = payload.value;
    const d = new Date(weekStart.getTime() + val * 86400000);
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#334155" fontSize={13} fontWeight={600}>
          {d.getDate()}
        </text>
        <text x={0} y={0} dy={34} textAnchor="middle" fill="#64748b" fontSize={12}>
          {d.toLocaleString('en-US', { month: 'short' })} {d.getFullYear()}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper elevation={3} sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', minWidth: '200px' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#0f172a', borderBottom: '1px solid #e2e8f0', pb: 1 }}>
            {data.name} Activities
          </Typography>
          {Array.from({ length: maxActs }).map((_, i) => {
            if (data[`act_${i}_name`]) {
              return (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: data[`act_${i}_color`], mr: 1.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
                    {data[`act_${i}_full`]}
                  </Typography>
                </Box>
              );
            }
            return null;
          })}
        </Paper>
      );
    }
    return null;
  };

  const ticks = Array.from({ length: totalDays }).map((_, i) => i);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f4f7f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>

        <Box sx={{ mb: 3 }}>
          <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarMonthIcon sx={{ mr: 1, color: '#3b82f6' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>Turbine Installation Planning Workspace</Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
              Select Scope Boundaries, Cluster, and Category to manage deployment targets and generate baseline activity charts.
            </Typography>

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

        <Paper ref={chartTopRef} elevation={0} sx={{ p: 3, borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <h3 className="chart-view-title">
              <BarChartIcon sx={{ color: '#0f172a', fontSize: 32 }} />
              Chart View
            </h3>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 200, bgcolor: '#fff' }}>
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
              <FormControl size="small" sx={{ minWidth: 220, bgcolor: '#fff' }}>
                <InputLabel>Select Week</InputLabel>
                <Select
                  label="Select Week"
                  value={selectedWeekId}
                  onChange={(e) => setSelectedWeekId(e.target.value)}
                >
                  {weeksData.map(w => (
                    <MenuItem key={w.week_id} value={w.week_id}>{w.week_id}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<DownloadIcon />}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', height: '40px', whiteSpace: 'nowrap' }}
              >
                Download Report
              </Button>
            </Box>
          </Box>

          <Box sx={{ width: '100%', overflowX: 'auto' }} ref={scrollContainerRef}>
            <Box sx={{ minWidth: '100%', width: chartWidth, height: Math.max(300, chartData.length * 70) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 20, right: 40, left: 20, bottom: 30 }}
                  barSize={36}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#cbd5e1" />
                  <XAxis
                    type="number"
                    domain={[0, totalDays - 1]}
                    ticks={ticks}
                    tick={<CustomXAxisTick />}
                    stroke="#cbd5e1"
                    axisLine={true}
                    tickLine={true}
                    height={60}
                  >
                    <Label value="Plan Dates" offset={-15} position="insideBottom" fill="#475569" fontSize={14} fontWeight="bold" />
                  </XAxis>
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fontWeight: 700, fill: '#334155' }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  >
                    <Label value="Turbine Location" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#475569" fontSize={14} fontWeight="bold" />
                  </YAxis>
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: '#f8fafc', opacity: 0.6 }}
                  />

                  {/* Dynamically render stacked bars based on the max number of activities across all turbines */}
                  {Array.from({ length: maxActs }).map((_, i) => (
                    <React.Fragment key={`group-${i}`}>
                      {/* Invisible gap block pushes the actual activity block to the correct start date */}
                      <Bar dataKey={`gap_${i}`} stackId="a" fill="transparent" isAnimationActive={false} />
                      {/* Colored activity block */}
                      <Bar dataKey={`act_${i}_duration`} stackId="a" radius={[12, 12, 12, 12]} animationDuration={300}>
                        <LabelList dataKey={`act_${i}_name`} content={<CustomBarLabel />} />
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${i}-${index}`}
                            fill={entry[`act_${i}_color`] || 'transparent'}
                            stroke="transparent"
                            strokeWidth={entry[`act_${i}_color`] ? 4 : 0}
                          />
                        ))}
                      </Bar>
                    </React.Fragment>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {totalItems > displayLimit && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, pt: 2, borderTop: '1px dashed #e2e8f0' }}>
              <Button 
                variant="outlined" 
                onClick={() => setDisplayLimit(prev => prev + 7)}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Load More Turbines
              </Button>
            </Box>
          )}
          {totalItems <= displayLimit && totalItems > 7 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, pt: 2, borderTop: '1px dashed #e2e8f0' }}>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setDisplayLimit(7);
                  chartTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Show Less
              </Button>
            </Box>
          )}

        </Paper>
      </Box>
    </Box>
  );
};

export default WeeklyActivityChart;
