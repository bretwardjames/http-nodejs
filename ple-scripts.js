document.addEventListener('DOMContentLoaded', () => {
    const today = new Date()
    const startingDate = 'March 21, 2025'
    const endingDate = 'March 23, 2025'
    const dateRange = 'March 21-23, 2025'
    const location = 'Kalari Resort in Round Rock, TX'
    const promoVideo = 'https://player.vimeo.com/video/354208410?muted=1&autoplay=1&&title=0&byline=0&wmode=transparent&autopause=0'
    const ticketGraphicMobile = ''
    const ticketGraphicDesktop = ''
    const compTicketGraphicMobile = ''
    const compTicketGraphicDesktop = ''
    const dateDate = isNaN(startingDate) ? null : new Date(startingDate)
    const eventYear = dateDate ? dateDate.getFullYear() : today.getMonth() < 3 ? today.getFullYear() : today.getFullYear() + 1

    const updateElements = (selector, content) => {
        document.querySelectorAll(selector).forEach(el => {
            const innerDiv = el.querySelector('.elHeadline');
            if (innerDiv) {
                innerDiv.innerHTML = `<i class="fa_prepended fas fa-calendar-alt" contenteditable="false"></i><b>${content}</b>`;
            }
        });
    };

    updateElements('[data-title="eventDate"]', dateRange);
    updateElements('[data-title="eventLocation"]', location);
    updateElements('[data-title="eventPromo"]', promoVideo);

    document.querySelectorAll('[data-title="eventYear"]').forEach(el => {
        if (el) {
            const updatedText = el.innerHTML.replace(/\b20\d{2}\b/g, eventYear);
            el.innerHTML = updatedText;
        }
    });
});