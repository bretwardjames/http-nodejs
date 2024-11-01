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

    if (!itemStr) {
        return null;
    }

    let item;
    try {
        item = JSON.parse(itemStr);
    } catch (error) {
        console.error(`Error parsing JSON for key ${key}:`, error);
        localStorage.removeItem(key);
        return null;
    }

    const now = new Date().getTime();

    if (now > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}

function setItemWithExpiry(key, value, days) {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + days * 24 * 60 * 60 * 1000,
    };
    localStorage.setItem(key, JSON.stringify(item));
}

function getItemFromStorage(key) {
    return localStorage.getItem(key);
}

async function getSheetRow(uuid) {
    try {
        const response = await fetch(`https://http-nodejs-ve-staging.up.railway.app/get-sheet-row?uuid=${uuid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rowData = await response.json();
        return rowData;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Run the function when the page loads

document.addEventListener('DOMContentLoaded', async function () {
    let currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('utm_source')) {
        const source = urlParams.get('source')
        if (source) {
            urlParams.set('utm_source', source);
        }
    }
    if (urlParams.has('submissionUUID')) {
        const submissionUUID = urlParams.get('submissionUUID');
        setItemWithExpiry('submissionUUID', submissionUUID, 7);
        urlParams.delete('submissionUUID');
        urlParams.forEach((value, key) => {
            setItemWithExpiry(`submission_${key}`, value, 7);
        });
    }
    urlParams.set('soSkip', 0);
    let baseUrl = getCurrentUrlWithoutParameters();
    let updatedUrl = `${baseUrl}?${urlParams.toString()}`.replace(/\+/g, '%20');
    let name = urlParams.get('Name');
    let email = urlParams.get('Email');
    let phone = urlParams.get('mobile');
    let resourceToInvest = urlParams.get('resources_to_invest');
    let householdIncome = urlParams.get('household_income');
    // console.log('Name:', name);
    // console.log('Email:', email);
    // console.log('Phone:', phone);
    // console.log('Resource to invest:', resourceToInvest);
    // console.log('Household income:', householdIncome);
    if (!name || !email || !phone || !resourceToInvest || !householdIncome) {
        // console.log('Something missing. Checking Local Storage')
        const localStorageItems = getItemsWithPrefix('submission_');
        const submissionUUID = getItemWithExpiry('submissionUUID');
        // console.log('Local Storage Items:', localStorageItems);

        for (const key in localStorageItems) {
            let shortKey = key.replace('submission_', '');
            const value = localStorageItems[key];
            if (value) {
                if (shortKey === 'source') shortKey = 'utm_source';
                urlParams.set(shortKey, value);
                // console.log('Adding Key:', shortKey, 'Value:', value);
            }

        }
        name = name || localStorageItems['submission_Name'] || localStorageItems['inf_field_FirstName'] + ' ' + localStorageItems['submission_inf_field_LastName'];
        email = email || localStorageItems['submission_Email'];
        phone = phone || localStorageItems['submission_mobile'];
        resourceToInvest = resourceToInvest || localStorageItems['submission_resources_to_invest'];
        householdIncome = householdIncome || localStorageItems['submission_household_income'];
        // console.log('Name:', name);
        // console.log('Email:', email);
        // console.log('Phone:', phone);
        // console.log('Resource to invest:', resourceToInvest);
        // console.log('Household income:', householdIncome);
        if (submissionUUID && (!name || !email || !phone || !resourceToInvest || !householdIncome)) {
            // console.log('Still missing. Fetching data from sheet');
            const rowData = await getSheetRow(submissionUUID);
            // console.log('Row Data:', rowData);
            if (rowData) {
                for (const key in rowData) {
                    let newKey = key;
                    if (key === 'uuid') continue;
                    if (key === 'created') continue;
                    if (key === 'updated') continue;
                    if (key === 'ipAddress') continue;
                    if (key === 'phone') newKey = 'mobile';
                    if (key === 'email') newKey = 'Email';
                    if (key === 'source') newKey = 'utm_source';
                    urlParams.set(newKey, rowData[key]);
                    // console.log('Adding Key to :', key, 'Value:', rowData[key]);
                    setItemWithExpiry(`submission_${key}`, rowData[key], 7);
                }

                if (!urlParams.get('Name')) {
                    const first = rowData['firstName'] || '';
                    const last = rowData['lastName'] || '';
                    let fullName = first
                    if (last) {
                        fullName += ` ${last}`;
                    }
                    urlParams.set('Name', fullName);
                    setItemWithExpiry('submission_Name', fullName, 7);
                    name = fullName;
                }

                name = name || `${rowData['firstName']} ${rowData['lastName']}`;
                email = email || rowData['email'];
                phone = phone || rowData['phone'];
                resourceToInvest = resourceToInvest || rowData['resources_to_invest'];
                householdIncome = householdIncome || rowData['household_income'];
                // console.log('Name:', name);
                // console.log('Email:', email);
                // console.log('Phone:', phone);
                // console.log('Resource to invest:', resourceToInvest);
            }
        }

        if (name && email && phone && resourceToInvest && householdIncome) {
            if (!urlParams.get('Name')) urlParams.set('Name', name);
            if (!urlParams.get('Email')) urlParams.set('Email', email);
            if (!urlParams.get('mobile')) urlParams.set('mobile', phone);
            if (!urlParams.get('resources_to_invest')) urlParams.set('resources_to_invest', resourceToInvest);
            if (!urlParams.get('household_income')) urlParams.set('household_income', householdIncome);
            urlParams.set('soSkip', 0);
            const newUrl = `${baseUrl}?${urlParams.toString()}`;
            window.location.replace(newUrl.replace(/\+/g, '%20'));
            return;
        }

        // console.log('Some issue with the data. Redirecting to the same page');
        // console.log('Name:', name);
        // console.log('Email:', email);
        // console.log('Phone:', phone);
        // console.log('Resource to invest:', resourceToInvest);
        // console.log('Household income:', householdIncome);
    }

    window.history.replaceState({}, document.title, updatedUrl);
    const isVip = urlParams.get('vip'); // Get the 'vip' parameter from the URL
    const qualifiedSection = document.querySelector('[data-title="qualified"]');
    const qualifiedVIPSection = document.querySelector('[data-title="qualifiedVIP"]');
    const subSection = document.querySelector('[data-title="qualifiedSubSection"]');
    const noSurveySection = document.querySelector('[data-title="noSurvey"]');
    const loadingSection = document.querySelector('[data-title="loadingGif"]');
    subSection.style.display = 'none';
    qualifiedSection.style.display = 'none';
    noSurveySection.style.display = 'none';

    if (resourceToInvest && name && email && householdIncome) {
        loadingSection.style.display = 'none';
        if (isVip === 'true') {
            qualifiedVIPSection.style.display = 'block';
        } else {
            qualifiedSection.style.display = 'block';
        }
        subSection.style.display = 'block';
        PTPageTriggers.listen({
            feature: "2339-vkkPrJwA2Z31qx6x5O4MEPcteUAlCZ50gme5uFiL"
        });
    } else {
        loadingSection.style.display = 'none';
        noSurveySection.style.display = 'block';
    }

    const button = document.querySelector('[data-title="buttonSurvey"]');
    button.querySelector('a').href += "?" + urlParams.toString();
    // console.log(button);
});