import React from 'react';
import TurbinePlannedSchedules from './pages/TurbinePlannedSchedules';
import WeeklyActivityDashboard from './pages/WeeklyActivityDashboard';
import WeeklyActivityChart from './pages/WeeklyActivityChart';

function App() {
  return (
    <div>
      {/* 1st UI: Graphic Gantt Chart */}
      <WeeklyActivityChart />

      <div style={{ height: '40px', backgroundColor: '#e2e8f0' }}></div>

      {/* 2nd UI (Previously 1st UI) */}
      <WeeklyActivityDashboard />

      <div style={{ height: '40px', backgroundColor: '#e2e8f0' }}></div>

      {/* 3rd UI */}
      <TurbinePlannedSchedules />
    </div>
  );
}

export default App;
