(function () {
    const containerId = 'embedded-form-container';
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
    }

    // Configuration object
    const config = {
        local: 'http://localhost:3000',
        hosted: 'https://http-nodejs-production-5fbc.up.railway.app' // Replace with your actual hosted domain
    };

    // Determine the environment
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const serverUrl = isLocal ? config.local : config.hosted;

    console.log('Fetching from:', serverUrl + '/form.html');

    fetch(`${serverUrl}/form.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(html => {
            console.log('Fetched HTML:', html);
            container.innerHTML = html;

            // Execute any inline scripts
            const scripts = container.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                const script = scripts[i];
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                document.body.appendChild(newScript);
            }
        })
        .catch(err => console.error('Failed to load the form:', err));
})();