function getCurrentUrlWithoutParameters() {
    return window.location.origin + window.location.pathname;
}

function getItemsWithPrefix(prefix) {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
            const value = getItemWithExpiry(key) || getItemFromStorage(key);
            if (value !== null) {
                items[key] = value;
            }
        }
    }
    return items;
}

function getItemWithExpiry(key) {
    const itemStr = localStorage.getItem(key);

    // If the item doesn't exist, return null
    if (!itemStr) {
        return null;
    }

    let item;
    try {
        item = JSON.parse(itemStr);
    } catch (error) {
        console.error(`Error parsing JSON for key ${key}:`, error);
        localStorage.removeItem(key); // Remove corrupted item
        return null;
    }

    const now = new Date().getTime();

    // Compare the expiry time of the item with the current time
    if (now > item.expiry) {
        // If the item is expired, delete the item from storage and return null
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}

function getItemFromStorage(key) {
    return localStorage.getItem(key);
}

document.addEventListener('DOMContentLoaded', function () {
    let currentUrl = window.location.href;

    // Replace + with %20
    let updatedUrl = currentUrl.replace(/\+/g, '%20');
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('resources_to_invest') && !urlParams.get('Name') && !urlParams.get('Email') && !urlParams.get('household_income')) {
        const localStorageItems = getItemsWithPrefix('submission_');
        const baseUrl = getCurrentUrlWithoutParameters();
        let shouldReload = false;

        for (const key in localStorageItems) {
            const shortKey = key.replace('submission_', '');
            const value = localStorageItems[key];
            if (value) {
                urlParams.set(shortKey, value);
                shouldReload = true;
            }
        }

        if (!urlParams.get('Name') || !urlParams.get('Email')) {
            const firstName = localStorage.getItem('inf_field_FirstName');
            const lastName = localStorage.getItem('inf_field_LastName');
            const email = localStorage.getItem('inf_field_Email');
            if (firstName) {
                let name = firstName;
                if (lastName) {
                    name += ' ' + lastName;
                }
                urlParams.set('Name', name);
                shouldReload = true;
            }
            if (email) {
                urlParams.set('Email', email);
                shouldReload = true;
            }
        }

        if (shouldReload) {
            const newUrl = `${baseUrl}?${urlParams.toString()}`;
            window.location.replace(newUrl);
            return; // Ensure the function stops here if the page reloads
        }
    }

    // Update the URL in the address bar without reloading the page
    window.history.replaceState({}, document.title, updatedUrl);
    urlParams.forEach((value, key) => {
        localStorage.setItem(`submission_${key}`, value);
    });
    const qualifiedSection = document.querySelector('[data-title="qualified"]');
    const subSection = document.querySelector('[data-title="qualifiedSubSection"]');
    const noSurveySection = document.querySelector('[data-title="noSurvey"]');
    const loadingSection = document.querySelector('[data-title="loadingGif"]');
    subSection.style.display = 'none';
    qualifiedSection.style.display = 'none';
    noSurveySection.style.display = 'none';
    if (urlParams.get('resources_to_invest') && urlParams.get('Name') && urlParams.get('Email') && urlParams.get('household_income')) {
        loadingSection.style.display = 'none';
        qualifiedSection.style.display = 'block';
        subSection.style.display = 'block';
        PTPageTriggers.listen({
            feature: "2339-Q7F4DdRnndNpBxB9WICjNIxFVedO3dWjqNEyXVZp"
        });
    } else {
        loadingSection.style.display = 'none';
        noSurveySection.style.display = 'block';
    }

    const button = document.querySelector('[data-title="buttonSurvey"]');
    button.querySelector('a').href += "?" + urlParams.toString();
    console.log(button);
});


