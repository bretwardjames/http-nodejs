console.log('Form JavaScript executed');
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
let formState = formElements.map(el => ({ element: el, isActive: false }));
let currentElementIndex = 0;
let navigationHistory = [];

function checkConditions(currentElement) {
    const inputEls = currentElement.querySelectorAll('input, select, textarea');
    let elementName = currentElement.id === 'contact-info' ? 'contact-info' : (inputEls.length > 0 ? inputEls[0].name : null);
    let selectedValue = inputEls[0].value;

    if (elementName && routingLogic[elementName]) {
        const conditions = routingLogic[elementName].answers[selectedValue];

        if (conditions && conditions.activate) {
            conditions.activate.forEach(id => {
                const elIndex = formElements.findIndex(el => el.querySelector(`[id=${id}]`));
                if (elIndex !== -1) {
                    formState[elIndex].isActive = true;
                }
            });
        }
    }
}

function showQuestion(index, firstTime = false) {
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
    document.getElementById('backButton').style.display = index === 0 ? 'none' : 'inline-block';
    document.getElementById('nextButton').textContent = index === formElements.length - 1 ? 'Submit' : 'Next';
    document.getElementById('nextButton').type = index === formElements.length - 1 ? 'submit' : 'button';
    updateProgressBar(firstTime);
}

function encodeCurlyApostrophe(str) {
    return str // str.replace(/'/g, '&rsquo;');
}

function getNextIndex(currentElement) {
    let nextIndex = currentElementIndex + 1;

    while (nextIndex < formState.length && !formState[nextIndex].isActive) {
        nextIndex++;
    }

    if (nextIndex >= formState.length) {
        return 'submit';
    }

    return nextIndex;
}

function handleBackButton() {
    if (navigationHistory.length > 0) {
        currentElementIndex = navigationHistory.pop();
        showQuestion(currentElementIndex);
    }
}

function isValidPhoneNumber(phoneNumber) {
    return /^\d{7,15}$/.test(phoneNumber.trim());
}

async function validateCurrentElement(element) {
    const inputEls = element.querySelectorAll('input, select, textarea');
    let isValid = true;

    for (const inputEl of inputEls) {
        if (inputEl.hasAttribute('required') && !inputEl.readOnly) {
            if (inputEl.value.trim() === '') {
                isValid = false;
            }
            if (inputEl.type === 'tel' && !isValidPhoneNumber(inputEl.value.trim())) {
                alert('Please enter a valid phone number with 7 to 15 digits.');
                isValid = false;
            } else if (inputEl.type === 'email' && !contactId) {
                contactId = await getContactId(inputEl.value);
            }
        }
    }

    element.answered = isValid;
    return isValid;
}

function roundToZeroOrWhole(number) {
    return number <= 3 ? 0 : Math.floor(number);
}

function updateProgressBar(first = false) {
    const visibleElements = formElements.filter(el => el.isActive);
    const answeredElements = formElements.filter(el => el.answered);
    const currentIndex = visibleElements.indexOf(formElements[currentElementIndex]);
    if (currentIndex === -1) {
        return;
    }
    const totalQuestions = visibleElements.length + answeredElements.length;
    const progress = first ? 1 : ((answeredElements.length) / totalQuestions) * 100;
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progress');
    progressBar.style.width = `${progress}%`;
    progressPercent.innerText = `${roundToZeroOrWhole(progress)}%`;
    progressBar.setAttribute('aria-valuenow', progress);
}

function applyPrefillAndSkip() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('ContactId')) {
        contactId = urlParams.get('ContactId');
    }
    const skipPrequal = urlParams.get('skipPrequal') === 'true';
    let allDetailsProvided = true;

    formElements.forEach((el, index) => {
        const inputEls = el.querySelectorAll('input, select, textarea');
        const elementName = el.id === 'contact-info' ? 'contact-info' : (inputEls.length > 0 ? inputEls[0].name : null);

        if (elementName === 'contact-info') {
            inputEls.forEach(inputEl => {
                const paramName = inputEl.name;
                if (urlParams.has(paramName) && urlParams.get(paramName).trim() !== "") {
                    let value = urlParams.get(paramName);
                    if (paramName === 'inf_field_Phone1') {
                        value = value.replace(/\D/g, ''); // Strip out non-numeric characters
                    }
                    inputEl.value = value;
                    inputEl.readOnly = true;
                } else {
                    allDetailsProvided = false;
                }
            });
        }

        if (skipPrequal) {
            const prequalQuestions = ['business_type', 'areas_for_support', 'ft_pt', 'income_goal', 'household_income', 'resources_to_invest', 'other_programs', 'comitment_level', 'urgency'];
            prequalQuestions.forEach(id => {
                const elIndex = formElements.findIndex(el => el.querySelector(`[id=${id}]`));
                if (elIndex !== -1) {
                    formState[elIndex].isActive = true;
                }
            });
        } else {
            formState[index].isActive = elementName === 'contact-info';
        }
    });

    if (allDetailsProvided) {
        currentElementIndex = 2; // Start with the first question after contact-info
    }

    showQuestion(currentElementIndex, true);
}

function handleSubmit() {
    const urlParams = new URLSearchParams(window.location.search);
    let soSkip = false;
    formElements.forEach(el => {
        const inputEl = el.querySelector('input, select, textarea');
        let name = inputEl.name;
        if (inputEl.name === 'inf_field_FirstName') {
            name = 'Name';
        } else if (inputEl.name === 'inf_field_Email') {
            name = 'Email';
            soSkip = true;
        } else if (inputEl.name === 'inf_field_Phone1') {
            name = 'Phone';
        }
        if (inputEl && inputEl.value) {
            const encodedValue = inputEl.value.replace(/\+/g, '%20');
            urlParams.append(name, encodedValue);
        }
    });
    if (soSkip) {
        urlParams.append('soSkip', 1);
    }
    if (contactId) {
        urlParams.append('ContactId', contactId);
    }
    let redirectUrl = 'https://davidbayercoaching.com/ss-survey-results'; // Default thank you page
    // Add your logic to set redirectUrl based on answers here
    console.log(`${redirectUrl}?${urlParams.toString().replace(/\+/g, '%20')}`)
    window.location.href = `${redirectUrl}?${urlParams.toString()}`;
}

async function handleNextButton() {
    const currentElement = formElements[currentElementIndex];
    const valid = await validateCurrentElement(currentElement);
    if (!valid) {
        alert('Please fill in the required fields.');
        return;
    }

    const fields = currentElement.querySelectorAll('input[name], textarea[name], select[name]');
    const emailInvalid = Array.from(fields).some(field => {
        if (field.name.toLowerCase().includes('email')) {
            const email = field.value;
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regex.test(email)) {
                alert('Please enter a valid email address.');
                return true;
            }
        }
        return false;
    });
    if (emailInvalid) {
        return;
    }

    // Check conditions and update the state based on the current element
    checkConditions(currentElement);

    // Get the next active index
    const nextIndex = getNextIndex(currentElement);
    if (nextIndex === 'submit') {
        handleSubmit();
    } else {
        if (navigationHistory[navigationHistory.length - 1] !== currentElementIndex) {
            navigationHistory.push(currentElementIndex);
        }
        currentElementIndex = nextIndex;
        showQuestion(currentElementIndex);
        console.log(formElements, currentElementIndex, nextIndex);
        if (window.innerWidth <= 768) {
            document.getElementById('progressBar').scrollIntoView({ behavior: 'smooth' });
        }
    }
}

document.getElementById('nextButton').addEventListener('click', handleNextButton);
document.getElementById('backButton').addEventListener('click', handleBackButton);

document.querySelectorAll('.checkbox-button').forEach(button => {
    button.addEventListener('click', function () {
        const checkbox = this.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        this.classList.toggle('checked', checkbox.checked);
    });
});

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

applyPrefillAndSkip();

console.log('Made it to the end of the script');