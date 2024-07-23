document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded');
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
        console.log('Selector:', selector);
        document.querySelectorAll(selector).forEach(el => {
            console.log('Element:', el);
            const innerDiv = el.querySelector('.elHeadline');
            console.log('Inner div:', innerDiv);
            if (innerDiv) {
                innerDiv.innerHTML = `<i class="fa_prepended fas fa-calendar-alt" contenteditable="false"></i><b>${content}</b>`;
                console.log('Updated inner div:', innerDiv);
            }
        });
    };
    console.log('Updating elements');
    updateElements('[data-title="eventDate"]', dateRange);
    console.log('Updated event date');
    updateElements('[data-title="eventLocation"]', location);
    console.log('Updated event location');
    updateElements('[data-title="eventPromo"]', promoVideo);
    console.log('Updated event promo');

    document.querySelectorAll('[data-title="eventYear"]').forEach(el => {
        if (el) {
            const updatedText = el.innerHTML.replace(/\b20\d{2}\b/g, eventYear);
            el.innerHTML = updatedText;
        }
    });
});