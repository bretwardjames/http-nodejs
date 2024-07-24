(function () {
    const domain = window.location.hostname;
    console.log('Domain:', domain);
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = `expires=${date.toUTCString()}`;
        console.log('Setting cookie:', `${name}=${value};${expires};path=/;domain=${domain};SameSite=None;Secure`);
        document.cookie = `${name}=${value};${expires};path=/;domain=${domain};SameSite=None;Secure`;
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function checkCookieConsent() {
        return getCookie('cookie_consent') === 'true';
    }

    function showCookieConsentBanner() {
        console.log('Showing cookie consent banner');
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.style.position = 'fixed';
        banner.style.bottom = '0';
        banner.style.width = '100%';
        banner.style.backgroundColor = '#333';
        banner.style.color = '#fff';
        banner.style.textAlign = 'center';
        banner.style.padding = '10px';
        banner.innerHTML = `
            This site uses cookies to provide you with a great user experience. 
            By using this site, you accept our use of cookies.
            <button id="accept-cookies" style="margin-left: 10px; padding: 5px 10px; background-color: #4CAF50; color: white; border: none; cursor: pointer;">Accept</button>
        `;
        document.body.appendChild(banner);

        document.getElementById('accept-cookies').addEventListener('click', function () {
            console.log('Setting cookie consent');
            setCookie('cookie_consent', 'true', 365);
            banner.style.display = 'none';
            attachInputListeners();
        });
    }

    function attachInputListeners() {
        console.log('Attaching input listeners');
        ['first_name', 'last_name', 'email', 'phone'].forEach(key => {
            console.log('Key:', key);
            const element = document.querySelector(`[name="${key}"]`);
            console.log('Element:', element);
            if (element) {
                element.addEventListener('change', function () {
                    console.log('Setting cookie:', key, element.value);
                    setCookie(key, element.value, 7);
                });
            }
        });
        // Select all buttons
        const buttons = document.querySelectorAll('button');

        // Select all links
        const links = document.querySelectorAll('a[href]');


        // Combine all elements into a single NodeList
        const allClickableElements = Array.prototype.slice.call(buttons)
            .concat(Array.prototype.slice.call(links));

        // Function to handle click event and redirect with parameters
        function handleClick(event) {
            event.preventDefault();

            var firstName = "{{customer.first_name}}" || getCookie('first_name');
            var lastName = "{{customer.last_name}}" || getCookie('last_name');
            var email = "{{customer.email}}" || getCookie('email');
            var phone = "{{customer.phone}}" || getCookie('phone');

            var baseUrl = event.currentTarget.href || event.currentTarget.getAttribute('data-url');
            if (baseUrl) {
                var params = new URLSearchParams();
                params.append('inf_field_FirstName', firstName);
                params.append('inf_field_LastName', lastName);
                params.append('inf_field_Email', email);
                params.append('inf_field_Phone1', phone);

                var newUrl = baseUrl + '?' + params.toString();
                window.location.href = newUrl;
            }
        }

        // Attach click event listener to each clickable element
        allClickableElements.forEach(function (element) {
            console.log('Element:', element);
            // Check if the element is an anchor tag with an href or a button
            element.addEventListener('click', handleClick);
            console.log('Event listener added');

        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!checkCookieConsent()) {
            console.log('Cookie consent not given');
            showCookieConsentBanner();
        } else {
            attachInputListeners();
        }
    });
})();