## project setup

1. Open your terminal
2. Navigate to the project folder where this README file is located.
3. Install all the required packages by running:
   ```bash
   npm install
   ```
   ```bash
   npm run dev
   ```----------------------
  example:
  
  cd "Monitoring UI"
  npm run dev

  PS C:\Users\LENOVO\React-WTG-Monitoring-UI> cd "Monitoring UI"
  PS C:\Users\LENOVO\React-WTG-Monitoring-UI\Monitoring UI> npm run dev
----------------------------------


## Complete Guide to UI Architecture & Customization

This section provides a detailed breakdown of where to find specific functionalities in the codebase, how they work, and how you can modify them in the future.

### 1. Main Dashboard UI (`WeeklyActivityDashboard.jsx`)
**File Path:** `src/pages/WeeklyActivityDashboard.jsx`

This is the core React component that renders the Gantt-chart-style timeline, filters, and statistics. 
- **What you can change here:** 
  - **Colors & Theming:** You can modify the `activityColorMap` object at the top of the file to change the background colors assigned to specific tasks like 'FOUNDATION', 'T1 Installation', etc.
  - **Pagination UI:** The pagination configuration (e.g., limits like `recordsPerPage = 5`) and the footer that displays "Showing X records" and "Page 1 of Y" are handled in the `currentRecords` calculation and the footer `<div>` at the bottom of the component.
  - **Icons:** We use `lucide-react` (like `<Calendar />`, `<ChevronLeft />`) and `@mui/icons-material`. You can import and swap icons directly in the JSX.
  - **Grid Layout:** The timeline layout relies on CSS Grid inline styling, dynamically setting columns based on the dates range using `minmax(${colWidth}px, 1fr)`.

### 2. Static Data Source (`mockData.js`)
**File Path:** `src/data/mockData.js`

Currently, the application is driven by static mock data. 
- **What you can change here:** 
  - You can add or remove JSON blocks representing different weeks (`week_id`).
  - You can modify turbine names (`turbine: "T1"`), activity names, categories, and their `act_planned_start_date` / `act_planned_end_date`.
  - **Future Dynamic Logic:** To make this dynamic in the future, you will replace the static import statement (`import { weeksData } from '../data/mockData';`) with an API call (using `fetch` or `axios` inside a `useEffect` hook) that stores the fetched JSON array into a React state variable (e.g., `const [weeksData, setWeeksData] = useState([])`).

### 3. Website Tab Icon / Favicon (`UGES_logo1.png`)
**File Path:** `src/assets/UGES_logo1.png`

This image serves as the logo asset and can be used as the tab icon (favicon) for the browser window.
- **How it works:** To ensure this image is used as the browser tab icon, it should be referenced directly inside the `public/index.html` (or `index.html` at the root directory for Vite) using a link tag: `<link rel="icon" href="/src/assets/UGES_logo1.png" />`. If you ever want to change the icon, simply replace the file while keeping the filename intact, or update the path in `index.html`.

### 4. "Select Week" Logic Explained
The "Select Week" dropdown allows users to switch the timeline data context entirely.
- **State Management:** It is controlled by the `selectedWeekId` state.
- **How it filters:** We use a `useMemo` hook to efficiently find the exact week object matching the `selectedWeekId`:
  ```javascript
  const rawData = useMemo(() => {
    return weeksData.find(w => w.week_id === selectedWeekId) || weeksData[0];
  }, [selectedWeekId]);
  ```
- **Re-calculation:** Whenever `rawData` changes, a secondary `useMemo` block triggers. It recalculates the minimum start date, maximum end date, aggregates categories, and formats the `filteredTurbines` array. The timeline automatically re-draws its columns (`timelineDates`) based on this newly calculated date range.
- **Pagination Reset:** There is a `useEffect` hook specifically designed to listen for changes in `selectedWeekId` and `categoryFilter`. Whenever you select a new week, it automatically resets `currentPage` back to `1` so the UI doesn't crash trying to render a page number that no longer exists in the new week.

### 5. Download Report (CSV) Button Logic
The "Download Report" functionality transforms the actively filtered React state into a downloadable CSV file.
- **Function Name:** `handleDownloadReport` inside `WeeklyActivityDashboard.jsx`.
- **How it works:**
  1. **Headers:** It initializes a raw string `csvContent` with the required column headers (e.g., Turbine, Category, Activity).
  2. **Data Mapping:** It iterates over the `filteredTurbines` array and maps the data to comma-separated values.
  3. **Date Formatting Trick for Excel:** Excel often formats dates incorrectly or shows `########` if a column is too narrow by default. To prevent this, the start and end dates are prefixed with an invisible tab character (`\t`) inside quotes:
     ```javascript
     const formattedStart = a.act_planned_start_date.split('T')[0].split('-').reverse().join('-');
     csvContent += `...,"\t${formattedStart}",...`;
     ```
     This tells Excel to treat the dates purely as raw text, ensuring they display perfectly regardless of default column widths, while keeping the formatting invisible to the user.
  4. **Blob Generation:** Finally, it creates a JavaScript `Blob` object with the `text/csv` MIME type, generates a temporary URL, creates a hidden `<a>` tag, simulates a click to trigger the download, and cleans up the DOM.