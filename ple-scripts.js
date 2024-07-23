document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded');
    const today = new Date();
    const startingDate = 'March 21, 2025';
    const endingDate = 'March 23, 2025';
    const dateRange = 'March 21-23, 2025';
    const location = 'Kalari Resort in Round Rock, TX';
    const promoVideo = 'https://player.vimeo.com/video/354208410?muted=1&autoplay=1&&title=0&byline=0&wmode=transparent&autopause=0';
    const ticketGraphicMobile = '';
    const ticketGraphicDesktop = '';
    const compTicketGraphicMobile = '';
    const compTicketGraphicDesktop = '';
    const dateDate = isNaN(startingDate) ? null : new Date(startingDate);
    const eventYear = dateDate ? dateDate.getFullYear() : today.getMonth() < 3 ? today.getFullYear() : today.getFullYear() + 1;

    const updateElements = (selector, content) => {
        console.log('Selector:', selector);
        const elements = document.querySelectorAll(selector);
        console.log('Elements found:', elements.length);
        elements.forEach(el => {
            console.log('Element:', el);
            const innerDiv = el.querySelector('.elHeadline');
            console.log('Inner div:', innerDiv);
            if (innerDiv) {
                innerDiv.innerHTML = `<i class="fa_prepended fas fa-calendar-alt" contenteditable="false"></i><b>${content}</b>`;
                console.log('Updated inner div:', innerDiv);
            } else {
                console.log('No .elHeadline found inside element:', el);
            }
        });
    };

    const checkAndUpdate = () => {
        console.log('Checking and updating elements');
        updateElements('[data-title="eventDate"]', dateRange);
        console.log('Updated event date');
        updateElements('[data-title="eventLocation"]', location);
        console.log('Updated event location');
        updateElements('[data-title="eventPromo"]', promoVideo);
        console.log('Updated event promo');
    };

    // Add a delay to allow the dynamic content to load
    setTimeout(checkAndUpdate, 3000); // 3 seconds delay
});