// Calendar functionality

// Array of month names for display
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

// Current date tracking - used to determine which month to display
let currentDate = new Date();

// Selected date tracking - used to highlight the user-selected date
let selectedDate = new Date();

// Today's date tracking - used to highlight today's date
let today = new Date();

// Function to generate random events for demonstration purposes
// In a real application, this would fetch actual event data
function generateRandomEvents(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const events = {};
    
    // Generate random events for about 30% of the days
    for (let i = 1; i <= daysInMonth; i++) {
        if (Math.random() < 0.3) {
            const eventTypes = [];
            const numEvents = Math.floor(Math.random() * 3) + 1;
            
            // Randomly assign event types (red, yellow, green)
            for (let j = 0; j < numEvents; j++) {
                const eventType = Math.floor(Math.random() * 3);
                if (eventType === 0 && !eventTypes.includes('red')) eventTypes.push('red');
                else if (eventType === 1 && !eventTypes.includes('yellow')) eventTypes.push('yellow');
                else if (eventType === 2 && !eventTypes.includes('green')) eventTypes.push('green');
            }
            
            events[i] = eventTypes;
        }
    }
    
    return events;
}

// Main function to render the calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month/year display in the header
    const monthYearElement = document.getElementById('monthYear');
    if (monthYearElement) {
        monthYearElement.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    // Adjust for Monday as first day (0 = Monday, 1 = Tuesday, etc.)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    // Get number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get number of days in previous month (for displaying trailing days)
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Generate random events for this month
    const events = generateRandomEvents(year, month);
    
    // Clear existing calendar days
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    
    calendarDays.innerHTML = '';
    
    // Add previous month's trailing days (faded appearance)
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dateCell = document.createElement('div');
        dateCell.className = 'date-cell faded';
        
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        
        const dots = document.createElement('div');
        dots.className = 'dots';
        
        dateCell.appendChild(dateNumber);
        dateCell.appendChild(dots);
        calendarDays.appendChild(dateCell);
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement('div');
        dateCell.className = 'date-cell';
        
        // Check if this is today's date
        const isToday = year === today.getFullYear() && 
                       month === today.getMonth() && 
                       day === today.getDate();
        
        // Check if this is the selected date
        const isSelected = year === selectedDate.getFullYear() && 
                          month === selectedDate.getMonth() && 
                          day === selectedDate.getDate();
        
        // Add today-date class if it's today
        if (isToday) {
            dateCell.classList.add('today-date');
        }
        
        // Add selected class if it's selected
        if (isSelected) {
            dateCell.classList.add('selected');
            // Add bubbles for liquid effect
            addBubbles(dateCell);
        }
        
        // Create date number
        const dateNumber = document.createElement('div');
        if (isToday) {
            dateNumber.className = 'date-number today'; // Special styling for today
        } else {
            dateNumber.className = 'date-number';
        }
        dateNumber.textContent = day;
        
        // Create dots container
        const dots = document.createElement('div');
        dots.className = 'dots';
        
        // Add event dots if they exist for this day
        if (events[day]) {
            events[day].forEach(eventType => {
                const dot = document.createElement('div');
                dot.className = `dot ${eventType}`;
                dots.appendChild(dot);
            });
        }
        
        dateCell.appendChild(dateNumber);
        dateCell.appendChild(dots);
        
        // Add click event listener for date selection
        dateCell.addEventListener('click', () => {
            // Remove previous selection
            const prevSelected = document.querySelector('.selected');
            if (prevSelected) {
                prevSelected.classList.remove('selected');
                // Remove bubbles from previous selection
                const bubbles = prevSelected.querySelectorAll('.bubble');
                bubbles.forEach(bubble => bubble.remove());
            }
            
            // Add selection to clicked date
            dateCell.classList.add('selected');
            // Add bubbles for liquid effect
            addBubbles(dateCell);
            
            // Update selected date tracking
            selectedDate = new Date(year, month, day);
        });
        
        calendarDays.appendChild(dateCell);
    }
    
    // Add next month's leading days to fill the grid (faded appearance)
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42
    
    for (let day = 1; day <= remainingCells; day++) {
        const dateCell = document.createElement('div');
        dateCell.className = 'date-cell faded';
        
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        
        const dots = document.createElement('div');
        dots.className = 'dots';
        
        dateCell.appendChild(dateNumber);
        dateCell.appendChild(dots);
        calendarDays.appendChild(dateCell);
    }
}

// Function to add bubble effects to selected dates
// Creates floating bubbles within the color spill effect for a more liquid appearance
function addBubbles(dateCell) {
    for (let i = 1; i <= 3; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        dateCell.appendChild(bubble);
    }
}

// Calendar Modal Functions
function openCalendarModal() {
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.style.display = 'flex';
        // Render calendar when modal opens
        renderCalendar();
    }
}

function closeCalendarModal() {
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Event listeners - wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Calendar button click handler
    const calendarBtn = document.getElementById('calendarBtn');
    if (calendarBtn) {
        calendarBtn.addEventListener('click', openCalendarModal);
    }
    
    // Close modal when clicking overlay
    const calendarModal = document.getElementById('calendarModal');
    if (calendarModal) {
        calendarModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-modal-overlay')) {
                closeCalendarModal();
            }
        });
    }
    
    // Previous month navigation button event listener
    const prevMonthBtn = document.getElementById('prevMonth');
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    // Next month navigation button event listener
    const nextMonthBtn = document.getElementById('nextMonth');
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('calendarModal');
            if (modal && modal.style.display === 'flex') {
                closeCalendarModal();
            }
        }
    });
});

