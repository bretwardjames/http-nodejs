(function (config) {
    function loadCSS(url) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        document.head.appendChild(link);
        console.log('CSS loaded:', url);
    }

    function loadJS(url, callback) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.onload = callback;
        document.body.appendChild(script);
        console.log('JS loaded:', url);
    }

    const containerId = 'embedded-form-container';
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
    }

    // Determine the environment
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const serverUrl = isLocal ? config.local : config.hosted;

    console.log('Fetching from:', serverUrl + '/form.html');

    // Load CSS
    loadCSS(`${serverUrl}/style.css`);

    // Array of external script URLs
    const externalScripts = [
        'https://static.plusthis.com/ext/PTFeatureBase.min.js',
        'https://static.plusthis.com/ext/PTPageTriggers.min.js'
    ];

    // Function to load all external scripts sequentially
    function loadExternalScripts(scripts, callback) {
        if (scripts.length === 0) {
            callback();
            return;
        }
        loadJS(scripts[0], () => {
            loadExternalScripts(scripts.slice(1), callback);
        });
    }

    fetch(`${serverUrl}/form.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
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

            // Load external scripts and then load the main script
            loadExternalScripts(externalScripts, function () {
                console.log('External scripts loaded.');
                window.serverUrl = serverUrl;
                loadJS(`${serverUrl}/scripts.js`, function () {
                    console.log('Main script loaded and executed.');
                    // Place any additional initialization code here if necessary
                });
            });
        })
        .catch(err => console.error('Failed to load the form:', err));
})({
    local: 'http://localhost:3000',
    hosted: 'https://http-nodejs-ve-production.up.railway.app'
});



