// Function to get URL parameters from the script URL
function getScriptParams() {
    const scriptTag = document.currentScript || (function () {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();
    const scriptSrc = scriptTag.src;
    const params = new URLSearchParams(scriptSrc.split('?')[1]);

    const title = params.get('title') || 'Master the Inner Game of Business';
    const description = params.get('description') || 'Default Description';
    const location = params.get('location') || 'Default Location';
    const start = params.get('start') || '2024-09-16T10:00:00';
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 90);

    return {
        title,
        description,
        location,
        start: new Date(start).toISOString(),
        end: end.toISOString()
    };
}

// Function to generate Google Calendar URL
function generateGoogleCalendarUrl(params) {
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(params.title)}&details=${encodeURIComponent(params.description)}&location=${encodeURIComponent(params.location)}&dates=${encodeURIComponent(params.start)}/${encodeURIComponent(params.end)}`;
}

// Function to generate iCal download link
function generateICalUrl(params) {
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${params.title}
DESCRIPTION:${params.description}
LOCATION:${params.location}
DTSTART:${params.start.replace(/[-:]/g, '')}
DTEND:${params.end.replace(/[-:]/g, '')}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsData], { type: 'text/calendar' });
    return URL.createObjectURL(blob);
}

// Function to generate Outlook Calendar URL
function generateOutlookCalendarUrl(params) {
    return `https://outlook.live.com/owa/?path=/calendar/action/compose&subject=${encodeURIComponent(params.title)}&body=${encodeURIComponent(params.description)}&location=${encodeURIComponent(params.location)}&startdt=${encodeURIComponent(params.start)}&enddt=${encodeURIComponent(params.end)}`;
}

document.getElementById('addToCalendar').addEventListener('click', () => {
    const params = getScriptParams();

    const googleUrl = generateGoogleCalendarUrl(params);
    const icalUrl = generateICalUrl(params);
    const outlookUrl = generateOutlookCalendarUrl(params);

    const calendarLinks = `
        <a class="dropdown-item" href="${googleUrl}" target="_blank">Google Calendar</a><br>
        <a class="dropdown-item" href="${icalUrl}" download="event.ics">iCal</a><br>
        <a class="dropdown-item" href="${outlookUrl}" target="_blank">Outlook Calendar</a>
    `;

    // Inject the calendar options into the dropdown
    document.body.innerHTML += `<ul class="dropdown-menu" aria-labelledby="addToCalendar">${calendarLinks}</ul>`;
});