(function () {
    const containerId = 'embedded-form-container';
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
    }

    const serverUrl = process.env.RAILWAY_PRIVATE_DOMAIN || 'http://localhost:3000'; // Use the environment variable or default to localhost

    fetch(`${serverUrl}/form.html`)
        .then(response => response.text())
        .then(html => {
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
        .catch(err => console.warn('Failed to load the form:', err));
})();