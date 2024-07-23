console.log('Form JavaScript executed');
const nextButton = document.getElementById('nextButton');
async function checkAndUpdateContact(data) {
    try {
        const response = await fetch('https://http-nodejs-production-5fbc.up.railway.app/check-and-update-sheet', { // Update to your server URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('UUID:', result.uuid);

        // Store the UUID locally
        localStorage.setItem('submissionUUID', result.uuid);
        return result.uuid;
    } catch (error) {
        console.error('Error checking and updating contact:', error);
        return null;
    }
}
let contactId
async function getContactId(email) {
    if (contactId) return contactId
    const data = {
        apiName: "KEAP",
        endpoint: `v1/contacts/?email=${email}`,
        method: 'GET'
    };

    try {
        const response = await fetch('https://http-nodejs-production-5fbc.up.railway.app/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('Response:', result);

        if (!result.contacts || result.contacts.length === 0) {
            throw new Error('No contacts found');
        }

        return result.contacts[0].id;
    } catch (error) {
        console.log('Error:', error);
        return null;
    }
}
const routingLogic = {
    "entrepreneur_or_no": {
        "answers": {
            "I'm not a business owner and am not actively wanting to start one at this time.": {
                activate: ['interest_topics'],
            },
            "I'm a business owner or entrepreneur and I am currently in the process of starting, growing or scaling my business.": {
                activate: ["business_type", "how_long_in_business", "areas_for_support", "biggest_challenge", "ft_pt", "monthly_rev", "income_goal", "household_income", "resources_to_invest", "other_programs", "comitment_level", "urgency"],
                next: 3
            },
            "I'm not a business owner or entrepreneur (yet) but I have an idea and want to start my own business now/soon.": {
                activate: ['business_type', 'areas_for_support', 'ft_pt', 'income_goal', 'household_income', 'resources_to_invest', 'other_programs', 'comitment_level', 'urgency'],
                next: 4
            }
        }
    },
}
const formElements = Array.from(document.querySelectorAll('.infusion-field'))
console.log('Form Elements: ', formElements)
let formState = formElements.map(el => ({ element: el, isActive: false }));
console.log('Form State: ', formState)
let currentElementIndex = 0;
let navigationHistory = [];
function checkConditions(currentElement) {
    console.log('Checking conditions for element:', currentElement);
    const inputEls = currentElement.querySelectorAll('input, select, textarea');
    let elementName = currentElement.id === 'contact-info' ? 'contact-info' : (inputEls.length > 0 ? inputEls[0].name : null);
    let selectedValue = inputEls[0].value;
    console.log('Selected Value: ', selectedValue, 'Routing Logic: ', routingLogic)
    if (elementName && routingLogic[elementName]) {
        const conditions = routingLogic[elementName].answers[selectedValue];
        console.log('Conditions: ', conditions)
        if (conditions && conditions.activate) {
            console.log('Activating elements:', conditions.activate);
            conditions.activate.forEach(id => {
                console.log('Activating element:', id);
                const elIndex = formElements.findIndex(el => el.querySelector(`[id=${id}]`));
                console.log('Element Index:', elIndex)
                if (elIndex !== -1) {
                    console.log('Activating element:', id);
                    formState[elIndex].isActive = true;
                }
            });
        }
    }
}

function showQuestion(index, firstTime = false) {
    console.log('Showing question:', index);
    console.log('Form Elements: ', formElements)
    formElements.forEach((el, i) => {
        const inputEl = el.querySelector('input, select, textarea');
        if (i === index) {
            el.style.display = '';
            if (inputEl) {
                inputEl.setAttribute('required', 'required');
            }
        } else {
            el.style.display = 'none';
            if (inputEl) {
                inputEl.removeAttribute('required');
            }
        }
    });
    console.log('Form State:', formState);
    console.log('Updating buttons: ', index, formState.length - 1)
    const activeElements = formState.filter(i => i.isActive)
    console.log('Active Elements: ', activeElements)
    const indexCheck = activeElements.length < 3 ? 3 : activeElements.findIndex(i => i.element === formElements[index])
    console.log('Index Check: ', indexCheck)
    const timeToSubmit = indexCheck === activeElements.length - 1
    console.log('Time to Submit: ', timeToSubmit)
    document.getElementById('backButton').style.display = index === 0 ? 'none' : 'inline-block';
    nextButton.textContent = timeToSubmit ? 'Submit' : 'Next';
    nextButton.type = timeToSubmit ? 'submit' : 'button';
    nextButton.disabled = false;
    updateProgressBar(firstTime);
}

function encodeCurlyApostrophe(str) {
    return str // str.replace(/'/g, '&rsquo;');
}

function getNextIndex(currentElement) {
    console.log('Getting next index for element:', currentElement);
    let nextIndex = currentElementIndex + 1;

    while (nextIndex < formState.length && !formState[nextIndex].isActive) {
        nextIndex++;
    }

    if (nextIndex >= formState.length) {
        return 'submit';
    }
    console.log('Next index:', nextIndex);
    return nextIndex;
}

function handleBackButton() {
    console.log('Handling back button');
    if (navigationHistory.length > 0) {
        currentElementIndex = navigationHistory.pop();
        console.log('Navigating back to:', currentElementIndex);
        showQuestion(currentElementIndex);
    }
}

async function validatePhone(phoneNumber) {
    const response = await fetch(`https://http-nodejs-production-5fbc.up.railway.app/validatePhone`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phoneNumber: phoneNumber,
        })
    });

    const data = await response.json();
    console.log(data);
    return data; // Ensure the returned object has the expected structure
}

async function validateCurrentElement(element) {
    const inputEls = element.querySelectorAll('input, select, textarea');
    let isValid = true;

    for (const inputEl of inputEls) {
        if (inputEl.hasAttribute('required') && !inputEl.readOnly) {
            if (inputEl.value.trim() === '') {
                isValid = false;
            }
            if (inputEl.type === 'tel') {
                const validatedPhone = await validatePhone(inputEl.value.trim());
                if (!validatedPhone.valid) {
                    alert('Please enter a valid phone number with 7 to 15 digits.');
                    isValid = false;
                } else {
                    inputEl.value = validatedPhone.local_format;
                }

            } else if (inputEl.type === 'email' && !contactId) {
                contactId = await getContactId(inputEl.value);
                setItemWithExpiry('submission_Id', contactId, 7);
            }
        }
    }

    if (element.id === 'interest_topics' && selectedOptionsInterest.size === 0) {
        alert('Please select at least one topic.');
        isValid = false;
    }

    element.answered = isValid;
    return isValid;
}

function roundToZeroOrWhole(number) {
    return number <= 3 ? 0 : Math.floor(number);
}

function updateProgressBar(first = false) {
    console.log('Updating progress bar');
    const visibleElements = formState.filter(el => el.isActive).map(el => el.element);
    console.log('Visible elements:', visibleElements);
    const answeredElements = formElements.filter(el => el.answered);
    console.log('Answered elements:', answeredElements);
    const currentIndex = visibleElements.indexOf(formElements[currentElementIndex]);
    console.log('Current index:', currentIndex);
    if (currentIndex === -1) {
        return;
    }
    const totalQuestions = visibleElements.length;
    console.log('Total questions:', totalQuestions);
    const progress = first ? 1 : currentIndex === 1 ? 5 : ((answeredElements.length) / totalQuestions) * 100;
    console.log('Progress:', progress);
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progress');
    progressBar.style.width = `${progress}%`;
    progressPercent.innerText = `${roundToZeroOrWhole(progress)}%`;
    progressBar.setAttribute('aria-valuenow', progress);
    console.log('Progress bar updated');
}

async function applyPrefillAndSkip() {
    console.log('Applying prefill and skip logic');
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL Params:', urlParams);
    if (urlParams.has('ContactId')) {
        contactId = urlParams.get('ContactId');
        console.log('Found Contact ID:', contactId);
    }
    const skipPrequal = urlParams.get('skipPrequal') === 'true';
    console.log('Skip Prequal:', skipPrequal);
    let allDetailsProvided = true;
    const data = {};

    for (let index = 0; index < formElements.length; index++) {
        const el = formElements[index];
        const inputEls = el.querySelectorAll('input, select, textarea');
        const elementName = el.id === 'contact-info' ? 'contact-info' : (inputEls.length > 0 ? inputEls[0].name : null);

        if (elementName === 'contact-info') {
            for (let inputEl of inputEls) {
                const paramName = inputEl.name;
                if (urlParams.has(paramName) && urlParams.get(paramName).trim() !== "") {
                    let value = urlParams.get(paramName);
                    let readOnly = true;
                    if (paramName === 'inf_field_Phone1') {
                        const validatedPhone = await validatePhone(value.replace(/\D/g, ''));
                        if (validatedPhone.valid) {
                            value = validatedPhone.local_format;
                        } else {
                            allDetailsProvided = false;
                            readOnly = false;
                        }
                    }
                    inputEl.value = value;
                    inputEl.readOnly = readOnly;
                    if (readOnly) {
                        inputEl.title = "This field is prefilled and cannot be edited.";
                        inputEl.classList.add('tooltip-trigger'); // Add class for styling
                    }
                    data[paramName] = value;
                } else {
                    allDetailsProvided = false;
                    document.getElementById('contact-info').style.display = 'block';
                }
            }
        }

        if (skipPrequal) {
            console.log('Skipping prequal question and activating business questions');
            const prequalQuestions = ['business_type', 'areas_for_support', 'ft_pt', 'income_goal', 'household_income', 'resources_to_invest', 'other_programs', 'comitment_level', 'urgency'];
            prequalQuestions.forEach(id => {
                const elIndex = formElements.findIndex(el => el.querySelector(`[id=${id}]`));
                if (elIndex !== -1) {
                    console.log('Activating element:', formState[elIndex]);
                    formState[elIndex].isActive = true;
                }
            });
        } else {
            console.log('Not skipping prequal question');
            if (elementName === 'contact-info' || elementName === 'entrepreneur_or_no') {
                console.log('Activating element:', elementName);
                formState[index].isActive = true;
            }
        }
    }

    // Check for existing UUID in local storage
    let uuid = getItemWithExpiry('submissionUUID');
    if (uuid) {
        data.uuid = uuid;
    }

    // Send data to server
    if (Object.keys(data).length > 0) {
        try {
            const response = await fetch('https://http-nodejs-production-5fbc.up.railway.app/check-and-update-sheet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.uuid) {
                setItemWithExpiry('submissionUUID', result.uuid, 7);
                for (const key in data) {
                    setItemWithExpiry(`submission_${key}`, data[key], 7);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    if (allDetailsProvided) {
        console.log('All details provided, skipping contact-info');
        currentElementIndex = getNextIndex(currentElementIndex); // Start with the first question after contact-info
    }
    console.log('Showing question at index: ', currentElementIndex);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('loaded').style.display = 'block';

    showQuestion(currentElementIndex, true);
}

function init() {
    applyPrefillAndSkip(); // Call the function without `await`
}

function handleSubmit() {
    console.log('Handling form submission');
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL Params:', urlParams);
    let soSkip = false;
    formElements.forEach(el => {
        const inputEls = el.querySelectorAll('input, select, textarea');
        inputEls.forEach((inputEl, idx) => {
            let name = inputEl.name;
            if (inputEl.name === 'inf_field_FirstName') {
                name = 'Name';
                inputEl.value += ' ' + inputEls[idx + 1].value;
            } else if (inputEl.name === 'inf_field_Email') {
                name = 'Email';
                soSkip = true;
            } else if (inputEl.name === 'inf_field_Phone1') {
                name = 'mobile';
            }
            if (inputEl && inputEl.value) {
                const encodedValue = inputEl.value.replace(/\+/g, '%20');
                urlParams.append(name, encodedValue);
            }
        });
    });
    if (soSkip) {
        urlParams.append('soSkip', 1);
        setItemWithExpiry('soSkip', 1, 7);
    } else {
        urlParams.append('soSkip', 0);
        setItemWithExpiry('soSkip', 0, 7);
    }
    if (contactId) {
        urlParams.append('Id', contactId);
    }
    let redirectUrl = 'https://davidbayercoaching.com/ss-app-results'; // Default thank you page
    const notEntrepreneur = urlParams.get('entrepreneur_or_no') === "I'm not a business owner and am not actively wanting to start one at this time.";
    const preQualified = urlParams.get('preQualified') === 'true';
    const resources = urlParams.get('resources_to_invest') === "I know I need to invest to grow my business but I'm in a tight spot and don't have any resources available at this time." ? 'none' : urlParams.get('resources_to_invest') === "$500 - $2k" ? 'low' : 'qualified';
    const hhi = urlParams.get('household_income') === 'Less than $50k' ? 'none' : urlParams.get('household_income') === '$50k to $75k' ? 'low' : 'qualified';
    if (!preQualified && (notEntrepreneur || (resources === 'none' && (hhi === 'none' || hhi === 'low')) || hhi === 'none' && resources === 'low')) {
        redirectUrl = 'https://davidbayercoaching.com/ss-app-results-unq';
    }
    console.log(`${redirectUrl}?${urlParams.toString().replace(/\+/g, '%20')}`)
    window.location.href = `${redirectUrl}?${urlParams.toString()}`;
}

// Function to set an item with an expiry in local storage
function setItemWithExpiry(key, value, days) {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + days * 24 * 60 * 60 * 1000, // Expiry in days
    };
    localStorage.setItem(key, JSON.stringify(item));
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

async function handleNextButton() {
    nextButton.disabled = true;
    nextButton.textContent = 'Processing...';

    console.log('Handling next button');
    const currentElement = formElements[currentElementIndex];
    console.log('Current element:', currentElement);
    const valid = await validateCurrentElement(currentElement);
    console.log('Element is valid:', valid);
    if (!valid) {
        alert('Please fill in the required fields.');
        nextButton.disabled = false;
        nextButton.textContent = 'Next';
        return;
    }

    // Create the data object with key-value pairs from the form fields
    const formData = {};
    const fields = Array.from(currentElement.querySelectorAll('input[name], textarea[name], select[name]'));
    console.log('Fields:', fields);
    const emailInvalid = fields.some(field => {
        if (field.name.toLowerCase().includes('email')) {
            const email = field.value;
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regex.test(email)) {
                alert('Please enter a valid email address.');
                nextButton.disabled = false;
                nextButton.textContent = 'Next';
                return true;
            }
        }
        return false;
    });
    if (emailInvalid) {
        console.log('Email is invalid');
        return;
    }

    fields.forEach(field => {
        formData[field.name] = field.value;
    });

    // Check for existing UUID in local storage
    let uuid = getItemWithExpiry('submissionUUID');
    if (uuid) {
        formData.uuid = uuid;
    }

    // Send data to server
    try {
        const response = await fetch('https://http-nodejs-production-5fbc.up.railway.app/check-and-update-sheet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (result.uuid) {
            // Store the UUID in local storage with a 7-day expiration from today
            setItemWithExpiry('submissionUUID', result.uuid, 7);

            // Store each form field with the prefix 'submission_'
            for (const key in formData) {
                setItemWithExpiry(`submission_${key}`, formData[key], 7);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }

    // Check conditions and update the state based on the current element
    console.log('Checking conditions for element:', currentElement);
    checkConditions(currentElement);

    // Get the next active index
    const nextIndex = getNextIndex(currentElement);
    console.log('Next index:', nextIndex);
    if (nextIndex === 'submit') {
        console.log('Submitting form');
        handleSubmit();
    } else {
        if (navigationHistory[navigationHistory.length - 1] !== currentElementIndex) {
            navigationHistory.push(currentElementIndex);
        }
        currentElementIndex = nextIndex;
        console.log('Navigating to:', currentElementIndex);
        showQuestion(currentElementIndex);
        console.log(formElements, currentElementIndex, nextIndex);
        if (window.innerWidth <= 768) {
            document.getElementById('progressBar').scrollIntoView({ behavior: 'smooth' });
        }
    }
}

nextButton.addEventListener('click', function (event) {
    event.preventDefault();
    handleNextButton();
});
document.getElementById('backButton').addEventListener('click', function (event) {
    event.preventDefault();
    handleBackButton();
});

document.querySelectorAll('.checkbox-button').forEach(button => {
    button.addEventListener('click', function () {
        const checkbox = this.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        this.classList.toggle('checked', checkbox.checked);
    });
});

const interestOptions = [
    { display: "How to make more money", value: "How to make more money" },
    { display: "Relationships", value: "Relationships" },
    { display: "Health", value: "Health" },
    { display: "Spirituality", value: "Spirituality" },
    { display: "Learning how to facilitate David's frameworks for others", value: "Learning how to facilitate David's frameworks for others" },
    { display: "Parenting", value: "Parenting" },
    { display: "Entrepreneurship/Starting a business", value: "Entrepreneurship/Starting a business" },
    { display: "Attending David's live events", value: "Attending David's live events" }
];

const interestSelectedOptions = new Set();
const interestButtonContainer = document.getElementById('button-container-interest');
const interestHiddenSelect = document.getElementById('interest_topics');

interestOptions.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-outline-primary m-2';
    button.textContent = option.display;
    button.style.width = '100%';
    button.style.whiteSpace = 'normal';
    const isSelected = Array.from(interestHiddenSelect.options).some(opt => opt.value === option.value && opt.selected);
    if (isSelected) {
        interestSelectedOptions.add(option.value);
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-primary');
    }
    button.addEventListener('click', function () {
        if (interestSelectedOptions.has(option.value)) {
            interestSelectedOptions.delete(option.value);
            button.classList.remove('btn-primary');
            button.classList.add('btn-outline-primary');
        } else {
            interestSelectedOptions.add(option.value);
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-primary');
        }
        updateInterestHiddenInput();
    });
    interestButtonContainer.appendChild(button);
});

function updateInterestHiddenInput() {
    const options = interestHiddenSelect.options;
    for (let i = 0; i < options.length; i++) {
        options[i].selected = interestSelectedOptions.has(options[i].value);
    }
}

const options = [
    { display: "Creating powerful differentiated messaging.", value: "Creating powerful differentiated messaging." },
    { display: "Putting together the details of an irresistible offer(s)", value: "Putting together the details of an irresistible offer(s)" },
    { display: "Having a clear action plan that I can follow every week", value: "Having a clear action plan that I can follow every week" },
    { display: "Consistently getting in front of my ideal client/prospects", value: "Consistently getting in front of my ideal client/prospects" },
    { display: "Maintaining an unshakeable mindset so I can make consistent progress", value: "Maintaining an unshakeable mindset so I can make consistent progress" },
    { display: "Finding ways to generate more consistent 'now' revenue", value: "Finding ways to generate more consistent 'now' revenue" },
    { display: "Taking my already profitable business and scaling to the next level", value: "Taking my already profitable business and scaling to the next level" },
    { display: "Further developing my enrollment skills", value: "Further developing my enrollment skills" },
    { display: "Knowing what strategy to focus on now or next", value: "Knowing what strategy to focus on now or next" }
];

const selectedOptions = new Set();
const buttonContainer = document.getElementById('button-container');
const hiddenSelect = document.getElementById('areas_for_support');
options.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-outline-primary m-2';
    button.textContent = option.display;
    button.style.width = '100%';
    button.style.whiteSpace = 'normal';
    const isSelected = Array.from(hiddenSelect.options).some(opt => opt.value === option.value && opt.selected);
    if (isSelected) {
        selectedOptions.add(option.value);
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-primary');
    }
    button.addEventListener('click', function () {
        if (selectedOptions.has(option.value)) {
            selectedOptions.delete(option.value);
            button.classList.remove('btn-primary');
            button.classList.add('btn-outline-primary');
        } else {
            selectedOptions.add(option.value);
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-primary');
        }
        updateHiddenInput();
    });
    buttonContainer.appendChild(button);
});

function updateHiddenInput() {
    const options = hiddenSelect.options;
    for (let i = 0; i < options.length; i++) {
        if (selectedOptions.has(options[i].value)) {
            options[i].selected = true;
        } else {
            options[i].selected = false;
        }
    }
}

document.querySelectorAll('#button-container-describesyou .btn').forEach(button => {
    button.addEventListener('click', function () {
        document.querySelectorAll('#button-container-describesyou .btn').forEach(btn => btn.classList.remove('btn-primary'));
        button.classList.add('btn-primary');
        document.getElementById('entrepreneur_or_no').value = button.getAttribute('data-value');
    });
});

const selects = document.querySelectorAll('select.form-control');
selects.forEach(select => {
    const parentDiv = select.parentElement;
    const options = Array.from(select.options);
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'infusion-field-input-container button-container';
    const isRange = options.every((option, index) => {
        if (index === 0) return true;
        return !isNaN(option.value) && +option.value === index;
    });
    if (isRange && options.length === 11) {
        const sliderLabel = document.createElement('label');
        sliderLabel.textContent = "Select a value:";
        sliderLabel.className = 'range-label';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 1;
        slider.max = 10;
        slider.value = 1;
        slider.className = 'form-range';
        const sliderValue = document.createElement('span');
        sliderValue.textContent = slider.value;
        sliderValue.className = 'range-value';
        slider.addEventListener('input', function () {
            sliderValue.textContent = slider.value;
            select.value = slider.value;
        });
        buttonContainer.appendChild(sliderLabel);
        buttonContainer.appendChild(slider);
        buttonContainer.appendChild(sliderValue);
    } else {
        options.forEach(option => {
            if (option.value !== '') {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-outline-primary btn-sm';
                button.textContent = option.textContent;
                button.style.whiteSpace = 'normal';
                button.setAttribute('data-value', option.value);
                button.addEventListener('click', function () {
                    buttonContainer.querySelectorAll('.btn').forEach(btn => btn.classList.remove('btn-primary'));
                    button.classList.add('btn-primary');
                    select.value = button.getAttribute('data-value');
                });
                buttonContainer.appendChild(button);
            }
        });
    }
    select.style.display = 'none';
    parentDiv.appendChild(buttonContainer);
});

init();

console.log('Made it to the end of the script');