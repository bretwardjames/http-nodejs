(function () {
    const domain = window.location.hostname;
    // console.log('Domain:', domain);
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = `expires=${date.toUTCString()}`;
        // console.log('Setting cookie:', `${name}=${value};${expires};path=/;domain=${domain};SameSite=None;Secure`);
        document.cookie = `${name}=${value};${expires};path=/;domain=${domain};SameSite=None;Secure`;
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function deleteCookie(name) {
        setCookie(name, '', -1);
    }

    async function checkCookieConsent() {
        let consent = getCookie('cookie_consent')
        consent = consent === 'true' ? true : consent === 'false' ? false : undefined;
        if (consent === undefined) {
            try {
                const requestObject = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        apiName: "IPINFO",
                        endpoint: `/`,
                        method: "GET"
                    })
                };
                const response = await fetch('https://http-nodejs-production-5fbc.up.railway.app/proxy', requestObject);
                const data = await response.json();
                // List of EU country codes
                const euCountries = [
                    'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR',
                    'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO',
                    'SE', 'SI', 'SK'
                ];

                // Determine if the user is in the EU
                const isInEU = euCountries.includes(data.country);
                if (isInEU) {
                    setCookie('cookie_consent', 'false', 365);
                    consent = 'false';
                }
            } catch (error) {
                console.error('Error checking EU status:', error);
            }
        }
        return consent;
    }

    function showCookieConsentBanner() {
        // console.log('Showing cookie consent banner');
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.style.position = 'fixed';
        banner.style.bottom = '0';
        banner.style.width = '100%';
        banner.style.backgroundColor = 'rgb(51, 51, 51, 90%)';
        banner.style.color = '#fff';
        banner.style.textAlign = 'center';
        banner.style.padding = '1vh';
        banner.innerHTML = `
            <div style="margin-bottom:10px">We use cookies store basic contact details to make your experience smoother. By continuing to use this site, you agree to our use of cookies.</div>
            <button id="accept-cookies" style="margin-left: 10px; padding: 5px 10px; background-color: #4CAF50; color: white; border: none; cursor: pointer;">Allow and Dismiss</button>
            <a id="decline-cookies" style="margin-left: 10px; color: red; border: none; cursor: pointer; font-size: smaller;">Decline Cookies</a>
                    `;
        document.body.appendChild(banner);
        document.getElementById('decline-cookies').addEventListener('click', function () {
            setCookie('cookie_consent', 'false', 365);
            // console.log('Setting cookie consent');
            clearTrackingData();

            banner.style.display = 'none';
        });

        document.getElementById('accept-cookies').addEventListener('click', function () {
            // console.log('Setting cookie consent');
            setCookie('cookie_consent', 'true', 365);
            banner.style.display = 'none';
            attachInputListeners();
            showRevokeConsentIcon();
        });
    }

    function attachInputListeners() {
        // console.log('Attaching input listeners');
        ['first_name', 'last_name', 'email', 'phone'].forEach(key => {
            // console.log('Key:', key);
            const element = document.querySelector(`[name="${key}"]`);
            // console.log('Element:', element);
            if (element) {
                if (element.value) {
                    // console.log('Setting cookie:', key, element.value);
                    setCookie(key, element.value, 7);
                }
                element.addEventListener('change', function () {
                    // console.log('Setting cookie:', key, element.value);
                    setCookie(key, element.value, 7);
                });
            }
        });
        // // Select all buttons
        // const buttons = document.querySelectorAll('button');

        // // Select all links
        // const links = document.querySelectorAll('a[href]');


        // // Combine all elements into a single NodeList
        // const allClickableElements = Array.prototype.slice.call(buttons)
        //     .concat(Array.prototype.slice.call(links));

        // // Function to handle click event and redirect with parameters
        // function handleClick(event) {
        //     event.preventDefault();

        //     const firstName = getCookie('first_name');
        //     const lastName = getCookie('last_name');
        //     const email = getCookie('email');
        //     const phone = getCookie('phone');

        //     const baseUrl = event.currentTarget.href || event.currentTarget.getAttribute('data-url');
        //     if (baseUrl) {
        //         let params = new URLSearchParams();
        //         params.append('blank', 'true');
        //         if (firstName) params.append('inf_field_FirstName', firstName);
        //         if (lastName) params.append('inf_field_LastName', lastName);
        //         if (email) params.append('inf_field_Email', email);
        //         if (phone) params.append('inf_field_Phone1', phone);

        //         const newUrl = baseUrl + '?' + params.toString();
        //         window.location.href = newUrl;
        //     }
        // }

        // // Attach click event listener to each clickable element
        // allClickableElements.forEach(function (element) {
        //     console.log('Element:', element);
        //     // Check if the element is an anchor tag with an href or a button
        //     element.addEventListener('click', handleClick);
        //     console.log('Event listener added');

        // });
    }

    function clearTrackingData() {
        // Remove all relevant cookies
        const trackingCookies = ['first_name', 'last_name', 'email', 'phone', 'cookie_consent'];
        trackingCookies.forEach(cookie => deleteCookie(cookie));

        // Clear local storage
        localStorage.clear();

        // Clear session storage
        sessionStorage.clear();

        // console.log('Tracking data cleared');
    }

    function showRevokeConsentIcon() {
        const revokeDiv = document.createElement('div');
        revokeDiv.id = 'revoke-cookie-consent';
        revokeDiv.style.position = 'fixed';
        revokeDiv.style.bottom = '20px';
        revokeDiv.style.right = '20px';
        revokeDiv.style.zIndex = '1000';

        const revokeBtn = document.createElement('button');
        revokeBtn.id = 'revoke-btn';
        revokeBtn.title = 'Revoke Cookie Consent';
        revokeBtn.style.backgroundColor = '#f1c40f';
        revokeBtn.style.border = 'none';
        revokeBtn.style.borderRadius = '50%';
        revokeBtn.style.padding = '10px';
        revokeBtn.style.cursor = 'pointer';
        revokeBtn.style.fontSize = '24px';
        revokeBtn.innerText = '🍪';

        revokeBtn.addEventListener('click', function () {
            clearTrackingData();
            alert('Cookie tracking has been disabled and all tracking data has been cleared.');
            setTimeout(() => {
                location.reload();  // Reload the page to apply changes
            }, 500); // 500ms delay
        });

        revokeDiv.appendChild(revokeBtn);
        document.body.appendChild(revokeDiv);
    }

    document.addEventListener('DOMContentLoaded', async function () {
        const consentStatus = await checkCookieConsent();

        if (consentStatus) {
            // Show the revoke consent icon if the user has accepted cookies
            showRevokeConsentIcon();
        }

        if (!consentStatus && !window.location.href.includes('questionnaire')) {
            // console.log('Cookie consent not given or declined');
            showCookieConsentBanner();
        }

        if (consentStatus !== 'false') {
            attachInputListeners();
        }
    });
})();