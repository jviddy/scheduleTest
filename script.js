let selectedEvent = null;
let isDraggingOrResizing = false;

document.addEventListener('DOMContentLoaded', function() {
    generateSchedule();
    document.querySelector('.events').addEventListener('dblclick', handleDoubleClick);
    document.getElementById('event-name').addEventListener('change', updateEventFromDetails);
    document.getElementById('event-start').addEventListener('change', updateEventFromDetails);
    document.getElementById('event-end').addEventListener('change', updateEventFromDetails);
    document.getElementById('preset-duration').addEventListener('change', updateEventFromPresetDuration);
    document.getElementById('event-duration').addEventListener('change', updateEventFromCustomDuration);
});

function generateSchedule() {
    const hoursContainer = document.querySelector('.hours');
    const eventsContainer = document.querySelector('.events');
    
    for (let i = 7; i <= 22; i++) {
        const hour = document.createElement('div');
        hour.className = 'hour';
        hour.textContent = i < 12 ? `${i}AM` : i === 12 ? '12PM' : `${i-12}PM`;
        hoursContainer.appendChild(hour);
        
        const hourLine = document.createElement('div');
        hourLine.className = 'hour-line';
        hourLine.style.top = `${(i-7) * 60}px`;
        eventsContainer.appendChild(hourLine);
    }

    // Example: Add sample events
    addEvent('Sample Event 1', '09:00', '10:30');
    addEvent('Sample Event 2', '10:00', '11:00');
}

function handleDoubleClick(e) {
    const eventsContainer = e.currentTarget;
    const containerRect = eventsContainer.getBoundingClientRect();
    const y = e.clientY - containerRect.top;
    const hour = Math.floor(y / 60) + 7;
    const minute = Math.floor((y % 60) / 15) * 15;

    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    addEvent('New Event', startTime, endTime);
}

function addEvent(name, start, end) {
    const eventsContainer = document.querySelector('.events');
    const event = document.createElement('div');
    event.className = 'event';

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    const topPosition = (startHour - 7) * 60 + startMinute;
    const height = (endHour - startHour) * 60 + (endMinute - startMinute);

    event.style.top = `${topPosition}px`;
    event.style.height = `${height}px`;

    // Set data attributes for start and end times
    event.dataset.start = start;
    event.dataset.end = end;

    // Add drag handles
    const topHandle = document.createElement('div');
    topHandle.className = 'event-drag-handle event-drag-handle-top';
    event.appendChild(topHandle);

    const bottomHandle = document.createElement('div');
    bottomHandle.className = 'event-drag-handle event-drag-handle-bottom';
    event.appendChild(bottomHandle);

    // Add content container
    const content = document.createElement('div');
    content.className = 'event-content';
    content.textContent = name;
    event.appendChild(content);

    eventsContainer.appendChild(event);
    makeEventDraggable(event);
    makeEventResizable(event, topHandle, bottomHandle);

    event.addEventListener('click', (e) => {
        e.stopPropagation();
        updateEventDetails(event);
    });

    rearrangeOverlappingEvents();
}

function makeEventDraggable(eventElement) {
    const content = eventElement.querySelector('.event-content');
    let isDragging = false;
    let startY;
    let originalTop;

    content.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);

    function startDragging(e) {
        isDragging = true;
        isDraggingOrResizing = true;
        startY = e.clientY;
        originalTop = parseInt(eventElement.style.top);
        e.preventDefault();
    }

    function drag(e) {
        if (!isDragging) return;
        const deltaY = e.clientY - startY;
        const newTop = originalTop + deltaY;
        eventElement.style.top = `${newTop}px`;

        updateEventTimes(eventElement);
    }

    function stopDragging() {
        isDragging = false;
        isDraggingOrResizing = false;
        rearrangeOverlappingEvents();
    }
}

function makeEventResizable(eventElement, topHandle, bottomHandle) {
    let isResizing = false;
    let startY;
    let originalTop;
    let originalHeight;
    let resizingTop = false;

    topHandle.addEventListener('mousedown', startResizingTop);
    bottomHandle.addEventListener('mousedown', startResizingBottom);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);

    function startResizingTop(e) {
        isResizing = true;
        isDraggingOrResizing = true;
        resizingTop = true;
        startResize(e);
    }

    function startResizingBottom(e) {
        isResizing = true;
        isDraggingOrResizing = true;
        resizingTop = false;
        startResize(e);
    }

    function startResize(e) {
        startY = e.clientY;
        originalTop = parseInt(eventElement.style.top);
        originalHeight = parseInt(eventElement.style.height);
        e.preventDefault();
        e.stopPropagation();
    }

    function resize(e) {
        if (!isResizing) return;
        const deltaY = e.clientY - startY;

        if (resizingTop) {
            const newTop = Math.max(0, originalTop + deltaY);
            const newHeight = Math.max(20, originalHeight - deltaY);
            eventElement.style.top = `${newTop}px`;
            eventElement.style.height = `${newHeight}px`;
        } else {
            const newHeight = Math.max(20, originalHeight + deltaY);
            eventElement.style.height = `${newHeight}px`;
        }

        updateEventTimes(eventElement);
    }

    function stopResizing() {
        isResizing = false;
        isDraggingOrResizing = false;
        rearrangeOverlappingEvents();
    }
}

function updateEventTimes(eventElement) {
    const top = parseInt(eventElement.style.top);
    const height = parseInt(eventElement.style.height);

    const startHour = Math.floor(top / 60) + 7;
    const startMinute = top % 60;
    const endHour = Math.floor((top + height) / 60) + 7;
    const endMinute = (top + height) % 60;

    const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    eventElement.dataset.start = startTime;
    eventElement.dataset.end = endTime;

    if (selectedEvent === eventElement) {
        updateEventDetails(eventElement);
    }
}

function updateEventDetails(eventElement) {
    selectedEvent = eventElement;

    document.getElementById('event-name').value = eventElement.querySelector('.event-content').textContent;
    document.getElementById('event-start').value = eventElement.dataset.start;
    document.getElementById('event-end').value = eventElement.dataset.end;
    
    const [startHour, startMinute] = eventElement.dataset.start.split(':').map(Number);
    const [endHour, endMinute] = eventElement.dataset.end.split(':').map(Number);
    const durationInMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
    document.getElementById('event-duration').value = formatDuration(durationInMinutes);
}

function updateEventFromDetails() {
    if (!selectedEvent) return;

    const name = document.getElementById('event-name').value;
    const startTime = document.getElementById('event-start').value;
    const endTime = document.getElementById('event-end').value;

    selectedEvent.querySelector('.event-content').textContent = name;
    selectedEvent.dataset.start = startTime;
    selectedEvent.dataset.end = endTime;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const topPosition = (startHour - 7) * 60 + startMinute;
    const height = (endHour - startHour) * 60 + (endMinute - startMinute);

    selectedEvent.style.top = `${topPosition}px`;
    selectedEvent.style.height = `${height}px`;

    rearrangeOverlappingEvents();
}

function updateEventFromPresetDuration() {
    if (!selectedEvent) return;

    const durationInMinutes = parseInt(document.getElementById('preset-duration').value);
    const startTime = document.getElementById('event-start').value;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const endHour = startHour + Math.floor((startMinute + durationInMinutes) / 60);
    const endMinute = (startMinute + durationInMinutes) % 60;

    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    document.getElementById('event-end').value = endTime;

    updateEventFromDetails();
}

function updateEventFromCustomDuration() {
    if (!selectedEvent) return;

    const durationText = document.getElementById('event-duration').value;
    const durationInMinutes = parseDuration(durationText);
    const startTime = document.getElementById('event-start').value;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const endHour = startHour + Math.floor((startMinute + durationInMinutes) / 60);
    const endMinute = (startMinute + durationInMinutes) % 60;

    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    document.getElementById('event-end').value = endTime;

    updateEventFromDetails();
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

function parseDuration(durationText) {
    const parts = durationText.match(/(\d+)h\s*(\d*)m?/);
    const hours = parseInt(parts[1]) || 0;
    const minutes = parseInt(parts[2]) || 0;
    return hours * 60 + minutes;
}

function rearrangeOverlappingEvents() {
    if (isDraggingOrResizing) return;

    const events = Array.from(document.querySelectorAll('.event'));
    events.sort((a, b) => parseInt(a.style.top) - parseInt(b.style.top));

    const columns = [];

    events.forEach(event => {
        const eventTop = parseInt(event.style.top);
        const eventBottom = eventTop + parseInt(event.style.height);
        
        let columnIndex = columns.findIndex(column => {
            return column.every(columnEvent => {
                const columnEventTop = parseInt(columnEvent.style.top);
                const columnEventBottom = columnEventTop + parseInt(columnEvent.style.height);
                return eventBottom <= columnEventTop || eventTop >= columnEventBottom;
            });
        });

        if (columnIndex === -1) {
            columnIndex = columns.length;
            columns.push([]);
        }

        columns[columnIndex].push(event);
    });

    columns.forEach((column, columnIndex) => {
        column.forEach(event => {
            const width = 100 / columns.length;
            event.style.left = `${columnIndex * width}%`;
            event.style.width = `${width}%`;
        });
    });
}

// Close event details when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.event') && !e.target.closest('.event-details')) {
        document.querySelector('.event-details').style.display = 'none';
        selectedEvent = null;
    }
});
