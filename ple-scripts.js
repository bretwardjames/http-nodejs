document.addEventListener('DOMContentLoaded', () => {
    async function getPleData() {
        const response = await fetch('https://http-nodejs-production-5fbc.up.railway.app/ple-data');
        const data = await response.json();
        return data;
    }

    function updateElements(selector, content) {
        // console.log('Selector:', selector);
        // const elements = document.querySelectorAll(selector);
        const elements = document.getElementsByClassName(selector);
        // console.log('Elements found:', elements.length);
        Array.from(elements).forEach(el => {
            // console.log('Element:', el);
            if (selector.toLowerCase().includes('graphic')) {
                el.src = content;
            } else {
                el.innerText = content;
                el.style.padding = '0'
            }
            // console.log('Updated element:', el);
            // const innerDiv = el.querySelector('.elHeadline');
            // console.log('Inner div:', innerDiv);
            // if (innerDiv) {
            //     innerDiv.innerHTML = `<i class="fa_prepended fas fa-calendar-alt" contenteditable="false"></i><b>${content}</b>`;
            //     console.log('Updated inner div:', innerDiv);
            // } else {
            //     console.log('No .elHeadline found inside element:', el);
            //     el.innerHTML = `<i class="fa_prepended fas fa-calendar-alt" contenteditable="false"></i><b>${content}</b>`;
            //     console.log('Updated element:', el);
            // }
        });
    }

    async function checkAndUpdate() {
        // console.log('Fetching PLE data');
        const pleData = await getPleData();
        // console.log('PLE data:', pleData);

        Object.keys(pleData).forEach(key => {
            const shortKey = key.replace('PLE_', '').replace('promo_', '');
            // const selector = `[data-title="${shortKey}"]`;
            updateElements(shortKey, pleData[key]);
        });

        // console.log('All elements updated');
    }

    checkAndUpdate();
    // Add a delay to allow the dynamic content to load
    // setTimeout(checkAndUpdate, 3000); // 3 seconds delay
});