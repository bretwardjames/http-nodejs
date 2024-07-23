function getItemWithExpiry(key) {
    const itemStr = localStorage.getItem(key);

    // If the item doesn't exist, return null
    if (!itemStr) {
        return null;
    }

    const item = JSON.parse(itemStr);
    const now = new Date().getTime();

    // Compare the expiry time of the item with the current time
    if (now > item.expiry) {
        // If the item is expired, delete the item from storage and return null
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}

function getItemsWithPrefix(prefix) {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
            const value = getItemWithExpiry(key);
            if (value !== null) {
                items[key] = value;
            }
        }
    }
    return items;
}

document.addEventListener('DOMContentLoaded', function () {

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

        if (shouldReload) {
            const newUrl = `${baseUrl}?${urlParams.toString()}`;
            window.location.replace(newUrl);
        }
    }

    // Update the URL in the address bar without reloading the page
    window.history.replaceState({}, document.title, updatedUrl);
    const qualifiedSection = document.querySelector('[data-title="qualified"]');
    const subSection = document.querySelector('[data-title="qualifiedSubSection"]');
    const noSurveySection = document.querySelector('[data-title="noSurvey"]');
    subSection.style.display = 'none';
    qualifiedSection.style.display = 'none';
    noSurveySection.style.display = 'none';
    if (urlParams.get('resources_to_invest') && urlParams.get('Name') && urlParams.get('Email') && urlParams.get('household_income')) {
        qualifiedSection.style.display = 'block';
        subSection.style.display = 'block';
    } else {
        noSurveySection.style.display = 'block';
    }

    const button = document.querySelector('[data-title="buttonSurvey"]')
    button.querySelector('a').href += "?" + urlParams.toString()
    console.log(button)
});


