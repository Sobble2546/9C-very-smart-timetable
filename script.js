// Default timetable data (from actual school timetable)
const DEFAULT_TIMETABLE = {
    MONDAY: ['HIND', 'ENG', 'MATH', 'ENG', 'FCP', 'SST', 'SCI', 'SCI'],
    TUESDAY: ['HIND', 'SCI', 'MATH', 'ENG', 'SST', 'ENG', 'SST', 'SCI'],
    WEDNESDAY: ['MPT', 'HIN', 'MATH', 'SCI', 'SST', 'ENG', 'PE', 'PE'],
    THURSDAY: ['HIN', 'ENG', 'SCI', 'SST', 'VE', 'MATH', 'ART', 'ART'],
    FRIDAY: ['HIN', 'PE', 'SCI', 'HIN', 'MATH', 'SST', 'ENG', 'ENG'],
    SATURDAY: ['CLA', 'CLA', 'MATH', 'HIND', 'SST', 'ENG', 'SCI', 'LIB']
};

// Teacher codes to ignore in comparison (note to myself to remove this frfr)
const TEACHER_CODES = ['DA', 'JP', 'PB', 'AK', 'APG', 'MK', 'KRP', 'SKA', 'PS'];

// Days of the week
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Application state
let currentHighlighting = {
    yellowDay: null,
    greenDay: null
};

// DOM elements
const yellowDaySelect = document.getElementById('yellowDay');
const greenDaySelect = document.getElementById('greenDay');
const resetBtn = document.getElementById('resetBtn');
const timetableBody = document.getElementById('timetableBody');
const comparisonSummary = document.getElementById('comparisonSummary');
const currentDayInfo = document.getElementById('currentDayInfo');

// Initialize the application
function init() {
    loadUserPreferences();
    setDefaultHighlighting();
    renderTimetable();
    updateComparisonSummary();
    updateCurrentDayInfo();
    setupEventListeners();
}

// Load user preferences from localStorage
function loadUserPreferences() {
    const saved = localStorage.getItem('timetablePreferences');
    if (saved) {
        try {
            const preferences = JSON.parse(saved);
            if (preferences.yellowDay && preferences.greenDay) {
                currentHighlighting = preferences;
                yellowDaySelect.value = preferences.yellowDay;
                greenDaySelect.value = preferences.greenDay;
                return;
            }
        } catch (e) {
            console.error('Error loading preferences:', e);
        }
    }
}


// Set default highlighting based on current day
function setDefaultHighlighting() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    let yellowDay, greenDay;
    
    if (currentDay === 0) { // Sunday
        // Check if previous day was 2nd Saturday
        const prevSaturday = new Date(today);
        prevSaturday.setDate(today.getDate() - 1);
        
        if (isSecondSaturday(prevSaturday)) {
            yellowDay = 'FRIDAY';
        } else {
            yellowDay = 'SATURDAY';
        }
        greenDay = 'MONDAY';
    } else if (currentDay === 6 && isSecondSaturday(today)) { // 2nd Saturday
        yellowDay = 'FRIDAY';
        greenDay = 'MONDAY';
    } else {
        // Normal case
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const todayName = dayNames[currentDay];
        
        if (todayName === 'SATURDAY') {
            yellowDay = 'SATURDAY';
            greenDay = 'MONDAY';
        } else {
            yellowDay = todayName;
            // Find next school day
            let nextDay = currentDay + 1;
            if (nextDay > 6) nextDay = 1; // Skip Sunday
            if (nextDay === 6) { // If next day is Saturday
                const nextSat = new Date(today);
                nextSat.setDate(today.getDate() + (nextDay - currentDay));
                if (isSecondSaturday(nextSat)) {
                    nextDay = 1; // Skip to Monday
                }
            }
            greenDay = dayNames[nextDay];
        }
    }
    
    // Only set defaults if not already set by user preferences
    if (!currentHighlighting.yellowDay || !currentHighlighting.greenDay) {
        currentHighlighting.yellowDay = yellowDay;
        currentHighlighting.greenDay = greenDay;
        yellowDaySelect.value = yellowDay;
        greenDaySelect.value = greenDay;
    }
}

// Check if a given date is the second Saturday of the month
function isSecondSaturday(date) {
    if (date.getDay() !== 6) return false; // Not Saturday
    
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstSaturday = new Date(firstOfMonth);
    
    // Find first Saturday
    while (firstSaturday.getDay() !== 6) {
        firstSaturday.setDate(firstSaturday.getDate() + 1);
    }
    
    // Second Saturday is 7 days later
    const secondSaturday = new Date(firstSaturday);
    secondSaturday.setDate(firstSaturday.getDate() + 7);
    
    return date.getDate() === secondSaturday.getDate();
}

// Render the timetable
function renderTimetable() {
    timetableBody.innerHTML = '';
    
    DAYS.forEach(day => {
        const row = document.createElement('tr');
        
        // Apply highlighting classes
        if (day === currentHighlighting.yellowDay) {
            row.className = 'bg-yellow-100 border-l-4 border-yellow-400';
        } else if (day === currentHighlighting.greenDay) {
            row.className = 'bg-green-100 border-l-4 border-green-400';
        } else {
            row.className = 'hover:bg-gray-50';
        }
        
        // Day name cell
        const dayCell = document.createElement('td');
        dayCell.className = 'px-3 py-3 font-semibold text-gray-800 border-b border-gray-200';
        dayCell.textContent = day.charAt(0) + day.slice(1).toLowerCase();
        row.appendChild(dayCell);
        
        // Period cells
        DEFAULT_TIMETABLE[day].forEach(subject => {
            const cell = document.createElement('td');
            cell.className = 'px-3 py-3 text-center text-sm border-b border-gray-200';
            cell.textContent = subject;
            row.appendChild(cell);
        });
        
        timetableBody.appendChild(row);
    });
}

// Get subjects for a day (excluding teacher codes and removing duplicates)
function getSubjectsForDay(day) {
    const subjects = DEFAULT_TIMETABLE[day].filter(item => !TEACHER_CODES.includes(item));
    // Remove duplicates using Set
    return [...new Set(subjects)];
}

// Update comparison summary
function updateComparisonSummary() {
    const yellowSubjects = getSubjectsForDay(currentHighlighting.yellowDay);
    const greenSubjects = getSubjectsForDay(currentHighlighting.greenDay);
    
    // Find differences
    const additions = greenSubjects.filter(subject => !yellowSubjects.includes(subject));
    const removals = yellowSubjects.filter(subject => !greenSubjects.includes(subject));
    
    comparisonSummary.innerHTML = '';
    
    if (additions.length === 0 && removals.length === 0) {
        const noChange = document.createElement('div');
        noChange.className = 'text-gray-600 italic';
        noChange.textContent = 'No subject changes between the highlighted days.';
        comparisonSummary.appendChild(noChange);
        return;
    }
    
    // Show additions
    additions.forEach(subject => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded';
        item.innerHTML = `
            <span class="font-semibold text-green-600">+</span>
            <span>${subject}</span>
            <span class="text-sm text-gray-600">- Added on ${currentHighlighting.greenDay.toLowerCase()}</span>
        `;
        comparisonSummary.appendChild(item);
    });
    
    // Show removals
    removals.forEach(subject => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded';
        item.innerHTML = `
            <span class="font-semibold text-red-600">-</span>
            <span>${subject}</span>
            <span class="text-sm text-gray-600">- Missing on ${currentHighlighting.greenDay.toLowerCase()}</span>
        `;
        comparisonSummary.appendChild(item);
    });
}

// Update current day information
function updateCurrentDayInfo() {
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateStr = today.toLocaleDateString('en-US', options);
    
    let specialNote = '';
    if (today.getDay() === 0) {
        specialNote = ' (Weekend - Showing next school days)';
    } else if (today.getDay() === 6 && isSecondSaturday(today)) {
        specialNote = ' (2nd Saturday - Holiday)';
    }
    
    currentDayInfo.textContent = `Today: ${dateStr}${specialNote}`;
}

// Setup event listeners
function setupEventListeners() {
    yellowDaySelect.addEventListener('change', (e) => {
        currentHighlighting.yellowDay = e.target.value;
        saveUserPreferences();
        renderTimetable();
        updateComparisonSummary();
    });
    
    greenDaySelect.addEventListener('change', (e) => {
        currentHighlighting.greenDay = e.target.value;
        saveUserPreferences();
        renderTimetable();
        updateComparisonSummary();
    });
    
    resetBtn.addEventListener('click', () => {
        // Clear saved preferences
        localStorage.removeItem('timetablePreferences');
        
        // Reset to default highlighting
        currentHighlighting = { yellowDay: null, greenDay: null };
        setDefaultHighlighting();
        
        yellowDaySelect.value = currentHighlighting.yellowDay;
        greenDaySelect.value = currentHighlighting.greenDay;
        
        renderTimetable();
        updateComparisonSummary();
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
