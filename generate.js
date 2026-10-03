const fs = require('fs');
const rawData = JSON.parse(fs.readFileSync('temp.js', 'utf8'));

function getWeekRange(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diffToMonday));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const formatDate = (date) => date.toISOString().split('T')[0];
  return {
    start: formatDate(start),
    end: formatDate(end),
    id: `${formatDate(start)} to ${formatDate(end)}`
  };
}

const weeksMap = {};

rawData.forEach(item => {
  if (!item.act_planned_start_date || !item.act_planned_end_date) return;
  if (!item.category) return; // Skip items with null category
  
  const startD = new Date(item.act_planned_start_date);
  const endD = new Date(item.act_planned_end_date);
  const days = Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1;
  const weekInfo = getWeekRange(item.act_planned_start_date);
  const wId = weekInfo.id;
  
  if (!weeksMap[wId]) {
    weeksMap[wId] = {
      week_id: wId,
      week_start: weekInfo.start,
      week_end: weekInfo.end,
      turbinesMap: {}
    };
  }
  
  const loc = item.location_no || `Turbine_${item.turbine}`;
  
  if (!weeksMap[wId].turbinesMap[loc]) {
    weeksMap[wId].turbinesMap[loc] = {
      turbine: loc,
      planned_master_id: item.planned_master || item.turbine,
      activities: []
    };
  }
  
  const categoryStr = item.category;
  
  weeksMap[wId].turbinesMap[loc].activities.push({
    id: item.id,
    activity_id: item.activity,
    activity_name: `${item.activity_name} (${days} Days)`,
    category: categoryStr,
    act_planned_start_date: item.act_planned_start_date,
    act_planned_end_date: item.act_planned_end_date,
    status: item.act_actual_start_date ? 'In Progress' : 'Pending'
  });
});

const weeksData = Object.values(weeksMap).map(w => {
  const turbines = Object.values(w.turbinesMap).map(t => ({
    ...t,
    total_week_activities: t.activities.length
  }));
  return {
    week_id: w.week_id,
    week_start: w.week_start,
    week_end: w.week_end,
    turbines: turbines
  };
});

weeksData.sort((a, b) => new Date(a.week_start) - new Date(b.week_start));
const output = 'export const weeksData = ' + JSON.stringify(weeksData, null, 2) + ';';
fs.writeFileSync('Monitoring UI/src/data/mockData.js', output);
console.log('Created ' + weeksData.length + ' weeks with ' + rawData.length + ' activities.');
