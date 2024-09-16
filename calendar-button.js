(function () {
    // Step 1: Get parameters from the script's URL
    const scriptTag = document.currentScript;
    const scriptSrc = scriptTag.src;
    const params = new URLSearchParams(scriptSrc.split('?')[1]);

    const title = params.get('title') || 'Default Title';
    const description = params.get('description') || 'Default Description';
    const location = params.get('location') || 'Default Location';
    const start = params.get('start') || '2024-09-16T10:00:00';
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 90);

    // Step 2: Create the calendar button HTML and inject into a parent div
    const container = document.getElementById('calendar-button-container') || document.body;
    container.innerHTML = `
        <div class="dropdown">
            <button class="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" id="addToCalendar">Add to Calendar</button>
            <ul class="dropdown-menu" aria-labelledby="addToCalendar" id="calendarLinks">
                <!-- Links will be dynamically injected here -->
            </ul>
        </div>
    `;

    // Step 3: Calendar event link generation (Google Calendar, iCal, Outlook)
    function generateGoogleCalendarUrl() {
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}&dates=${encodeURIComponent(start)}/${encodeURIComponent(end.toISOString())}`;
    }

    function generateICalUrl() {
        const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
DTSTART:${start.replace(/[-:]/g, '')}
DTEND:${end.toISOString().replace(/[-:]/g, '')}
END:VEVENT
END:VCALENDAR`;
        const blob = new Blob([icsData], { type: 'text/calendar' });
        return URL.createObjectURL(blob);
    }

    function generateOutlookCalendarUrl() {
        return `https://outlook.live.com/owa/?path=/calendar/action/compose&subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}&startdt=${encodeURIComponent(start)}&enddt=${encodeURIComponent(end.toISOString())}`;
    }

    // Step 4: Inject the calendar links when the button is clicked
    document.getElementById('addToCalendar').addEventListener('click', () => {
        const googleUrl = generateGoogleCalendarUrl();
        const icalUrl = generateICalUrl();
        const outlookUrl = generateOutlookCalendarUrl();

        document.getElementById('calendarLinks').innerHTML = `
            <li><a class="dropdown-item" href="${googleUrl}" target="_blank">Google Calendar</a></li>
            <li><a class="dropdown-item" href="${icalUrl}" download="event.ics">iCal</a></li>
            <li><a class="dropdown-item" href="${outlookUrl}" target="_blank">Outlook Calendar</a></li>
        `;
    });
})();